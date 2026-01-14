import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface TaskCategory {
    id: string;
    user_id: string;
    name: string;
    color: string;
    icon: string | null;
    is_default: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateCategoryData {
    name: string;
    color: string;
    icon?: string;
}

export interface UpdateCategoryData {
    name?: string;
    color?: string;
    icon?: string;
}

// Cores disponíveis para categorias
export const CATEGORY_COLORS = [
    { value: 'text-blue-600', label: 'Azul', bg: 'bg-blue-100' },
    { value: 'text-purple-600', label: 'Roxo', bg: 'bg-purple-100' },
    { value: 'text-green-600', label: 'Verde', bg: 'bg-green-100' },
    { value: 'text-pink-600', label: 'Rosa', bg: 'bg-pink-100' },
    { value: 'text-amber-600', label: 'Âmbar', bg: 'bg-amber-100' },
    { value: 'text-red-600', label: 'Vermelho', bg: 'bg-red-100' },
    { value: 'text-cyan-600', label: 'Ciano', bg: 'bg-cyan-100' },
    { value: 'text-orange-600', label: 'Laranja', bg: 'bg-orange-100' },
    { value: 'text-teal-600', label: 'Teal', bg: 'bg-teal-100' },
    { value: 'text-indigo-600', label: 'Índigo', bg: 'bg-indigo-100' },
];

export function useTaskCategories() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Buscar categorias
    const {
        data: categories = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: ['task-categories', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];

            const { data, error } = await (supabase
                .from('task_categories' as any)
                .select('*')
                .order('is_default', { ascending: false })
                .order('name', { ascending: true }) as any);

            if (error) {
                console.error('Erro ao buscar categorias:', error);
                throw error;
            }

            return data as TaskCategory[];
        },
        enabled: !!user?.id,
    });

    // Criar categoria
    const createCategory = useMutation({
        mutationFn: async (data: CreateCategoryData) => {
            if (!user?.id) throw new Error('Usuário não autenticado');

            const { data: newCategory, error } = await (supabase
                .from('task_categories' as any)
                .insert({
                    user_id: user.id,
                    name: data.name,
                    color: data.color,
                    icon: data.icon || null,
                    is_default: false,
                } as any)
                .select()
                .single() as any);

            if (error) {
                console.error('Erro ao criar categoria:', error);
                throw error;
            }

            return newCategory as TaskCategory;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['task-categories'] });
        },
    });

    // Atualizar categoria
    const updateCategory = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateCategoryData }) => {
            const { data: updated, error } = await (supabase
                .from('task_categories' as any)
                .update(data as any)
                .eq('id', id)
                .select()
                .single() as any);

            if (error) {
                console.error('Erro ao atualizar categoria:', error);
                throw error;
            }

            return updated as TaskCategory;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['task-categories'] });
        },
    });

    // Deletar categoria
    const deleteCategory = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await (supabase
                .from('task_categories' as any)
                .delete()
                .eq('id', id) as any);

            if (error) {
                console.error('Erro ao deletar categoria:', error);
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['task-categories'] });
        },
    });

    return {
        categories,
        isLoading,
        error,
        createCategory: createCategory.mutateAsync,
        updateCategory: updateCategory.mutateAsync,
        deleteCategory: deleteCategory.mutateAsync,
        isCreating: createCategory.isPending,
        isUpdating: updateCategory.isPending,
        isDeleting: deleteCategory.isPending,
    };
}
