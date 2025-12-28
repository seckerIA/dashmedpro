export interface ReactivationCampaign {
  id: string;
  user_id: string;
  name: string;
  inactive_period_months: number;
  enabled: boolean;
  message_templates: ReactivationTemplate[];
  schedule_config: {
    preferred_hours: number[];
    timezone: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface ReactivationTemplate {
  variant: 'variant_a' | 'variant_b';
  content: string;
  variables: string[]; // ['{{nome}}', '{{ultima_visita}}']
}

export interface ReactivationMessage {
  id: string;
  campaign_id: string;
  contact_id: string;
  template_variant: string;
  message_content: string;
  channel: 'whatsapp' | 'sms' | 'email';
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  sent_at?: string | null;
  delivered_at?: string | null;
  read_at?: string | null;
  response_received: boolean;
  response_received_at?: string | null;
  appointment_scheduled: boolean;
  appointment_id?: string | null;
  created_at?: string;
}

export interface ReactivationCampaignStats {
  campaign_id: string;
  total_sent: number;
  total_delivered: number;
  total_read: number;
  total_responses: number;
  total_appointments: number;
  response_rate: number;
  appointment_rate: number;
  variant_a_stats: {
    sent: number;
    responses: number;
    appointments: number;
  };
  variant_b_stats: {
    sent: number;
    responses: number;
    appointments: number;
  };
}

export interface EligibleContact {
  contact_id: string;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  last_appointment_at?: string | null;
  months_inactive: number;
  reactivation_last_sent_at?: string | null;
}

export const DEFAULT_REACTIVATION_TEMPLATE: ReactivationTemplate = {
  variant: 'variant_a',
  content: 'Olá {{nome}}, ficamos com saudade! 😊\n\nNotamos que você não nos visita há algum tempo. Gostaríamos de saber como você está e se gostaria de agendar uma consulta de retorno.\n\n{{link_agendamento}}\n\nEstamos à disposição!',
  variables: ['{{nome}}', '{{link_agendamento}}'],
};

export const DEFAULT_REACTIVATION_TEMPLATE_B: ReactivationTemplate = {
  variant: 'variant_b',
  content: '{{nome}}, que tal retomar seus cuidados?\n\nSua última consulta foi há algum tempo. Que tal agendar um retorno? Temos horários disponíveis esta semana.\n\n{{link_agendamento}}\n\nAguardamos seu contato!',
  variables: ['{{nome}}', '{{link_agendamento}}'],
};


