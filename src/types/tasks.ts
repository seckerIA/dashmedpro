import { Database } from '@/integrations/supabase/types';

// Tipos baseados na tabela tasks do Supabase
export type Task = Database['public']['Tables']['tasks']['Row'];
export type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
export type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

// Enums para prioridade, status e categoria
export type TaskPriority = Database['public']['Enums']['task_priority'];
export type TaskStatus = Database['public']['Enums']['task_status'];
export type TaskCategory = Database['public']['Enums']['task_category'];

// Tipos para atribuições múltiplas
export interface TaskAssignment {
  id: string;
  task_id: string;
  user_id: string;
  assigned_at: string;
  assigned_by: string | null;
  status: TaskStatus;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  assigned_user_profile?: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
  assigned_by_profile?: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
}

// Tipos auxiliares para o frontend
export interface TaskWithProfile extends Task {
  created_by_profile?: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
  assigned_to_profile?: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
  // Novos campos para múltiplas atribuições
  assignments?: TaskAssignment[];
  my_assignment?: TaskAssignment | null;
}

// Interface para tarefas com dados do CRM
export interface TaskWithCRM extends TaskWithProfile {
  deal?: {
    id: string;
    title: string;
    value: number | null;
    stage: string;
  } | null;
  contact?: {
    id: string;
    full_name: string | null;
    email: string | null;
    company: string | null;
  } | null;
}

// Interface para criação de tarefa no frontend
export interface CreateTaskData {
  title: string;
  description?: string;
  due_date?: string;
  priority?: TaskPriority;
  assigned_to?: string; // Mantido para compatibilidade
  assigned_to_users?: string[]; // Novo campo para múltiplas atribuições
  category?: TaskCategory;
  deal_id?: string;
  contact_id?: string;
  image_url?: string;
}

// Interface para atualização de tarefa no frontend
export interface UpdateTaskData {
  title?: string;
  description?: string;
  due_date?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  assigned_to?: string; // Mantido para compatibilidade
  assigned_to_users?: string[]; // Novo campo para múltiplas atribuições
  position?: number;
  category?: TaskCategory;
  deal_id?: string;
  contact_id?: string;
  image_url?: string;
}

// Interface para atualização de atribuição individual
export interface UpdateAssignmentData {
  status?: TaskStatus;
  completed_at?: string | null;
}

// Constantes para prioridades
export const TASK_PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'baixa', label: 'Baixa', color: 'text-green-600' },
  { value: 'media', label: 'Média', color: 'text-yellow-600' },
  { value: 'alta', label: 'Alta', color: 'text-red-600' },
];

// Constantes para status
export const TASK_STATUSES: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'pendente', label: 'Pendente', color: 'text-orange-600' },
  { value: 'concluida', label: 'Concluída', color: 'text-green-600' },
];

// Constantes para categorias
export const TASK_CATEGORIES: { value: TaskCategory; label: string; color: string }[] = [
  { value: 'comercial', label: 'Comercial', color: 'text-blue-600' },
  { value: 'marketing', label: 'Marketing', color: 'text-purple-600' },
  { value: 'financeiro', label: 'Financeiro', color: 'text-green-600' },
  { value: 'social_media', label: 'Social Mídia', color: 'text-pink-600' },
  { value: 'empresarial', label: 'Empresarial', color: 'text-amber-600' },
];
