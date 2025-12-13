// Tipos para Follow-ups
export interface FollowUp {
  id: string;
  deal_id: string;
  user_id: string;
  scheduled_date: string;
  scheduled_time: string;
  description: string | null;
  status: 'pendente' | 'concluido' | 'cancelado';
  completed_at: string | null;
  completed_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateFollowUpData {
  deal_id: string;
  scheduled_date: string;
  scheduled_time: string;
  description?: string;
}

export interface UpdateFollowUpData {
  scheduled_date?: string;
  scheduled_time?: string;
  description?: string;
  status?: 'pendente' | 'concluido' | 'cancelado';
  completed_notes?: string;
}
