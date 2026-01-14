import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { FinancialCategory } from '@/types/financial'

interface CreateCategoryData {
    name: string
    type: 'entrada' | 'saida'
    color?: string
    icon?: string
}

export const useCreateFinancialCategory = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (category: CreateCategoryData) => {
            const { data, error } = await supabase
                .from('financial_categories')
                .insert({
                    name: category.name,
                    type: category.type,
                    color: category.color || '#64748b',
                    icon: category.icon || null,
                    is_system: false
                } as any)
                .select()
                .single()

            if (error) {
                console.error('Erro ao criar categoria:', error)
                throw error
            }

            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['financial-categories'] })
        },
    })
}


export const useCreateDefaultCategories = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async () => {
            const defaultCategories = [
                { name: 'Vendas', type: 'entrada', color: '#10b981' },
                { name: 'Serviços', type: 'entrada', color: '#3b82f6' },
                { name: 'Outras Receitas', type: 'entrada', color: '#8b5cf6' },
                { name: 'Despesas Operacionais', type: 'saida', color: '#ef4444' },
                { name: 'Fornecedores', type: 'saida', color: '#f59e0b' },
                { name: 'Marketing', type: 'saida', color: '#ec4899' },
                { name: 'Impostos', type: 'saida', color: '#6366f1' },
            ]

            const { data, error } = await supabase
                .from('financial_categories')
                .insert(defaultCategories as any)
                .select()

            if (error) throw error
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['financial-categories'] })
        },
    })
}

export const useDeleteFinancialCategory = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (categoryId: string) => {
            const { error } = await supabase
                .from('financial_categories')
                .delete()
                .eq('id', categoryId)

            if (error) {
                console.error('Erro ao excluir categoria:', error)
                throw error
            }

            return categoryId
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['financial-categories'] })
        },
    })
}
