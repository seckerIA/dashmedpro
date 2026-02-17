import { Database } from '@/integrations/supabase/types';

// Base type from generated schema
type ProspectingScriptRow = Database['public']['Tables']['prospecting_scripts']['Row'];

// Extended type with DB columns missing from generated types
export type ProspectingScript = ProspectingScriptRow & {
  cards?: any;
  is_public?: boolean;
  is_copy?: boolean;
  original_script_id?: string | null;
};
export type ProspectingScriptInsert = Database['public']['Tables']['prospecting_scripts']['Insert'] & Record<string, any>;
export type ProspectingScriptUpdate = Database['public']['Tables']['prospecting_scripts']['Update'] & Record<string, any>;

export type ProspectingSession = Database['public']['Tables']['prospecting_sessions']['Row'];
export type ProspectingSessionInsert = Database['public']['Tables']['prospecting_sessions']['Insert'];
export type ProspectingSessionUpdate = Database['public']['Tables']['prospecting_sessions']['Update'];

// Extended DailyReport type with DB columns missing from generated types
type DailyReportRow = Database['public']['Tables']['prospecting_daily_reports']['Row'];
export type DailyReport = DailyReportRow & {
  goal_calls?: number;
  goal_contacts?: number;
  final_calls?: number;
  final_contacts?: number;
  started_at?: string;
  finished_at?: string | null;
  status?: string;
};
export type DailyReportInsert = Database['public']['Tables']['prospecting_daily_reports']['Insert'] & Record<string, any>;
export type DailyReportUpdate = Database['public']['Tables']['prospecting_daily_reports']['Update'] & Record<string, any>;

// Tipos para os cards
export type CardType = 'script' | 'objection';

export interface ScriptCard {
  id: string;
  type: CardType;
  content: string;
  order: number;
}

// Tipo para resultado da sessão
export type SessionResult = 'atendimento_encerrado' | 'contato_decisor';

// Tipo estendido com informações extras
export interface ProspectingScriptWithStats extends ProspectingScript {
  totalSessions?: number;
  successRate?: number;
}

// Tipo para informações do criador do script
export interface ScriptCreator {
  id: string;
  full_name: string | null;
  email: string;
}

// Tipo estendido com informações do criador
export interface ProspectingScriptWithCreator extends ProspectingScript {
  creator?: ScriptCreator;
}

// Tipo para status do relatório diário
export type DailyReportStatus = 'active' | 'completed';

// Tipo para métricas calculadas do relatório
export interface DailyMetrics {
  // Contadores
  totalCalls: number;
  totalContacts: number;
  
  // Metas
  goalCalls: number;
  goalContacts: number;
  
  // Progresso (percentual)
  callsProgress: number;
  contactsProgress: number;
  
  // Tempo
  elapsedTimeMinutes: number;
  elapsedTimeFormatted: string;
  
  // Status
  isActive: boolean;
  isPaused: boolean;
  reportId?: string;
}

// Tipo para metas padrão do usuário
export interface UserDailyGoals {
  id: string;
  user_id: string;
  default_goal_calls: number;
  default_goal_contacts: number;
  created_at: string;
  updated_at: string;
}

export type UserDailyGoalsInsert = Omit<UserDailyGoals, 'id' | 'created_at' | 'updated_at'>;
export type UserDailyGoalsUpdate = Partial<Omit<UserDailyGoals, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

