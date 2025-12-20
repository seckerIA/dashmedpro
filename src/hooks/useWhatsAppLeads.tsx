import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface WhatsAppLead {
  id: number;
  number: string;
  lead_name: string | null;
  status: string | null;
  etapa: string | null;
  assunto: string | null;
  resumo: string | null;
  historico_texto: string | null;
  conversa_json: any;
  interacoes: number | null;
  ultimo_contato: string | null;
  agendado: boolean | null;
  timeout: string | null;
  "MSG Enviada": boolean | null;
  created_at: string;
  user_id: string | null;
}

const fetchWhatsAppLeads = async (userId: string): Promise<WhatsAppLead[]> => {
  const { data, error } = await supabase
    .from('BDR_PROSPECÇÃO')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw new Error(`Erro ao buscar leads do WhatsApp: ${error.message}`);
  return (data || []) as WhatsAppLead[];
};

export function useWhatsAppLeads() {
  const { user } = useAuth();

  const { data: leads = [], isLoading, error } = useQuery({
    queryKey: ['whatsapp-leads', user?.id],
    queryFn: () => fetchWhatsAppLeads(user!.id),
    enabled: !!user,
  });

  return {
    leads,
    isLoading,
    error,
  };
}



