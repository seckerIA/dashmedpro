import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';

interface HistoricalReport {
  id: string;
  user_id: string;
  report_date: string;
  calls_made: number;
  contacts_reached: number;
  appointments_set: number;
  deals_closed: number;
  revenue: number;
  notes: string | null;
  is_paused: boolean | null;
  paused_at: string | null;
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
      let reportsQuery = (supabase
        .from('prospecting_daily_reports' as any) as any)
        .select('*')
        .order('report_date', { ascending: false });

      // Se não for admin, só mostra dados do próprio usuário
      if (!isAdmin) {
        reportsQuery = reportsQuery.eq('user_id', user.id);
      } else if (filters.userId && filters.userId !== 'all') {
        // Se for admin e especificou um usuário válido
        reportsQuery = reportsQuery.eq('user_id', filters.userId);
      }

      // Aplicar filtros de data
      if (filters.startDate) {
        reportsQuery = reportsQuery.gte('report_date', filters.startDate);
      }
      if (filters.endDate) {
        reportsQuery = reportsQuery.lte('report_date', filters.endDate);
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
      const uniqueUserIds = [...new Set((reportsData as any[]).map((r: any) => r.user_id))] as string[];
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
      const combinedData: HistoricalReport[] = (reportsData as any[]).map((report: any) => ({
        ...report,
        user_profile: profilesMap.get(report.user_id) ? {
          full_name: (profilesMap.get(report.user_id) as any)!.full_name || '',
          email: (profilesMap.get(report.user_id) as any)!.email,
        } : undefined,
      }));

      return combinedData;
    },
    enabled: !!user?.id,
  });

  // Calcular estatísticas
  const stats: HistoricalStats | null = reports ? {
    totalReports: reports.length,
    totalCalls: reports.reduce((sum, report) => sum + (report.calls_made || 0), 0),
    totalContacts: reports.reduce((sum, report) => sum + (report.contacts_reached || 0), 0),
    averageCalls: reports.length > 0 ? reports.reduce((sum, report) => sum + (report.calls_made || 0), 0) / reports.length : 0,
    averageContacts: reports.length > 0 ? reports.reduce((sum, report) => sum + (report.contacts_reached || 0), 0) / reports.length : 0,
    bestDay: reports.length > 0 ? (() => {
      const bestReport = reports.reduce((best, report) => {
        const currentTotal = (report.calls_made || 0) + (report.contacts_reached || 0);
        const bestTotal = (best.calls_made || 0) + (best.contacts_reached || 0);
        return currentTotal > bestTotal ? report : best;
      });
      return {
        date: bestReport.report_date,
        calls: bestReport.calls_made || 0,
        contacts: bestReport.contacts_reached || 0,
      };
    })() : null,
    conversionRate: reports.length > 0 ? (() => {
      const totalCalls = reports.reduce((sum, report) => sum + (report.calls_made || 0), 0);
      const totalContacts = reports.reduce((sum, report) => sum + (report.contacts_reached || 0), 0);
      return totalCalls > 0 ? (totalContacts / totalCalls) * 100 : 0;
    })() : 0,
  } : null;

  // Função para exportar CSV
  const exportToCSV = () => {
    if (!reports || reports.length === 0) return;

    const headers = [
      'Data',
      'Usuário',
      'Ligações Feitas',
      'Contatos Alcançados',
      'Consultas Agendadas',
      'Negócios Fechados',
      'Receita',
      'Taxa Conversão (%)',
      'Pausado?',
      'Tempo Pausado (min)',
    ];

    const csvContent = [
      headers.join(','),
      ...reports.map(report => [
        report.report_date,
        report.user_profile?.full_name || report.user_profile?.email || 'N/A',
        report.calls_made || 0,
        report.contacts_reached || 0,
        report.appointments_set || 0,
        report.deals_closed || 0,
        report.revenue || 0,
        report.calls_made && report.calls_made > 0 
          ? ((report.contacts_reached || 0) / report.calls_made * 100).toFixed(2)
          : '0.00',
        report.is_paused ? 'Sim' : 'Não',
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
