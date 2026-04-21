import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { FinancialCategory } from '@/types/financial'
import { useUserProfile } from './useUserProfile'

interface CreateCategoryData {
    name: string
    type: 'entrada' | 'saida'
    color?: string
    icon?: string
    is_fixed?: boolean
}

export const useCreateFinancialCategory = () => {
    const queryClient = useQueryClient()
    const { profile } = useUserProfile()

    return useMutation({
        mutationFn: async (category: CreateCategoryData) => {
            if (!profile?.organization_id) {
                throw new Error('Organização não encontrada')
            }

            const { data, error } = await supabase
                .from('financial_categories')
                .insert({
                    name: category.name,
                    type: category.type,
                    color: category.color || '#64748b',
                    icon: category.icon || null,
                    is_fixed: category.is_fixed || false,
                    is_system: false,
                    organization_id: profile.organization_id
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
    const { profile } = useUserProfile()

    return useMutation({
        mutationFn: async () => {
            if (!profile?.organization_id) {
                throw new Error('Organização não encontrada')
            }

            // Apenas 2 categorias default (1 entrada, 1 saída)
            const defaultCategories = [
                { name: 'Receitas Gerais', type: 'entrada', color: '#10b981', organization_id: profile.organization_id, is_system: false },
                { name: 'Despesas Gerais', type: 'saida', color: '#ef4444', organization_id: profile.organization_id, is_system: false },
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
