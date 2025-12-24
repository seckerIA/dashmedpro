import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseQueryWithTimeout } from '@/utils/supabaseQuery';
import { ensureValidSession } from '@/utils/supabaseHelpers';
import { useAuth } from './useAuth';
import { 
  ProspectingScriptInsert, 
  ProspectingScriptUpdate, 
  ProspectingScriptWithCreator,
  ScriptCard 
} from '@/types/prospecting';
import { useToast } from './use-toast';

export function useProspectingScripts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Buscar scripts do usuário e scripts públicos de outros usuários
  const { data: scripts = [], isLoading } = useQuery<ProspectingScriptWithCreator[]>({
    queryKey: ['prospecting-scripts', user?.id],
    queryFn: async ({ signal }) => {
      if (!user?.id) return [];
      
      // Verificar e garantir sessão válida
      await ensureValidSession();
      
      // Buscar scripts do próprio usuário
      const myScriptsQuery = supabase
        .from('prospecting_scripts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      const myScriptsResult = await supabaseQueryWithTimeout(myScriptsQuery, 30000, signal);
      const { data: myScripts, error: myError } = myScriptsResult;

      if (myError) throw myError;

      // Buscar scripts públicos de outros usuários (sem join por enquanto)
      const publicScriptsQuery = supabase
        .from('prospecting_scripts')
        .select('*')
        .eq('is_public', true)
        .neq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      const publicScriptsResult = await supabaseQueryWithTimeout(publicScriptsQuery, 30000, signal);
      const { data: publicScripts, error: publicError } = publicScriptsResult;

      if (publicError) throw publicError;

      // Para os scripts públicos, buscar info dos criadores
      const scriptResults: ProspectingScriptWithCreator[] = [...(myScripts || [])];
      
      if (publicScripts && publicScripts.length > 0) {
        const creatorIds = [...new Set(publicScripts.map(s => s.user_id))];
        
        const creatorsQuery = supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', creatorIds);
        
        const creatorsResult = await supabaseQueryWithTimeout(creatorsQuery, 30000, signal);
        const { data: creators, error: creatorsError } = creatorsResult;
        
        if (!creatorsError && creators) {
          const creatorsMap = new Map(creators.map(c => [c.id, c]));
          
          publicScripts.forEach(script => {
            scriptResults.push({
              ...script,
              creator: creatorsMap.get(script.user_id)
            });
          });
        } else {
          // Se falhar buscar criadores, adiciona scripts sem info de criador
          scriptResults.push(...publicScripts);
        }
      }

      return scriptResults;
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: 1000,
  });

  // Criar novo script
  const createScript = useMutation({
    mutationFn: async (scriptData: { name: string; cards: ScriptCard[]; is_public?: boolean; original_script_id?: string }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      // Verificar limite de 5 scripts pessoais (não contar cópias)
      const myScripts = scripts.filter(s => s.user_id === user.id && !s.is_copy);
      if (myScripts.length >= 5 && !scriptData.original_script_id) {
        throw new Error('Você atingiu o limite máximo de 5 roteiros salvos.');
      }

      const { data, error} = await supabase
        .from('prospecting_scripts')
        .insert({
          user_id: user.id,
          name: scriptData.name,
          cards: scriptData.cards as any,
          is_public: scriptData.is_public || false,
          is_copy: !!scriptData.original_script_id,
          original_script_id: scriptData.original_script_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospecting-scripts'] });
      toast({
        title: 'Roteiro criado',
        description: 'O roteiro foi salvo com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar roteiro',
        description: error.message,
      });
    },
  });

  // Atualizar script existente
  const updateScript = useMutation({
    mutationFn: async ({ scriptId, data }: { scriptId: string; data: Partial<ProspectingScriptUpdate> }) => {
      const { data: updated, error } = await supabase
        .from('prospecting_scripts')
        .update(data)
        .eq('id', scriptId)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospecting-scripts'] });
      toast({
        title: 'Roteiro atualizado',
        description: 'As alterações foram salvas com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar roteiro',
        description: error.message,
      });
    },
  });

  // Deletar script
  const deleteScript = useMutation({
    mutationFn: async (scriptId: string) => {
      const { error } = await supabase
        .from('prospecting_scripts')
        .delete()
        .eq('id', scriptId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospecting-scripts'] });
      toast({
        title: 'Roteiro excluído',
        description: 'O roteiro foi removido com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir roteiro',
        description: error.message,
      });
    },
  });

  // Duplicar script (criar cópia pessoal de um script público)
  const duplicateScript = useMutation({
    mutationFn: async (originalScriptId: string) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      // Buscar script original
      const originalScript = scripts.find(s => s.id === originalScriptId);
      if (!originalScript) throw new Error('Roteiro original não encontrado');
      
      // Criar cópia pessoal
      const { data, error } = await supabase
        .from('prospecting_scripts')
        .insert({
          user_id: user.id,
          name: `${originalScript.name} (Cópia)`,
          cards: originalScript.cards,
          is_public: false, // Cópias pessoais são sempre privadas
          is_copy: true,
          original_script_id: originalScriptId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospecting-scripts'] });
      toast({
        title: 'Cópia criada',
        description: 'Uma cópia editável do roteiro foi salva na sua conta.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao duplicar roteiro',
        description: error.message,
      });
    },
  });

  return {
    scripts,
    isLoading,
    createScript: createScript.mutateAsync,
    updateScript: updateScript.mutateAsync,
    deleteScript: deleteScript.mutateAsync,
    duplicateScript: duplicateScript.mutateAsync,
    isCreating: createScript.isPending,
    isUpdating: updateScript.isPending,
    isDeleting: deleteScript.isPending,
    isDuplicating: duplicateScript.isPending,
  };
}





