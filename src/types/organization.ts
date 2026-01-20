export interface Organization {
    id: string;
    name: string;
    slug: string;
    plan: string;
    status: 'active' | 'inactive' | 'suspended';
    created_at: string;
    updated_at: string;
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
