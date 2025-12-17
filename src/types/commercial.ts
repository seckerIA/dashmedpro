// Commercial Leads Types
export type CommercialLeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
export type CommercialLeadOrigin = 'google' | 'instagram' | 'facebook' | 'indication' | 'website' | 'other';
export type CommercialProcedureCategory = 'consultation' | 'procedure' | 'exam' | 'surgery' | 'other';
export type CommercialSaleStatus = 'quote' | 'confirmed' | 'completed' | 'cancelled';
export type CommercialPaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'bank_transfer' | 'installment';
export type CommercialCampaignType = 'first_consultation_discount' | 'procedure_package' | 'seasonal_promotion' | 'referral_benefit';
export type CommercialInteractionType = 'call' | 'email' | 'whatsapp' | 'meeting' | 'other';

export interface CommercialLead {
  id: string;
  user_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  origin: CommercialLeadOrigin;
  status: CommercialLeadStatus;
  estimated_value?: number | null;
  converted_at?: string | null;
  contact_id?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommercialLeadInsert {
  user_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  origin?: CommercialLeadOrigin;
  status?: CommercialLeadStatus;
  estimated_value?: number | null;
  notes?: string | null;
}

export interface CommercialLeadUpdate {
  name?: string;
  email?: string | null;
  phone?: string | null;
  origin?: CommercialLeadOrigin;
  status?: CommercialLeadStatus;
  estimated_value?: number | null;
  converted_at?: string | null;
  contact_id?: string | null;
  notes?: string | null;
}

export interface CommercialProcedure {
  id: string;
  user_id: string;
  name: string;
  category: CommercialProcedureCategory;
  description?: string | null;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommercialProcedureInsert {
  user_id: string;
  name: string;
  category?: CommercialProcedureCategory;
  description?: string | null;
  price: number;
  duration_minutes?: number;
  is_active?: boolean;
}

export interface CommercialProcedureUpdate {
  name?: string;
  category?: CommercialProcedureCategory;
  description?: string | null;
  price?: number;
  duration_minutes?: number;
  is_active?: boolean;
}

export interface CommercialSale {
  id: string;
  user_id: string;
  lead_id?: string | null;
  contact_id?: string | null;
  procedure_id?: string | null;
  appointment_id?: string | null;
  value: number;
  status: CommercialSaleStatus;
  payment_method?: CommercialPaymentMethod | null;
  installments?: number | null;
  sale_date?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommercialSaleInsert {
  user_id: string;
  lead_id?: string | null;
  contact_id?: string | null;
  procedure_id?: string | null;
  appointment_id?: string | null;
  value: number;
  status?: CommercialSaleStatus;
  payment_method?: CommercialPaymentMethod | null;
  installments?: number;
  sale_date?: string | null;
  notes?: string | null;
}

export interface CommercialSaleUpdate {
  lead_id?: string | null;
  contact_id?: string | null;
  procedure_id?: string | null;
  appointment_id?: string | null;
  value?: number;
  status?: CommercialSaleStatus;
  payment_method?: CommercialPaymentMethod | null;
  installments?: number;
  sale_date?: string | null;
  notes?: string | null;
}

export interface CommercialCampaign {
  id: string;
  user_id: string;
  name: string;
  type: CommercialCampaignType;
  discount_percentage?: number | null;
  discount_amount?: number | null;
  start_date: string;
  end_date: string;
  target_audience?: string | null;
  promo_code?: string | null;
  leads_generated: number;
  conversions: number;
  is_active: boolean;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommercialCampaignInsert {
  user_id: string;
  name: string;
  type: CommercialCampaignType;
  discount_percentage?: number | null;
  discount_amount?: number | null;
  start_date: string;
  end_date: string;
  target_audience?: string | null;
  promo_code?: string | null;
  is_active?: boolean;
  description?: string | null;
}

export interface CommercialCampaignUpdate {
  name?: string;
  type?: CommercialCampaignType;
  discount_percentage?: number | null;
  discount_amount?: number | null;
  start_date?: string;
  end_date?: string;
  target_audience?: string | null;
  promo_code?: string | null;
  leads_generated?: number;
  conversions?: number;
  is_active?: boolean;
  description?: string | null;
}

export interface CommercialLeadInteraction {
  id: string;
  lead_id: string;
  interaction_type: CommercialInteractionType;
  notes?: string | null;
  user_id: string;
  created_at: string;
}

export interface CommercialLeadInteractionInsert {
  lead_id: string;
  interaction_type: CommercialInteractionType;
  notes?: string | null;
  user_id: string;
}

// Labels for UI
export const COMMERCIAL_LEAD_STATUS_LABELS: Record<CommercialLeadStatus, string> = {
  new: 'Novo',
  contacted: 'Contatado',
  qualified: 'Qualificado',
  converted: 'Convertido',
  lost: 'Perdido',
};

export const COMMERCIAL_LEAD_ORIGIN_LABELS: Record<CommercialLeadOrigin, string> = {
  google: 'Google',
  instagram: 'Instagram',
  facebook: 'Facebook',
  indication: 'Indicação',
  website: 'Site',
  other: 'Outro',
};

export const COMMERCIAL_PROCEDURE_CATEGORY_LABELS: Record<CommercialProcedureCategory, string> = {
  consultation: 'Consulta',
  procedure: 'Procedimento',
  exam: 'Exame',
  surgery: 'Cirurgia',
  other: 'Outro',
};

export const COMMERCIAL_SALE_STATUS_LABELS: Record<CommercialSaleStatus, string> = {
  quote: 'Orçamento',
  confirmed: 'Confirmado',
  completed: 'Realizado',
  cancelled: 'Cancelado',
};

export const COMMERCIAL_PAYMENT_METHOD_LABELS: Record<CommercialPaymentMethod, string> = {
  cash: 'Dinheiro',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  pix: 'PIX',
  bank_transfer: 'Transferência Bancária',
  installment: 'Parcelado',
};

export const COMMERCIAL_CAMPAIGN_TYPE_LABELS: Record<CommercialCampaignType, string> = {
  first_consultation_discount: 'Desconto Primeira Consulta',
  procedure_package: 'Pacote de Procedimentos',
  seasonal_promotion: 'Promoção Sazonal',
  referral_benefit: 'Indicação com Benefício',
};

export const COMMERCIAL_INTERACTION_TYPE_LABELS: Record<CommercialInteractionType, string> = {
  call: 'Ligação',
  email: 'E-mail',
  whatsapp: 'WhatsApp',
  meeting: 'Reunião',
  other: 'Outro',
};







