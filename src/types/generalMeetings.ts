/**
 * Tipos e constantes para reuniões gerais (general_meetings)
 */

// Tipos de reunião
export type MeetingType = 'meeting' | 'appointment' | 'block' | 'other';

// Status de reunião
export type MeetingStatus = 'scheduled' | 'completed' | 'cancelled';

// Interface principal para reunião
export interface GeneralMeeting {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  location?: string | null;
  meeting_type: MeetingType;
  is_busy: boolean;
  attendees?: string[] | null;
  notes?: string | null;
  status: MeetingStatus;
  created_at: string;
  updated_at: string;
}

// Tipo para inserção (campos opcionais exceto os obrigatórios)
export type GeneralMeetingInsert = Omit<GeneralMeeting, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

// Tipo para atualização (todos os campos opcionais exceto id)
export type GeneralMeetingUpdate = Partial<Omit<GeneralMeeting, 'id' | 'created_at'>> & {
  id: string;
};

// Labels para tipos de reunião
export const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  meeting: 'Reunião',
  appointment: 'Compromisso',
  block: 'Bloqueio',
  other: 'Outro',
};

// Labels para status de reunião
export const MEETING_STATUS_LABELS: Record<MeetingStatus, string> = {
  scheduled: 'Agendada',
  completed: 'Concluída',
  cancelled: 'Cancelada',
};

// Cores para tipos de reunião
export const MEETING_TYPE_COLORS: Record<
  MeetingType,
  { bg: string; text: string; border: string }
> = {
  meeting: {
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    text: 'text-blue-900 dark:text-blue-100',
    border: 'border-blue-200 dark:border-blue-700',
  },
  appointment: {
    bg: 'bg-purple-50 dark:bg-purple-900/30',
    text: 'text-purple-900 dark:text-purple-100',
    border: 'border-purple-200 dark:border-purple-700',
  },
  block: {
    bg: 'bg-orange-50 dark:bg-orange-900/30',
    text: 'text-orange-900 dark:text-orange-100',
    border: 'border-orange-200 dark:border-orange-700',
  },
  other: {
    bg: 'bg-gray-50 dark:bg-gray-800/30',
    text: 'text-gray-900 dark:text-gray-100',
    border: 'border-gray-200 dark:border-gray-700',
  },
};

// Cores para status de reunião
export const MEETING_STATUS_COLORS: Record<
  MeetingStatus,
  { bg: string; text: string; border: string }
> = {
  scheduled: {
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    text: 'text-blue-900 dark:text-blue-100',
    border: 'border-blue-200 dark:border-blue-700',
  },
  completed: {
    bg: 'bg-green-50 dark:bg-green-900/30',
    text: 'text-green-900 dark:text-green-100',
    border: 'border-green-200 dark:border-green-700',
  },
  cancelled: {
    bg: 'bg-red-50 dark:bg-red-900/30',
    text: 'text-red-900 dark:text-red-100',
    border: 'border-red-200 dark:border-red-700',
  },
};

// Opções de duração (em minutos)
export const DURATION_OPTIONS = [
  { value: 15, label: '15 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1 hora e 30 minutos' },
  { value: 120, label: '2 horas' },
  { value: 180, label: '3 horas' },
  { value: 240, label: '4 horas' },
] as const;
