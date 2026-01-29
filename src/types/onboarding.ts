/**
 * Onboarding Types
 * Types for the customer onboarding wizard flow
 */

// ============================================
// Clinic Data (Step 1)
// ============================================
export interface OnboardingClinicData {
  name: string;
  slug: string;
  phone: string;
  city: string;
}

// ============================================
// Doctor Data (Step 2)
// ============================================
export interface OnboardingDoctorData {
  fullName: string;
  specialty: string;
  consultationValue: number;
}

// ============================================
// Procedure Data (Step 3)
// ============================================
export interface OnboardingProcedure {
  id: string;
  name: string;
  category: 'consultation' | 'procedure' | 'exam' | 'surgery' | 'other';
  price: number;
  durationMinutes: number;
  description?: string;
  isSelected: boolean;
  isCustom?: boolean;
}

// ============================================
// Team Member (Step 4)
// ============================================
export interface OnboardingTeamMember {
  id: string;
  name: string;
  email: string;
  role: 'secretaria' | 'medico';
}

// ============================================
// Full Onboarding State
// ============================================
export interface OnboardingState {
  currentStep: number;
  clinicData: OnboardingClinicData;
  doctorData: OnboardingDoctorData;
  procedures: OnboardingProcedure[];
  teamMembers: OnboardingTeamMember[];
}

// ============================================
// Database Onboarding State (from onboarding_state table)
// ============================================
export interface OnboardingStateDB {
  id: string;
  user_id: string;
  current_step: number;
  clinic_data: OnboardingClinicData;
  doctor_data: OnboardingDoctorData;
  procedures_data: OnboardingProcedure[];
  team_data: OnboardingTeamMember[];
  created_at: string;
  updated_at: string;
}

// ============================================
// Specialty Procedure (from specialty_procedures table)
// ============================================
export interface SpecialtyProcedure {
  id: string;
  specialty: string;
  name: string;
  category: string;
  default_price: number;
  default_duration_minutes: number;
  description?: string;
}

// ============================================
// Medical Specialties
// ============================================
export const MEDICAL_SPECIALTIES = [
  { value: 'dermatologia', label: 'Dermatologia', emoji: '✨', color: 'from-pink-500 to-rose-500' },
  { value: 'cardiologia', label: 'Cardiologia', emoji: '❤️', color: 'from-red-500 to-pink-500' },
  { value: 'ortopedia', label: 'Ortopedia', emoji: '🦴', color: 'from-amber-500 to-orange-500' },
  { value: 'ginecologia', label: 'Ginecologia', emoji: '👩', color: 'from-pink-400 to-fuchsia-500' },
  { value: 'pediatria', label: 'Pediatria', emoji: '👶', color: 'from-green-400 to-emerald-500' },
  { value: 'clinica_geral', label: 'Clinica Geral', emoji: '🩺', color: 'from-teal-500 to-cyan-500' },
  { value: 'estetica', label: 'Estetica', emoji: '💎', color: 'from-violet-500 to-purple-500' },
  { value: 'psiquiatria', label: 'Psiquiatria', emoji: '🧠', color: 'from-purple-500 to-indigo-500' },
  { value: 'nutricao', label: 'Nutricao', emoji: '🥗', color: 'from-lime-500 to-green-500' },
  { value: 'fisioterapia', label: 'Fisioterapia', emoji: '💪', color: 'from-blue-400 to-cyan-500' },
  { value: 'oftalmologia', label: 'Oftalmologia', emoji: '👁️', color: 'from-blue-500 to-indigo-500' },
  { value: 'odontologia', label: 'Odontologia', emoji: '🦷', color: 'from-sky-400 to-blue-500' },
  { value: 'cirurgia_plastica', label: 'Cirurgia Plastica', emoji: '💉', color: 'from-fuchsia-500 to-pink-500' },
  { value: 'neurologia', label: 'Neurologia', emoji: '🧬', color: 'from-indigo-500 to-purple-500' },
  { value: 'outras', label: 'Outras', emoji: '➕', color: 'from-slate-500 to-gray-500' },
] as const;

export type MedicalSpecialty = typeof MEDICAL_SPECIALTIES[number]['value'];

// ============================================
// Onboarding Step Info
// ============================================
export const ONBOARDING_STEPS = [
  { step: 1, title: 'Sua Clinica', description: 'Informacoes basicas da clinica' },
  { step: 2, title: 'Seu Perfil', description: 'Seus dados e especialidade' },
  { step: 3, title: 'Procedimentos', description: 'Servicos que voce oferece' },
  { step: 4, title: 'Equipe', description: 'Convide sua equipe (opcional)' },
  { step: 5, title: 'Confirmacao', description: 'Revise e finalize' },
] as const;

export const TOTAL_ONBOARDING_STEPS = ONBOARDING_STEPS.length;

// ============================================
// Default/Initial Values
// ============================================
export const DEFAULT_CLINIC_DATA: OnboardingClinicData = {
  name: '',
  slug: '',
  phone: '',
  city: '',
};

export const DEFAULT_DOCTOR_DATA: OnboardingDoctorData = {
  fullName: '',
  specialty: '',
  consultationValue: 0,
};

export const DEFAULT_ONBOARDING_STATE: OnboardingState = {
  currentStep: 1,
  clinicData: DEFAULT_CLINIC_DATA,
  doctorData: DEFAULT_DOCTOR_DATA,
  procedures: [],
  teamMembers: [],
};

// ============================================
// Completion Payload (for Edge Function)
// ============================================
export interface OnboardingCompletionPayload {
  clinic: OnboardingClinicData;
  doctor: OnboardingDoctorData;
  procedures: Omit<OnboardingProcedure, 'id' | 'isSelected'>[];
  teamMembers: Omit<OnboardingTeamMember, 'id'>[];
}

// ============================================
// Utility Functions
// ============================================

/**
 * Generate a URL-friendly slug from a string
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dashes
    .replace(/^-+|-+$/g, '') // Trim dashes from start/end
    .substring(0, 50); // Limit length
}

/**
 * Format phone number for display (Brazilian format)
 */
export function formatPhone(value: string): string {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
}

/**
 * Format currency for display (Brazilian Real)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Parse currency string to number
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^\d,]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get specialty info by value
 */
export function getSpecialtyInfo(value: string) {
  return MEDICAL_SPECIALTIES.find(s => s.value === value);
}
