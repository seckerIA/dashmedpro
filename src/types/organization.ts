/** JSON armazenado em `organizations.portal_settings` — parcial/intencionalmente flexível */
export interface OrganizationPortalBranding {
    /** Preset documentado: `joao_paulo` | `dashmed` — `null` limpa preset (heurística por nome volta a valer). */
    palette_preset?: string | null;
    /** Triplet `H S% L%` compatível com variáveis CSS, ou `#RRGGBB` (convertido na UI) */
    primary_hsl?: string;
    /** Secundária da marca (ex.: teal claro #55BEAF no preset João Paulo) */
    accent_hsl?: string;
    /** Destaque tipo ouro / premium (ex.: #DCBE71 no preset João Paulo) */
    gold_hsl?: string;
    logo_url?: string;
    sidebar_title?: string;
    sidebar_subtitle?: string;
}

export interface OrganizationPortalFeatures {
    /** Aba CRM "Inteligência" — default true */
    crm_intelligence_tab?: boolean;
    /** Entradas de IA na navegação (uso futuro) — default true */
    navigation_ai?: boolean;
    /** Exibir bloco Estoque — default true */
    module_inventory?: boolean;
    /** Vendas, CRM, Agenda comercial, métricas… — default true */
    module_commercial?: boolean;
    /** Inbox e configurações WhatsApp — default true */
    module_whatsapp?: boolean;
    /** Financeiro (incl. portal secretária quando aplicável) — default true */
    module_financial?: boolean;
    /** Relatórios gerais (/relatorios) — default true */
    module_reports?: boolean;
    /** Gerenciar equipe — default true */
    module_team_management?: boolean;
}

/** Valores crus da coluna JSONB (nem todas as chaves obrigatórias) */
export interface OrganizationPortalSettings {
    branding?: OrganizationPortalBranding;
    features?: OrganizationPortalFeatures;
}

/** Merge no frontend com defaults (uso em filtros/nav/tema). */
export type ResolvedOrganizationPortal = {
    features: {
        crm_intelligence_tab: boolean;
        navigation_ai: boolean;
        module_inventory: boolean;
        module_commercial: boolean;
        module_whatsapp: boolean;
        module_financial: boolean;
        module_reports: boolean;
        module_team_management: boolean;
    };
    branding: {
        palette_preset?: string | null;
        primary_hsl?: string;
        accent_hsl?: string;
        gold_hsl?: string;
        logo_url?: string;
        sidebar_title?: string;
        sidebar_subtitle?: string;
    };
};

export interface Organization {
    id: string;
    name: string;
    slug: string;
    plan: string;
    status: 'active' | 'inactive' | 'suspended';
    created_at: string;
    updated_at: string;
    portal_settings?: OrganizationPortalSettings | null;
}

export interface OrganizationMember {
    id: string;
    organization_id: string;
    user_id: string;
    role: 'admin' | 'dono' | 'vendedor' | 'gestor_trafego' | 'medico' | 'secretaria';
    created_at: string;
    updated_at: string;
    organization?: Organization;
}
