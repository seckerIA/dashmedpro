import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { FinancialTransaction } from '@/types/financial'
import { toast } from '@/hooks/use-toast'

export const useCreateFinancialTransaction = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (transaction: Omit<FinancialTransaction, 'id' | 'created_at' | 'updated_at'>) => {
      console.log('useCreateFinancialTransaction - mutationFn chamado com:', transaction)

      const { data, error } = await supabase
        .from('financial_transactions')
        .insert([transaction])
        .select()
        .single()

      console.log('Supabase response:', { data, error })

      if (error) {
        console.error('Error creating financial transaction:', error)
        throw error
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['financial-metrics'] })
      queryClient.invalidateQueries({ queryKey: ['financial-accounts'] })
      toast({
        title: "Sucesso",
        description: "Transação criada com sucesso!",
      })
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao criar transação. Tente novamente.",
        variant: "destructive",
      })
    },
  })
}

export const useUpdateFinancialTransaction = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...transaction }: Partial<FinancialTransaction> & { id: string }) => {
      const { data, error } = await supabase
        .from('financial_transactions')
        .update(transaction)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating financial transaction:', error)
        throw error
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['financial-metrics'] })
      queryClient.invalidateQueries({ queryKey: ['financial-accounts'] })
      queryClient.invalidateQueries({ queryKey: ['financial-monthly-data'] })
      queryClient.invalidateQueries({ queryKey: ['financial-expenses-by-category'] })
      queryClient.invalidateQueries({ queryKey: ['transaction-costs'] })
      queryClient.invalidateQueries({ queryKey: ['secretary-sinal-metrics'] })
      toast({
        title: "Sucesso",
        description: "Transação atualizada com sucesso!",
      })
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar transação. Tente novamente.",
        variant: "destructive",
      })
    },
  })
}

export const useDeleteFinancialTransaction = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting financial transaction:', error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['financial-metrics'] })
      queryClient.invalidateQueries({ queryKey: ['financial-accounts'] })
      toast({
        title: "Sucesso",
        description: "Transação excluída com sucesso!",
      })
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao excluir transação. Tente novamente.",
        variant: "destructive",
      })
    },
  })
}
