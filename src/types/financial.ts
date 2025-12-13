import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

// ============================================
// TIPOS DE TABELAS DO SUPABASE
// ============================================

export type FinancialAccount = Tables<"financial_accounts">;
export type FinancialAccountInsert = TablesInsert<"financial_accounts">;
export type FinancialAccountUpdate = TablesUpdate<"financial_accounts">;

export type FinancialCategory = Tables<"financial_categories">;
export type FinancialCategoryInsert = TablesInsert<"financial_categories">;
export type FinancialCategoryUpdate = TablesUpdate<"financial_categories">;

export type FinancialTransaction = Tables<"financial_transactions">;
export type FinancialTransactionInsert = TablesInsert<"financial_transactions">;
export type FinancialTransactionUpdate = TablesUpdate<"financial_transactions">;

export type FinancialAttachment = Tables<"financial_attachments">;
export type FinancialAttachmentInsert = TablesInsert<"financial_attachments">;

export type FinancialRecurringTransaction = Tables<"financial_recurring_transactions">;
export type FinancialRecurringTransactionInsert = TablesInsert<"financial_recurring_transactions">;
export type FinancialRecurringTransactionUpdate = TablesUpdate<"financial_recurring_transactions">;

export type FinancialBudget = Tables<"financial_budgets">;
export type FinancialBudgetInsert = TablesInsert<"financial_budgets">;
export type FinancialBudgetUpdate = TablesUpdate<"financial_budgets">;

export type TransactionCost = Tables<"transaction_costs">;
export type TransactionCostInsert = TablesInsert<"transaction_costs">;
export type TransactionCostUpdate = TablesUpdate<"transaction_costs">;

// ============================================
// TIPOS DE ENUMS
// ============================================

export type AccountType = 'conta_corrente' | 'poupanca' | 'caixa' | 'investimento';
export type TransactionType = 'entrada' | 'saida';
export type CategoryType = 'entrada' | 'saida';
export type PaymentMethod = 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'boleto' | 'transferencia' | 'cheque';
export type TransactionStatus = 'pendente' | 'concluida' | 'cancelada';
export type RecurrenceFrequency = 'diaria' | 'semanal' | 'quinzenal' | 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual';
export type BudgetStatus = 'active' | 'exceeded' | 'completed' | 'cancelled';
export type CostType = 'ferramentas' | 'operacional' | 'terceirizacao';

// ============================================
// TIPOS ESTENDIDOS (com relationships)
// ============================================

export interface FinancialTransactionWithDetails extends FinancialTransaction {
  account?: FinancialAccount;
  category?: FinancialCategory;
  category_name?: string;
  account_name?: string;
  deal?: {
    id: string;
    title: string;
    value: number | null;
  };
  contact?: {
    id: string;
    full_name: string;
    company: string | null;
  };
  attachments?: FinancialAttachment[];
  costs?: TransactionCost[];
  net_amount?: number;
}

export interface FinancialRecurringTransactionWithTemplate extends FinancialRecurringTransaction {
  template_transaction?: FinancialTransaction & {
    description?: string;
    amount?: number;
    category_name?: string;
  };
}

export interface FinancialAccountWithBalance extends FinancialAccount {
  transactions_count?: number;
  last_transaction_date?: string;
}

export interface FinancialCategoryWithStats extends FinancialCategory {
  total_transactions?: number;
  total_amount?: number;
  percentage?: number;
}

// ============================================
// TIPOS PARA MÉTRICAS E DASHBOARDS
// ============================================

export interface FinancialMetrics {
  totalBalance: number;
  monthRevenue: number;
  monthExpenses: number;
  monthProfit: number;
  profitMargin: number;
  totalAccounts: number;
  activeTransactions: number;
  monthTotalCosts: number;
  monthNetProfit: number;
  netProfitMargin: number;
}

export interface MonthlyData {
  month: string;
  receitas: number;
  despesas: number;
  lucro: number;
}

export interface CategoryExpense {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

export interface CostBreakdown {
  type: CostType;
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export interface CashFlowProjection {
  month: string;
  saldo: number;
  projected?: boolean;
}

export interface AccountSummary {
  id: string;
  name: string;
  type: AccountType;
  bank_name: string | null;
  balance: number;
  lastTransactionDate?: string;
}

export interface TransactionSummary {
  id: string;
  date: string;
  description: string;
  category: string;
  categoryColor: string;
  account: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  hasAttachments: boolean;
}

// ============================================
// TIPOS PARA FORMULÁRIOS
// ============================================

export interface TransactionCostFormData {
  id?: string;
  cost_type: CostType;
  amount: string;
  description: string;
  attachment?: File | null;
  attachment_id?: string | null;
}

export interface TransactionFormData {
  type: TransactionType;
  description: string;
  amount: number;
  transaction_date: string;
  category_id: string;
  account_id: string;
  payment_method?: PaymentMethod;
  deal_id?: string | null;
  contact_id?: string | null;
  tags?: string[];
  notes?: string;
  is_recurring?: boolean;
  recurrence_frequency?: RecurrenceFrequency;
  recurrence_start_date?: string;
  recurrence_end_date?: string | null;
  has_costs?: boolean;
  costs?: TransactionCostFormData[];
}

export interface AccountFormData {
  name: string;
  type: AccountType;
  bank_name?: string;
  account_number?: string;
  initial_balance: number;
}

export interface CategoryFormData {
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
  parent_id?: string | null;
}

// ============================================
// TIPOS PARA FILTROS
// ============================================

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
  category_id?: string;
  account_id?: string;
  status?: TransactionStatus;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

// ============================================
// TIPOS PARA UPLOAD
// ============================================

export interface FileUpload {
  file: File;
  preview?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress?: number;
  error?: string;
}

export interface UploadedFile {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  url: string;
}

// ============================================
// TIPOS PARA RELATÓRIOS
// ============================================

export interface FinancialReport {
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
  };
  byCategory: CategoryExpense[];
  byAccount: AccountSummary[];
  transactions: TransactionSummary[];
}

export interface DREReport {
  period: string;
  receitas: {
    total: number;
    byCategory: { category: string; amount: number }[];
  };
  despesas: {
    total: number;
    byCategory: { category: string; amount: number }[];
  };
  lucro: {
    bruto: number;
    liquido: number;
    margem: number;
  };
}

