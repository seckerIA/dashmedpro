/**
 * Types for AI Insights system
 */

export type AIProvider = 'openai' | 'gemini' | 'anthropic' | 'ollama';

export type InsightCategory = 'conversion' | 'messages' | 'scheduling' | 'leads' | 'operational' | 'financial';

export type InsightImpact = 'high' | 'medium' | 'low';

export type InsightTrend = 'improving' | 'declining' | 'stable';

export interface AIConfig {
    id: string;
    user_id: string;
    provider: AIProvider;
    api_key_encrypted: string | null;
    model: string;
    is_configured: boolean;
    last_analysis_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface AIInsight {
    id: string;
    user_id: string;
    category: InsightCategory;
    title: string;
    description: string;
    impact: InsightImpact;
    trend: InsightTrend | null;
    data_sources: string[];
    confidence: number;
    is_actionable: boolean;
    is_applied: boolean;
    applied_at: string | null;
    generated_at: string;
    expires_at: string;
    analysis_batch_id: string;
}

export interface AIAnalysisBatch {
    id: string;
    user_id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    insights_count: number;
    processing_time_ms: number | null;
    error_message: string | null;
    data_summary: Record<string, any>;
    created_at: string;
    completed_at: string | null;
}

export interface AIInsightsResponse {
    success: boolean;
    cached: boolean;
    batch_id: string;
    insights: AIInsight[];
    processing_time_ms?: number;
    next_analysis_available: string;
    error?: string;
    message?: string;
}

// Category display config
export const INSIGHT_CATEGORY_CONFIG: Record<InsightCategory, { label: string; icon: string; color: string }> = {
    conversion: { label: 'Conversão', icon: 'TrendingUp', color: 'text-purple-600' },
    messages: { label: 'Mensagens', icon: 'MessageSquare', color: 'text-blue-600' },
    scheduling: { label: 'Agendamentos', icon: 'Calendar', color: 'text-green-600' },
    leads: { label: 'Leads', icon: 'Users', color: 'text-orange-600' },
    operational: { label: 'Operacional', icon: 'Settings', color: 'text-gray-600' },
    financial: { label: 'Financeiro', icon: 'DollarSign', color: 'text-emerald-600' },
};

export const INSIGHT_IMPACT_CONFIG: Record<InsightImpact, { label: string; color: string; bgColor: string }> = {
    high: { label: 'Alto Impacto', color: 'text-red-600', bgColor: 'bg-red-500/10' },
    medium: { label: 'Médio Impacto', color: 'text-yellow-600', bgColor: 'bg-yellow-500/10' },
    low: { label: 'Sugestão', color: 'text-blue-600', bgColor: 'bg-blue-500/10' },
};

export const INSIGHT_TREND_CONFIG: Record<InsightTrend, { label: string; icon: string; color: string }> = {
    improving: { label: 'Melhorando', icon: 'TrendingUp', color: 'text-green-600' },
    declining: { label: 'Piorando', icon: 'TrendingDown', color: 'text-red-600' },
    stable: { label: 'Estável', icon: 'Minus', color: 'text-gray-500' },
};

export const AI_PROVIDER_CONFIG: Record<AIProvider, { label: string; models: string[] }> = {
    openai: {
        label: 'OpenAI',
        models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    },
    gemini: {
        label: 'Google Gemini',
        models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'],
    },
    anthropic: {
        label: 'Anthropic Claude',
        models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307', 'claude-3-opus-20240229'],
    },
    ollama: {
        label: 'Ollama (Local)',
        models: ['llama3', 'mixtral', 'mistral'],
    },
};
