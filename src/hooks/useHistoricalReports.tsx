import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';

interface HistoricalReport {
  id: string;
  user_id: string;
  date: string;
  goal_calls: number;
  goal_contacts: number;
  final_calls: number | null;
  final_contacts: number | null;
  started_at: string;
  finished_at: string | null;
  status: string;
  is_paused: boolean | null;
  total_paused_time: number | null;
  created_at: string;
  updated_at: string | null;
  user_profile?: {
    full_name: string;
    email: string;
  };
}

interface HistoricalReportsFilters {
  startDate?: string;
  endDate?: string;
  userId?: string;
}

interface HistoricalStats {
  totalReports: number;
  totalCalls: number;
  totalContacts: number;
  averageCalls: number;
  averageContacts: number;
  bestDay: {
    date: string;
    calls: number;
    contacts: number;
  } | null;
  conversionRate: number;
}

export function useHistoricalReports(filters: HistoricalReportsFilters = {}) {
  const { user } = useAuth();
  const { isAdmin } = useUserProfile();

  const { data: reports, isLoading, error } = useQuery({
    queryKey: ['historical-reports', user?.id, filters],
    queryFn: async () => {
      if (!user?.id) return [];

      // Query 1: Buscar relatórios
      let reportsQuery = supabase
        .from('prospecting_daily_reports')
        .select('*')
        .order('date', { ascending: false });

      // Se não for admin, só mostra dados do próprio usuário
      if (!isAdmin) {
        reportsQuery = reportsQuery.eq('user_id', user.id);
      } else if (filters.userId && filters.userId !== 'all') {
        // Se for admin e especificou um usuário válido
        reportsQuery = reportsQuery.eq('user_id', filters.userId);
      }

      // Aplicar filtros de data
      if (filters.startDate) {
        reportsQuery = reportsQuery.gte('date', filters.startDate);
      }
      if (filters.endDate) {
        reportsQuery = reportsQuery.lte('date', filters.endDate);
      }

      const { data: reportsData, error: reportsError } = await reportsQuery;

      if (reportsError) {
        console.error('Erro ao buscar relatórios históricos:', reportsError);
        throw reportsError;
      }

      if (!reportsData || reportsData.length === 0) {
        return [];
      }

      // Query 2: Buscar perfis dos usuários únicos
      const uniqueUserIds = [...new Set(reportsData.map(r => r.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', uniqueUserIds);

      if (profilesError) {
        console.error('Erro ao buscar perfis:', profilesError);
        // Não falha a operação se não conseguir buscar perfis
      }

      // Mapear perfis por ID para fácil acesso
      const profilesMap = new Map(
        (profilesData || []).map(profile => [profile.id, profile])
      );

      // Combinar dados
      const combinedData: HistoricalReport[] = reportsData.map(report => ({
        ...report,
        user_profile: profilesMap.get(report.user_id) ? {
          full_name: profilesMap.get(report.user_id)!.full_name || '',
          email: profilesMap.get(report.user_id)!.email,
        } : undefined,
      }));

      return combinedData;
    },
    enabled: !!user?.id,
  });

  // Calcular estatísticas
  const stats: HistoricalStats | null = reports ? {
    totalReports: reports.length,
    totalCalls: reports.reduce((sum, report) => sum + (report.final_calls || 0), 0),
    totalContacts: reports.reduce((sum, report) => sum + (report.final_contacts || 0), 0),
    averageCalls: reports.length > 0 ? reports.reduce((sum, report) => sum + (report.final_calls || 0), 0) / reports.length : 0,
    averageContacts: reports.length > 0 ? reports.reduce((sum, report) => sum + (report.final_contacts || 0), 0) / reports.length : 0,
    bestDay: reports.length > 0 ? (() => {
      const bestReport = reports.reduce((best, report) => {
        const currentTotal = (report.final_calls || 0) + (report.final_contacts || 0);
        const bestTotal = (best.final_calls || 0) + (best.final_contacts || 0);
        return currentTotal > bestTotal ? report : best;
      });
      return {
        date: bestReport.date,
        calls: bestReport.final_calls || 0,
        contacts: bestReport.final_contacts || 0,
      };
    })() : null,
    conversionRate: reports.length > 0 ? (() => {
      const totalCalls = reports.reduce((sum, report) => sum + (report.final_calls || 0), 0);
      const totalContacts = reports.reduce((sum, report) => sum + (report.final_contacts || 0), 0);
      return totalCalls > 0 ? (totalContacts / totalCalls) * 100 : 0;
    })() : 0,
  } : null;

  // Função para exportar CSV
  const exportToCSV = () => {
    if (!reports || reports.length === 0) return;

    const headers = [
      'Data',
      'Usuário',
      'Meta Atendimentos',
      'Meta Contatos',
      'Atendimentos Realizados',
      'Contatos Realizados',
      'Taxa Conversão (%)',
      'Status',
      'Iniciado em',
      'Finalizado em',
      'Tempo Pausado (min)'
    ];

    const csvContent = [
      headers.join(','),
      ...reports.map(report => [
        report.date,
        report.user_profile?.full_name || report.user_profile?.email || 'N/A',
        report.goal_calls,
        report.goal_contacts,
        report.final_calls || 0,
        report.final_contacts || 0,
        report.final_calls && report.final_calls > 0 
          ? ((report.final_contacts || 0) / report.final_calls * 100).toFixed(2)
          : '0.00',
        report.status === 'completed' ? 'Finalizado' : 'Ativo',
        new Date(report.started_at).toLocaleString('pt-BR'),
        report.finished_at ? new Date(report.finished_at).toLocaleString('pt-BR') : 'N/A',
        report.total_paused_time || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorios_prospeccao_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    reports,
    stats,
    isLoading,
    error,
    exportToCSV,
  };
}
