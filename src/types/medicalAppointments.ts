import {
  UserPlus,
  RefreshCw,
  Stethoscope,
  AlertCircle,
  HeartPulse,
  FlaskConical,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck,
  XCircle,
  UserX,
  LucideIcon
} from 'lucide-react';
import { CRMContact } from './crm';

// Enums matching database
export type AppointmentType =
  | 'first_visit'
  | 'return'
  | 'procedure'
  | 'urgent'
  | 'follow_up'
  | 'exam';

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'partial'
  | 'cancelled';

// Main interface
export interface MedicalAppointment {
  id: string;
  user_id: string;
  doctor_id?: string | null;
  contact_id: string;

  title: string;
  appointment_type: AppointmentType;
  status: AppointmentStatus;

  start_time: string;
  end_time: string;
  duration_minutes: number;

  notes?: string | null;
  internal_notes?: string | null;

  estimated_value?: number | null;
  payment_status: PaymentStatus;
  financial_transaction_id?: string | null;
  paid_in_advance?: boolean;

  // Campos de Sinal (entrada/depósito)
  sinal_amount?: number | null;
  sinal_paid?: boolean;
  sinal_receipt_url?: string | null;
  sinal_paid_at?: string | null;

  completed_at?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;

  created_at: string;
  updated_at: string;
}

// Doctor info for display
export interface DoctorInfo {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
}

// With relations for display
export interface MedicalAppointmentWithRelations extends MedicalAppointment {
  contact: CRMContact | null;
  doctor?: DoctorInfo | null;
  financial_transaction?: {
    id: string;
    description: string;
    amount: number;
    type: string;
  } | null;
}

// Insert type
export interface MedicalAppointmentInsert {
  user_id: string;
  doctor_id?: string | null;
  contact_id: string;
  title: string;
  appointment_type: AppointmentType;
  status?: AppointmentStatus;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  notes?: string | null;
  internal_notes?: string | null;
  estimated_value?: number | null;
  payment_status?: PaymentStatus;
  financial_transaction_id?: string | null;
  paid_in_advance?: boolean;
  // Campos de Sinal
  sinal_amount?: number | null;
  sinal_paid?: boolean;
  sinal_receipt_url?: string | null;
  sinal_paid_at?: string | null;
}

// Update type
export interface MedicalAppointmentUpdate {
  doctor_id?: string | null;
  title?: string;
  appointment_type?: AppointmentType;
  status?: AppointmentStatus;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  notes?: string | null;
  internal_notes?: string | null;
  estimated_value?: number | null;
  payment_status?: PaymentStatus;
  financial_transaction_id?: string | null;
  paid_in_advance?: boolean;
  // Campos de Sinal
  sinal_amount?: number | null;
  sinal_paid?: boolean;
  sinal_receipt_url?: string | null;
  sinal_paid_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
}

// Labels for UI
export const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  first_visit: 'Primeira Consulta',
  return: 'Retorno',
  procedure: 'Procedimento',
  urgent: 'Urgência',
  follow_up: 'Acompanhamento',
  exam: 'Exame',
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  in_progress: 'Em Andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show: 'Não Compareceu',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  partial: 'Parcial',
  cancelled: 'Cancelado',
};

// Icons for appointment types
export const APPOINTMENT_TYPE_ICONS: Record<AppointmentType, LucideIcon> = {
  first_visit: UserPlus,
  return: RefreshCw,
  procedure: Stethoscope,
  urgent: AlertCircle,
  follow_up: HeartPulse,
  exam: FlaskConical,
};

// Icons for status
export const APPOINTMENT_STATUS_ICONS: Record<AppointmentStatus, LucideIcon> = {
  scheduled: Calendar,
  confirmed: CheckCircle2,
  in_progress: Clock,
  completed: FileCheck,
  cancelled: XCircle,
  no_show: UserX,
};

// Duration options (in minutes)
export const DURATION_OPTIONS = [
  { value: 15, label: '15 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1 hora e 30 minutos' },
  { value: 120, label: '2 horas' },
] as const;

// Time slots for appointment selection (15-min increments from 07:00 to 20:00)
export const generateTimeSlots = (): string[] => {
  const slots: string[] = [];
  for (let hour = 7; hour < 20; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const hourStr = hour.toString().padStart(2, '0');
      const minuteStr = minute.toString().padStart(2, '0');
      slots.push(`${hourStr}:${minuteStr}`);
    }
  }
  return slots;
};
