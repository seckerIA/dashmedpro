// Tipos para Follow-ups
export interface FollowUp {
  id: string;
  deal_id: string;
  user_id: string;
  scheduled_date: string;
  scheduled_time: string; // This might be virtual if DB has timestamp, but let's keep for now if front uses it. DB has `scheduled_date` as timestamp.
  notes: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateFollowUpData {
  deal_id: string;
  scheduled_date: string;
  notes?: string;
}

export interface UpdateFollowUpData {
  scheduled_date?: string;
  notes?: string;
  completed?: boolean;
}
