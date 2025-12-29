// Tipos para o sistema de prontuários médicos

// =====================================================
// SINAIS VITAIS
// =====================================================

export interface VitalSigns {
  bp_systolic?: number;      // Pressão sistólica (mmHg)
  bp_diastolic?: number;     // Pressão diastólica (mmHg)
  heart_rate?: number;       // Frequência cardíaca (bpm)
  respiratory_rate?: number; // Frequência respiratória (irpm)
  temperature?: number;      // Temperatura (°C)
  spo2?: number;             // Saturação de O2 (%)
  weight?: number;           // Peso (kg)
  height?: number;           // Altura (cm)
  bmi?: number;              // IMC (calculado automaticamente)
}

// Validação de faixas para sinais vitais
export const VITAL_SIGNS_RANGES = {
  temperature: { min: 35, max: 42, unit: '°C' },
  bp_systolic: { min: 60, max: 250, unit: 'mmHg' },
  bp_diastolic: { min: 40, max: 150, unit: 'mmHg' },
  heart_rate: { min: 30, max: 250, unit: 'bpm' },
  respiratory_rate: { min: 8, max: 60, unit: 'irpm' },
  spo2: { min: 50, max: 100, unit: '%' },
  weight: { min: 1, max: 300, unit: 'kg' },
  height: { min: 30, max: 250, unit: 'cm' },
} as const;

// Função para calcular IMC
export function calculateBMI(weight?: number, height?: number): number | undefined {
  if (!weight || !height || height <= 0) return undefined;
  const heightInMeters = height / 100;
  return Number((weight / (heightInMeters * heightInMeters)).toFixed(2));
}

// =====================================================
// PRESCRIÇÃO DE MEDICAMENTO
// =====================================================

export interface MedicationPrescription {
  id?: string;
  medication: string;        // Nome do medicamento
  dosage: string;            // Dosagem (ex: "500mg")
  frequency: string;         // Posologia (ex: "8/8h")
  duration: string;          // Duração (ex: "7 dias")
  quantity?: string;         // Quantidade (ex: "21 comprimidos")
  instructions?: string;     // Instruções adicionais
  route?: string;            // Via de administração (oral, IV, IM, etc.)
}

// =====================================================
// EXAME SOLICITADO
// =====================================================

export interface RequestedExam {
  id?: string;
  exam_name: string;         // Nome do exame
  urgency?: 'routine' | 'urgent' | 'emergency';
  notes?: string;            // Observações
  category?: string;         // Categoria (laboratorial, imagem, etc.)
}

// =====================================================
// CONTATO DE EMERGÊNCIA
// =====================================================

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;      // Parentesco/relação
}

// =====================================================
// PRONTUÁRIO MÉDICO (REGISTRO)
// =====================================================

export interface MedicalRecord {
  id: string;
  contact_id: string;
  doctor_id: string;
  appointment_id?: string | null;
  user_id: string;

  // Anamnese
  chief_complaint?: string | null;
  history_current_illness?: string | null;
  past_medical_history?: string | null;
  family_history?: string | null;
  social_history?: string | null;
  allergies_noted?: string[] | null;

  // Exame Físico
  vital_signs?: VitalSigns | null;
  general_condition?: string | null;
  physical_exam_notes?: string | null;

  // Diagnóstico
  diagnostic_hypothesis?: string | null;
  cid_codes?: string[] | null;
  secondary_diagnoses?: string[] | null;

  // Conduta
  treatment_plan?: string | null;
  patient_instructions?: string | null;
  follow_up_notes?: string | null;
  next_appointment_date?: string | null;

  // Complicações (importante para procedimentos)
  complications?: string | null;

  // Prescrições e Exames
  prescriptions?: MedicationPrescription[] | null;
  exams_requested?: RequestedExam[] | null;

  // Metadados
  record_type: 'consultation' | 'return' | 'procedure' | 'exam' | 'emergency';
  record_status: 'draft' | 'completed' | 'signed';

  created_at: string;
  updated_at: string;

  // Relações (quando join)
  contact?: {
    id: string;
    full_name: string;
    phone?: string;
    email?: string;
    cpf?: string;
    gender?: string;
    birth_date?: string;
  };
  doctor?: {
    id: string;
    full_name: string;
    email?: string;
  };
}

// =====================================================
// RECEITA (PRESCRIÇÃO PARA IMPRESSÃO)
// =====================================================

export interface Prescription {
  id: string;
  medical_record_id?: string | null;
  contact_id: string;
  doctor_id: string;

  medications: MedicationPrescription[];
  notes?: string | null;
  prescription_date: string;
  valid_until?: string | null;
  prescription_type: 'simple' | 'controlled' | 'special';

  is_printed: boolean;
  printed_at?: string | null;

  created_at: string;
  updated_at: string;

  // Relações
  contact?: {
    id: string;
    full_name: string;
    cpf?: string;
  };
  doctor?: {
    id: string;
    full_name: string;
    email?: string;
  };
}

// =====================================================
// PACIENTE (EXTENSÃO DE CRM_CONTACTS PARA MÉDICO)
// =====================================================

export interface Patient {
  id: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  cpf?: string | null;
  gender?: 'masculino' | 'feminino' | 'outro' | 'prefiro_nao_dizer' | null;
  birth_date?: string | null;
  blood_type?: string | null;
  insurance_type?: 'convenio' | 'particular' | null;
  insurance_name?: string | null;

  // Campos médicos
  allergies?: string[] | null;
  chronic_conditions?: string[] | null;
  current_medications?: string[] | null;
  emergency_contact?: EmergencyContact | null;

  created_at: string;
  updated_at: string;

  // Contadores (calculados)
  total_appointments?: number;
  last_appointment?: string | null;
  total_records?: number;
}

// =====================================================
// FORMULÁRIOS (PARA CRIAÇÃO/EDIÇÃO)
// =====================================================

export interface CreateMedicalRecordInput {
  contact_id: string;
  appointment_id?: string;

  // Anamnese
  chief_complaint?: string;
  history_current_illness?: string;
  past_medical_history?: string;
  family_history?: string;
  social_history?: string;
  allergies_noted?: string[];

  // Exame Físico
  vital_signs?: VitalSigns;
  general_condition?: string;
  physical_exam_notes?: string;

  // Diagnóstico
  diagnostic_hypothesis?: string;
  cid_codes?: string[];
  secondary_diagnoses?: string[];

  // Conduta
  treatment_plan?: string;
  patient_instructions?: string;
  follow_up_notes?: string;
  next_appointment_date?: string;

  // Complicações
  complications?: string;

  // Prescrições e Exames
  prescriptions?: MedicationPrescription[];
  exams_requested?: RequestedExam[];

  record_type?: 'consultation' | 'return' | 'procedure' | 'exam' | 'emergency';
}

export interface UpdatePatientMedicalInfoInput {
  birth_date?: string;
  blood_type?: string;
  allergies?: string[];
  chronic_conditions?: string[];
  current_medications?: string[];
  emergency_contact?: EmergencyContact;
}

export interface CreatePrescriptionInput {
  contact_id: string;
  medical_record_id?: string;
  medications: MedicationPrescription[];
  notes?: string;
  valid_until?: string;
  prescription_type?: 'simple' | 'controlled' | 'special';
}

// =====================================================
// CÓDIGOS CID-10 (para autocomplete)
// =====================================================

export interface CIDCode {
  code: string;
  description: string;
  category?: string;
}

// Lista comum de CIDs (pode ser expandida ou buscada de API)
export const COMMON_CID_CODES: CIDCode[] = [
  { code: 'J00', description: 'Nasofaringite aguda (resfriado comum)', category: 'Respiratório' },
  { code: 'J06.9', description: 'Infecção aguda das vias aéreas superiores', category: 'Respiratório' },
  { code: 'J11', description: 'Influenza (gripe)', category: 'Respiratório' },
  { code: 'J20.9', description: 'Bronquite aguda', category: 'Respiratório' },
  { code: 'J45', description: 'Asma', category: 'Respiratório' },
  { code: 'I10', description: 'Hipertensão essencial (primária)', category: 'Cardiovascular' },
  { code: 'E11', description: 'Diabetes mellitus tipo 2', category: 'Endócrino' },
  { code: 'E78.0', description: 'Hipercolesterolemia pura', category: 'Endócrino' },
  { code: 'K29.7', description: 'Gastrite', category: 'Digestivo' },
  { code: 'K21.0', description: 'Doença do refluxo gastroesofágico', category: 'Digestivo' },
  { code: 'N39.0', description: 'Infecção do trato urinário', category: 'Urológico' },
  { code: 'M54.5', description: 'Dor lombar baixa', category: 'Musculoesquelético' },
  { code: 'G43', description: 'Enxaqueca', category: 'Neurológico' },
  { code: 'F32', description: 'Episódio depressivo', category: 'Mental' },
  { code: 'F41.1', description: 'Transtorno de ansiedade generalizada', category: 'Mental' },
  { code: 'L20', description: 'Dermatite atópica', category: 'Dermatológico' },
  { code: 'H10.9', description: 'Conjuntivite', category: 'Oftalmológico' },
  { code: 'B34.9', description: 'Infecção viral', category: 'Infeccioso' },
  { code: 'R50.9', description: 'Febre de origem desconhecida', category: 'Sintomas' },
  { code: 'R51', description: 'Cefaleia', category: 'Sintomas' },
];

// =====================================================
// TIPOS DE REGISTRO
// =====================================================

export const RECORD_TYPES = [
  { value: 'consultation', label: 'Consulta', description: 'Primeira consulta ou consulta de rotina' },
  { value: 'return', label: 'Retorno', description: 'Consulta de retorno/acompanhamento' },
  { value: 'procedure', label: 'Procedimento', description: 'Procedimento médico' },
  { value: 'exam', label: 'Exame', description: 'Realização de exame' },
  { value: 'emergency', label: 'Emergência', description: 'Atendimento de emergência' },
] as const;

// Labels para tipos de registro (compatibilidade)
export const MEDICAL_RECORD_TYPE_LABELS: Record<string, string> = {
  consultation: 'Consulta',
  return: 'Retorno',
  procedure: 'Procedimento',
  exam: 'Exame',
  emergency: 'Emergência',
};

// Alias para compatibilidade
export type MedicalRecordInsert = CreateMedicalRecordInput;

// =====================================================
// TIPOS SANGUÍNEOS
// =====================================================

export const BLOOD_TYPES = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
] as const;

// =====================================================
// VIAS DE ADMINISTRAÇÃO
// =====================================================

export const MEDICATION_ROUTES = [
  { value: 'oral', label: 'Via oral' },
  { value: 'sublingual', label: 'Sublingual' },
  { value: 'iv', label: 'Intravenosa (IV)' },
  { value: 'im', label: 'Intramuscular (IM)' },
  { value: 'sc', label: 'Subcutânea (SC)' },
  { value: 'topical', label: 'Tópica' },
  { value: 'inhalation', label: 'Inalatória' },
  { value: 'nasal', label: 'Nasal' },
  { value: 'ophthalmic', label: 'Oftálmica' },
  { value: 'otic', label: 'Otológica' },
  { value: 'rectal', label: 'Retal' },
  { value: 'vaginal', label: 'Vaginal' },
] as const;
