import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { updateOrganizationPortalSettings } from '@/lib/adminPortalClient';
import type { OrganizationPortalSettings } from '@/types/organization';

export interface AdminPortalOrganization {
    id: string;
    name: string;
    slug: string;
    status: string;
    plan: string;
    created_at: string;
    portal_settings?: OrganizationPortalSettings | null;
}

export function useAdminPortal() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [organizations, setOrganizations] = useState<AdminPortalOrganization[]>([]);

    const listOrganizations = useCallback(async () => {
        setIsLoading(true);
        console.log('🏢 [AdminPortal] Iniciando listOrganizations...');

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                console.warn('🏢 [AdminPortal] Sem sessão ativa. Abortando.');
                toast({
                    variant: 'destructive',
                    title: 'Sessão Inválida',
                    description: 'Por favor, faça login novamente.'
                });
                return;
            }

            console.log('🏢 [AdminPortal] Sessão OK. Chamando Edge Function...');

            const timeoutId = setTimeout(() => {
                console.warn('🏢 [AdminPortal] Timeout de 15s atingido!');
            }, 15000);

            const { data, error } = await supabase.functions.invoke('admin-portal', {
                body: { action: 'list' },
            }).catch(err => {
                console.error('🏢 [AdminPortal] Erro na chamada:', err);
                return { data: null, error: err };
            });

            clearTimeout(timeoutId);

            if (error) {
                console.warn('🏢 [AdminPortal] Edge Function falhou. Fallback para DB...', error);

                const { data: dbData, error: dbError } = await supabase
                    .from('organizations')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (dbError) {
                    console.error('🏢 [AdminPortal] Fallback DB também falhou:', dbError);
                    toast({
                        variant: 'destructive',
                        title: 'Erro de conexão',
                        description: 'Não foi possível carregar as clínicas (Edge Function & DB falharam).'
                    });
                    throw error;
                }

                console.log('🏢 [AdminPortal] Fallback DB OK. Orgs encontradas:', dbData?.length);
                setOrganizations((dbData ?? []) as AdminPortalOrganization[]);
                return;
            }

            console.log('🏢 [AdminPortal] Edge Function OK. Orgs encontradas:', data?.organizations?.length);
            setOrganizations((data?.organizations ?? []) as AdminPortalOrganization[]);
        } catch (error: unknown) {
            console.error('🏢 [AdminPortal] Erro geral:', error);
            const name = error instanceof Error ? error.name : '';
            if (name !== 'AbortError') {
                toast({
                    variant: 'destructive',
                    title: 'Erro ao listar organizações',
                    description: error instanceof Error ? error.message : 'Falha na comunicação com o servidor.'
                });
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Tempo Limite Excedido',
                    description: 'O servidor demorou muito para responder. Tente novamente.'
                });
            }
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    const createOrganization = useCallback(async (data: {
        name: string;
        slug: string;
        adminEmail: string;
        adminName: string;
        adminPassword?: string;
    }) => {
        setIsLoading(true);
        try {
            const payload = {
                action: 'create' as const,
                name: data.name,
                slug: data.slug,
                adminEmail: data.adminEmail,
                adminName: data.adminName,
                ...(data.adminPassword?.trim()
                    ? { adminPassword: data.adminPassword.trim() }
                    : {}),
            };
            const { data: response, error } = await supabase.functions.invoke('admin-portal', {
                body: payload,
            });

            if (error) throw error;

            const initialPwd = data.adminPassword?.trim() || 'DashMed@2026';
            toast({
                title: 'Clínica criada',
                description: `Peça ao dono para abrir a mesma URL da plataforma, ir a /login e entrar com ${data.adminEmail} e a senha inicial: ${initialPwd}`,
            });

            listOrganizations();
            return response;
        } catch (error: unknown) {
            console.error('Error creating organization:', error);
            toast({
                variant: 'destructive',
                title: 'Erro ao criar organização',
                description: error instanceof Error ? error.message : 'Falha ao processar solicitação.'
            });
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [listOrganizations, toast]);

    const updatePortalSettings = useCallback(async (
        organizationId: string,
        portal_settings: OrganizationPortalSettings,
    ) => {
        setIsLoading(true);
        try {
            await updateOrganizationPortalSettings(organizationId, portal_settings);

            toast({
                title: 'Portal da clínica atualizado',
                description: 'As alterações de marca e flags já estão gravadas.',
            });

            await listOrganizations();
        } catch (error: unknown) {
            console.error('updatePortalSettings:', error);
            toast({
                variant: 'destructive',
                title: 'Erro ao salvar portal',
                description: error instanceof Error ? error.message : 'Falha ao processar solicitação.',
            });
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [listOrganizations, toast]);

    return {
        isLoading,
        organizations,
        listOrganizations,
        createOrganization,
        updatePortalSettings,
    };
}
