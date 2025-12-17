// Tipos para métricas comerciais e financeiras

export type PeriodFilter = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface PeriodRange {
  start: Date;
  end: Date;
}

// Métricas Financeiras
export interface FinancialMetrics {
  // Custo por consulta
  costPerAppointment: {
    average: number;
    total: number;
    count: number;
    individual: Array<{
      appointmentId: string;
      appointmentTitle: string;
      appointmentDate: string;
      revenue: number;
      costs: number;
      netProfit: number;
      margin: number;
    }>;
  };
  
  // ROI
  roi: {
    overall: number;
    byCampaign: Array<{
      campaignId: string;
      campaignName: string;
      revenue: number;
      costs: number;
      roi: number;
    }>;
    byPeriod: Array<{
      period: string;
      revenue: number;
      costs: number;
      roi: number;
    }>;
  };
  
  // Margem de lucro
  profitMargin: {
    gross: number; // Margem bruta
    net: number; // Margem líquida
    byAppointment: Array<{
      appointmentType: string;
      grossMargin: number;
      netMargin: number;
      revenue: number;
      costs: number;
    }>;
  };
  
  // Receita por hora
  revenuePerHour: {
    average: number;
    byHour: Array<{
      hour: number;
      revenue: number;
      appointments: number;
    }>;
    totalHours: number;
  };
  
  // Ticket médio
  averageTicket: {
    perAppointment: number;
    perProcedure: number;
    byType: Array<{
      type: string;
      average: number;
      count: number;
    }>;
  };
}

// Métricas de Clientes
export interface CustomerMetrics {
  // LTV (Lifetime Value)
  ltv: {
    average: number;
    byPatient: Array<{
      patientId: string;
      patientName: string;
      totalRevenue: number;
      totalCosts: number;
      netValue: number;
      appointments: number;
    }>;
  };
  
  // CAC (Custo de Aquisição)
  cac: {
    average: number;
    byChannel: Array<{
      channel: string;
      cost: number;
      acquisitions: number;
      cac: number;
    }>;
  };
  
  // Taxa de retenção
  retentionRate: {
    overall: number;
    byPeriod: Array<{
      period: string;
      rate: number;
      newPatients: number;
      returningPatients: number;
    }>;
  };
  
  // Custo por lead convertido
  costPerConvertedLead: {
    average: number;
    byOrigin: Array<{
      origin: string;
      cost: number;
      converted: number;
      costPerLead: number;
    }>;
  };
}

// Métricas Operacionais
export interface OperationalMetrics {
  // Taxa de conversão
  conversionRate: {
    leadsToAppointments: number;
    appointmentsToSales: number;
    overall: number;
    funnel: Array<{
      stage: string;
      count: number;
      percentage: number;
    }>;
  };
  
  // Taxa de ocupação
  occupancyRate: {
    overall: number;
    byDay: Array<{
      date: string;
      rate: number;
      scheduled: number;
      available: number;
    }>;
    byWeek: Array<{
      week: string;
      rate: number;
    }>;
  };
  
  // Tempo médio de ciclo de vendas
  salesCycle: {
    averageDays: number;
    byStage: Array<{
      stage: string;
      averageDays: number;
      count: number;
    }>;
  };
  
  // Eficiência por procedimento
  procedureEfficiency: Array<{
    procedureType: string;
    averageDuration: number;
    averageRevenue: number;
    revenuePerMinute: number;
    count: number;
  }>;
}

// Métricas de Marketing
export interface MarketingMetrics {
  // ROI de campanhas
  campaignROI: Array<{
    campaignId: string;
    campaignName: string;
    campaignType: string;
    investment: number;
    revenue: number;
    roi: number;
    leads: number;
    conversions: number;
  }>;
  
  // Custo por aquisição por canal
  acquisitionCostByChannel: Array<{
    channel: string;
    totalCost: number;
    acquisitions: number;
    costPerAcquisition: number;
  }>;
}

// Métricas consolidadas
export interface CommercialMetrics {
  // Período
  period: PeriodRange;
  previousPeriod?: PeriodRange;
  
  // Métricas principais
  financial: FinancialMetrics;
  customer: CustomerMetrics;
  operational: OperationalMetrics;
  marketing: MarketingMetrics;
  
  // Comparações com período anterior
  comparisons: {
    revenue: { current: number; previous: number; change: number };
    costs: { current: number; previous: number; change: number };
    profit: { current: number; previous: number; change: number };
    appointments: { current: number; previous: number; change: number };
  };
}

// Tipos para gráficos
export interface ChartDataPoint {
  name: string;
  value: number;
  label?: string;
  color?: string;
}

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  label?: string;
}

// Tipos para tabelas
export interface AppointmentCostRow {
  id: string;
  title: string;
  date: string;
  type: string;
  revenue: number;
  costs: number;
  netProfit: number;
  margin: number;
  patientName: string;
}

export interface CampaignROIRow {
  id: string;
  name: string;
  type: string;
  investment: number;
  revenue: number;
  roi: number;
  leads: number;
  conversions: number;
}

export interface ProcedureEfficiencyRow {
  type: string;
  count: number;
  averageDuration: number;
  averageRevenue: number;
  revenuePerMinute: number;
  totalRevenue: number;
}

export interface PatientLTVRow {
  id: string;
  name: string;
  totalRevenue: number;
  totalCosts: number;
  netValue: number;
  appointments: number;
  firstAppointment: string;
  lastAppointment: string;
}


