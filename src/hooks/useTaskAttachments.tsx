import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseQueryWithTimeout } from '@/utils/supabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface TaskAttachment {
    id: string;
    task_id: string;
    user_id: string;
    file_name: string;
    file_type: string;
    file_size: number;
    file_url: string;
    storage_path: string;
    created_at: string;
}

// Tipos de arquivo permitidos
export const ALLOWED_FILE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
];

// Tamanho máximo: 50MB
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

export function useTaskAttachments(taskId?: string) {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Buscar anexos de uma tarefa
    const {
        data: attachments = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: ['task-attachments', taskId],
        queryFn: async ({ signal }) => {
            if (!taskId) return [];

            const queryPromise = supabase
                .from('task_attachments' as any)
                .select('*')
                .eq('task_id', taskId)
                .order('created_at', { ascending: false }) as any;

            const { data, error } = await supabaseQueryWithTimeout(
                queryPromise,
                20000,
                signal
            );

            if (error) {
                if (error.message?.includes('AbortError')) return [];
                console.error('Erro ao buscar anexos:', error);
                throw error;
            }

            return data as TaskAttachment[];
        },
        enabled: !!taskId,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });

    // Upload de arquivo
    const uploadAttachment = useMutation({
        mutationFn: async ({ file, taskId }: { file: File; taskId: string }) => {
            if (!user?.id) throw new Error('Usuário não autenticado');

            // Validar tipo de arquivo
            if (!ALLOWED_FILE_TYPES.includes(file.type)) {
                throw new Error('Tipo de arquivo não permitido');
            }

            // Validar tamanho
            if (file.size > MAX_FILE_SIZE) {
                throw new Error('Arquivo muito grande (máximo 10MB)');
            }

            // Gerar nome único
            const fileExt = file.name.split('.').pop();
            const fileName = `${taskId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

            // Upload para storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('task-attachments')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) {
                console.error('Erro no upload:', uploadError);
                throw new Error('Falha no upload do arquivo');
            }

            // Obter URL pública
            const { data: urlData } = supabase.storage
                .from('task-attachments')
                .getPublicUrl(fileName);

            // Salvar registro no banco
            const { data: attachmentData, error: dbError } = await (supabase
                .from('task_attachments' as any)
                .insert({
                    task_id: taskId,
                    user_id: user.id,
                    file_name: file.name,
                    file_type: file.type,
                    file_size: file.size,
                    file_url: urlData.publicUrl,
                    storage_path: fileName,
                } as any)
                .select()
                .single() as any);

            if (dbError) {
                // Se falhou no banco, deletar do storage
                await supabase.storage.from('task-attachments').remove([fileName]);
                throw dbError;
            }

            return attachmentData as TaskAttachment;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['task-attachments'] });
            toast({
                title: 'Arquivo anexado',
                description: 'O arquivo foi anexado com sucesso.',
            });
        },
        onError: (error: any) => {
            toast({
                variant: 'destructive',
                title: 'Erro ao anexar arquivo',
                description: error.message || 'Tente novamente.',
            });
        },
    });

    // Deletar anexo
    const deleteAttachment = useMutation({
        mutationFn: async (attachment: TaskAttachment) => {
            // Deletar do storage
            const { error: storageError } = await supabase.storage
                .from('task-attachments')
                .remove([attachment.storage_path]);

            if (storageError) {
                console.error('Erro ao deletar do storage:', storageError);
            }

            // Deletar do banco
            const { error: dbError } = await (supabase
                .from('task_attachments' as any)
                .delete()
                .eq('id', attachment.id) as any);

            if (dbError) throw dbError;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['task-attachments'] });
            toast({
                title: 'Anexo removido',
                description: 'O arquivo foi removido com sucesso.',
            });
        },
        onError: (error: any) => {
            toast({
                variant: 'destructive',
                title: 'Erro ao remover anexo',
                description: error.message || 'Tente novamente.',
            });
        },
    });

    return {
        attachments,
        isLoading,
        error,
        uploadAttachment: uploadAttachment.mutateAsync,
        deleteAttachment: deleteAttachment.mutateAsync,
        isUploading: uploadAttachment.isPending,
        isDeleting: deleteAttachment.isPending,
    };
}

// Função utilitária para obter ícone baseado no tipo de arquivo
export function getFileIcon(fileType: string): string {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType === 'application/pdf') return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType === 'text/plain') return '📃';
    return '📎';
}

// Função utilitária para formatar tamanho de arquivo
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
