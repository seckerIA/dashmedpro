import { CRMContact, CRMDeal } from './crm';

export type SalesCallStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show';

export interface SalesCall {
  id: string;
  user_id: string;
  contact_id: string;
  deal_id?: string | null;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  status: SalesCallStatus;
  notes?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SalesCallWithRelations extends SalesCall {
  contact: CRMContact;
  deal?: CRMDeal | null;
}

export interface SalesCallInsert {
  user_id: string;
  contact_id: string;
  deal_id?: string | null;
  title: string;
  scheduled_at: string;
  duration_minutes?: number;
  status?: SalesCallStatus;
  notes?: string | null;
}

export interface SalesCallUpdate {
  title?: string;
  scheduled_at?: string;
  duration_minutes?: number;
  status?: SalesCallStatus;
  notes?: string | null;
  completed_at?: string | null;
}

export const CALL_STATUS_LABELS: Record<SalesCallStatus, string> = {
  scheduled: 'Agendada',
  completed: 'Realizada',
  cancelled: 'Cancelada',
  no_show: 'Não Compareceu'
};

export const CALL_STATUS_COLORS: Record<SalesCallStatus, { bg: string; text: string; border: string }> = {
  scheduled: {
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    text: 'text-blue-900 dark:text-blue-100',
    border: 'border-blue-200 dark:border-blue-700'
  },
  completed: {
    bg: 'bg-green-50 dark:bg-green-900/30',
    text: 'text-green-900 dark:text-green-100',
    border: 'border-green-200 dark:border-green-700'
  },
  cancelled: {
    bg: 'bg-gray-50 dark:bg-gray-800/30',
    text: 'text-gray-900 dark:text-gray-100',
    border: 'border-gray-200 dark:border-gray-700'
  },
  no_show: {
    bg: 'bg-red-50 dark:bg-red-900/30',
    text: 'text-red-900 dark:text-red-100',
    border: 'border-red-200 dark:border-red-700'
  }
};

