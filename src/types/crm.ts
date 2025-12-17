import { Database } from '@/integrations/supabase/types';
import { 
  UserPlus, 
  CheckCircle, 
  Presentation, 
  FileText, 
  MessageSquare, 
  Trophy, 
  XCircle,
  Phone,
  Mail,
  MessageCircle,
  Users,
  StickyNote,
  CheckSquare,
  Bot,
  LucideIcon
} from 'lucide-react';

// Tipos baseados nas tabelas CRM do Supabase
export type CRMContact = Database['public']['Tables']['crm_contacts']['Row'];
export type CRMContactInsert = Database['public']['Tables']['crm_contacts']['Insert'];
export type CRMContactUpdate = Database['public']['Tables']['crm_contacts']['Update'];

export type CRMDeal = Database['public']['Tables']['crm_deals']['Row'];
export type CRMDealInsert = Database['public']['Tables']['crm_deals']['Insert'];
export type CRMDealUpdate = Database['public']['Tables']['crm_deals']['Update'];

export type CRMActivity = Database['public']['Tables']['crm_activities']['Row'];
export type CRMActivityInsert = Database['public']['Tables']['crm_activities']['Insert'];
export type CRMActivityUpdate = Database['public']['Tables']['crm_activities']['Update'];

// Enums
export type CRMPipelineStage = Database['public']['Enums']['crm_pipeline_stage'];
export type CRMActivityType = Database['public']['Enums']['crm_activity_type'];
export type HealthInsuranceType = 'convenio' | 'particular';
export type PatientGender = 'masculino' | 'feminino' | 'outro' | 'prefiro_nao_dizer';

// Tipos auxiliares para o frontend
export interface CRMDealWithContact extends CRMDeal {
  contact?: CRMContact | null;
  owner_profile?: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
  assigned_to_profile?: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
}

export interface CRMContactWithDeals extends CRMContact {
  deals?: CRMDeal[];
  activities?: CRMActivity[];
}

// Constantes para estágios do pipeline
export const PIPELINE_STAGES: { 
  value: CRMPipelineStage; 
  label: string; 
  color: string;
  icon: LucideIcon;
  bgColor: string;
  textColor: string;
}[] = [
  { 
    value: 'lead_novo', 
    label: 'Lead Novo', 
    color: 'bg-slate-500', 
    icon: UserPlus,
    bgColor: 'bg-slate-500/10',
    textColor: 'text-slate-400'
  },
  { 
    value: 'qualificado', 
    label: 'Qualificado', 
    color: 'bg-blue-500', 
    icon: CheckCircle,
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400'
  },
  { 
    value: 'apresentacao', 
    label: 'Apresentação', 
    color: 'bg-purple-500', 
    icon: Presentation,
    bgColor: 'bg-purple-500/10',
    textColor: 'text-purple-400'
  },
  { 
    value: 'proposta', 
    label: 'Proposta', 
    color: 'bg-orange-500', 
    icon: FileText,
    bgColor: 'bg-orange-500/10',
    textColor: 'text-orange-400'
  },
  { 
    value: 'negociacao', 
    label: 'Negociação', 
    color: 'bg-yellow-500', 
    icon: MessageSquare,
    bgColor: 'bg-yellow-500/10',
    textColor: 'text-yellow-400'
  },
  { 
    value: 'fechado_ganho', 
    label: 'Fechado Ganho', 
    color: 'bg-green-500', 
    icon: Trophy,
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-400'
  },
  { 
    value: 'fechado_perdido', 
    label: 'Fechado Perdido', 
    color: 'bg-red-500', 
    icon: XCircle,
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-400'
  },
];

// Constantes para tipos de atividade
export const ACTIVITY_TYPES: {
  value: CRMActivityType;
  label: string;
  icon: LucideIcon;
  bgColor: string;
  textColor: string;
}[] = [
  { 
    value: 'call', 
    label: 'Ligação', 
    icon: Phone,
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400'
  },
  { 
    value: 'email', 
    label: 'E-mail', 
    icon: Mail,
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-400'
  },
  { 
    value: 'whatsapp', 
    label: 'WhatsApp', 
    icon: MessageCircle,
    bgColor: 'bg-green-600/10',
    textColor: 'text-green-500'
  },
  { 
    value: 'meeting', 
    label: 'Reunião', 
    icon: Users,
    bgColor: 'bg-purple-500/10',
    textColor: 'text-purple-400'
  },
  { 
    value: 'note', 
    label: 'Nota', 
    icon: StickyNote,
    bgColor: 'bg-yellow-500/10',
    textColor: 'text-yellow-400'
  },
  { 
    value: 'task', 
    label: 'Tarefa', 
    icon: CheckSquare,
    bgColor: 'bg-orange-500/10',
    textColor: 'text-orange-400'
  },
  {
    value: 'ai_interaction',
    label: 'Interação IA',
    icon: Bot,
    bgColor: 'bg-indigo-500/10',
    textColor: 'text-indigo-400'
  },
];

// Constantes para tipo de convênio
export const INSURANCE_TYPES: {
  value: HealthInsuranceType;
  label: string;
}[] = [
  { value: 'particular', label: 'Particular' },
  { value: 'convenio', label: 'Convênio' },
];

// Constantes para gênero
export const PATIENT_GENDERS: {
  value: PatientGender;
  label: string;
}[] = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'feminino', label: 'Feminino' },
  { value: 'outro', label: 'Outro' },
  { value: 'prefiro_nao_dizer', label: 'Prefiro não dizer' },
];
