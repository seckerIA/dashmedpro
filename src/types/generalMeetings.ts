export type MeetingType = 'meeting' | 'appointment' | 'block' | 'other';
export type MeetingStatus = 'scheduled' | 'completed' | 'cancelled';

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

export interface GeneralMeetingInsert {
  user_id: string;
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  location?: string | null;
  meeting_type?: MeetingType;
  is_busy?: boolean;
  attendees?: string[] | null;
  notes?: string | null;
  status?: MeetingStatus;
}

export interface GeneralMeetingUpdate {
  title?: string;
  description?: string | null;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  location?: string | null;
  meeting_type?: MeetingType;
  is_busy?: boolean;
  attendees?: string[] | null;
  notes?: string | null;
  status?: MeetingStatus;
}

// Labels para UI
export const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  meeting: 'Reunião',
  appointment: 'Compromisso',
  block: 'Bloqueio de Tempo',
  other: 'Outro',
};

export const MEETING_STATUS_LABELS: Record<MeetingStatus, string> = {
  scheduled: 'Agendado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

// Cores para diferentes tipos de reunião
export const MEETING_TYPE_COLORS: Record<MeetingType, { bg: string; text: string; border: string }> = {
  meeting: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-500/20',
  },
  appointment: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500/20',
  },
  block: {
    bg: 'bg-gray-500/10',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-500/20',
  },
  other: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-500/20',
  },
};

export const MEETING_STATUS_COLORS: Record<MeetingStatus, { bg: string; text: string; border: string }> = {
  scheduled: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/20',
  },
  completed: {
    bg: 'bg-green-500/10',
    text: 'text-green-600 dark:text-green-400',
    border: 'border-green-500/20',
  },
  cancelled: {
    bg: 'bg-gray-500/10',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-500/20',
  },
};

// Duration options (in minutes) - same as medical appointments
export const DURATION_OPTIONS = [
  { value: 15, label: '15 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1 hora e 30 minutos' },
  { value: 120, label: '2 horas' },
] as const;

