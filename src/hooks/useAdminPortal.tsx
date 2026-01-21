
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Organization {
    id: string;
    name: string;
    slug: string;
    status: string;
    plan: string;
    created_at: string;
}

export function useAdminPortal() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [organizations, setOrganizations] = useState<Organization[]>([]);

    const listOrganizations = async () => {
        setIsLoading(true);
        console.log('🏢 [AdminPortal] Iniciando listOrganizations...');

        try {
            // Primeiro verificar se há sessão válida
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

            // Create a timeout to prevent hanging if the edge function is down/missing
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                console.warn('🏢 [AdminPortal] Timeout de 15s atingido!');
                controller.abort();
            }, 15000); // 15s timeout

            // Check if function exists/responds before hanging
            const { data, error } = await supabase.functions.invoke('admin-portal', {
                body: { action: 'list' },
            }).catch(err => {
                console.error('🏢 [AdminPortal] Erro na chamada:', err);
                // Return mock error if network fails immediately
                return { data: null, error: err };
            });

            clearTimeout(timeoutId);

            if (error) {
                console.warn('🏢 [AdminPortal] Edge Function falhou. Fallback para DB...', error);
                // Fallback: Fetch directly from 'organizations' table
                // This will only show organizations the current user has access to (via RLS),
                // but for the owner/super-admin, this usually includes their own orgs.
                // Note: The 'admin-portal' function is needed to see ALL orgs if RLS is strict.

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
                    throw error; // Throw original error
                }

                console.log('🏢 [AdminPortal] Fallback DB OK. Orgs encontradas:', dbData?.length);
                // If DB fetch worked, use that data
                // Need to map to match the interface if necessary (it matches here)
                setOrganizations(dbData as Organization[] || []);
                return;
            }

            console.log('🏢 [AdminPortal] Edge Function OK. Orgs encontradas:', data?.organizations?.length);
            setOrganizations(data.organizations || []);
        } catch (error: any) {
            console.error('🏢 [AdminPortal] Erro geral:', error);
            // Don't toast if it was an abort (timeout) to avoid spamming user
            if (error.name !== 'AbortError') {
                toast({
                    variant: 'destructive',
                    title: 'Erro ao listar organizações',
                    description: error.message || 'Falha na comunicação com o servidor.'
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
    };

    const createOrganization = async (data: {
        name: string;
        slug: string;
        adminEmail: string;
        adminName: string;
    }) => {
        setIsLoading(true);
        try {
            const { data: response, error } = await supabase.functions.invoke('admin-portal', {
                body: { action: 'create', ...data }
            });

            if (error) throw error;

            toast({
                title: 'Sucesso',
                description: `Organização "${data.name}" criada com sucesso!`,
            });

            // Refresh list
            listOrganizations();
            return response;
        } catch (error: any) {
            console.error('Error creating organization:', error);
            toast({
                variant: 'destructive',
                title: 'Erro ao criar organização',
                description: error.message || 'Falha ao processar solicitação.'
            });
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isLoading,
        organizations,
        listOrganizations,
        createOrganization
    };
}
