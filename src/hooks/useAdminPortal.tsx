
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
        try {
            // Create a timeout to prevent hanging if the edge function is down/missing
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

            // Check if function exists/responds before hanging
            const { data, error } = await supabase.functions.invoke('admin-portal', {
                body: { action: 'list' },
                options: { signal: controller.signal } // Use signal for timeout
            }).catch(err => {
                // Return mock error if network fails immediately
                return { data: null, error: err };
            });

            clearTimeout(timeoutId);

            if (error) {
                console.warn('Edge Function admin-portal unavailable (404/500). Falling back to direct DB fetch.');
                // Fallback: Fetch directly from 'organizations' table
                // This will only show organizations the current user has access to (via RLS),
                // but for the owner/super-admin, this usually includes their own orgs.
                // Note: The 'admin-portal' function is needed to see ALL orgs if RLS is strict.

                const { data: dbData, error: dbError } = await supabase
                    .from('organizations')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (dbError) {
                    console.error('Fallback DB fetch failed:', dbError);
                    toast({
                        variant: 'destructive',
                        title: 'Erro de conexão',
                        description: 'Não foi possível carregar as clínicas (Edge Function & DB falharam).'
                    });
                    throw error; // Throw original error
                }

                // If DB fetch worked, use that data
                // Need to map to match the interface if necessary (it matches here)
                setOrganizations(dbData as Organization[] || []);

                // Show a small warning toast that this is "Restricted View"
                // toast({
                //    title: "Modo de Visualização Limitado",
                //    description: "Função administrativa offline. Vendo apenas clínicas permitidas.",
                //    variant: "default",
                //    duration: 3000
                // });
                return;
            }

            setOrganizations(data.organizations || []);
        } catch (error: any) {
            console.error('Error listing organizations:', error);
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
