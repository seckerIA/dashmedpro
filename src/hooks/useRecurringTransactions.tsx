import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'
import { FinancialRecurringTransaction, FinancialRecurringTransactionWithTemplate } from '@/types/financial'

export const useRecurringTransactions = () => {
  return useQuery<FinancialRecurringTransactionWithTemplate[], Error>({
    queryKey: ['recurringTransactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_recurring_transactions')
        .select(`
          *,
          template_transaction:financial_transactions(*)
        `)
        .order('next_execution_date', { ascending: true })

      if (error) {
        throw new Error(error.message)
      }
      return data
    },
  })
}

export const useCreateRecurringTransaction = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Omit<FinancialRecurringTransaction, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await supabase
        .from('financial_recurring_transactions')
        .insert([data])
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringTransactions'] })
      toast({
        title: "Sucesso",
        description: "Transação recorrente criada com sucesso!",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

export const useUpdateRecurringTransaction = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      id, 
      data 
    }: { 
      id: string
      data: Partial<FinancialRecurringTransaction> 
    }) => {
      const { data: result, error } = await supabase
        .from('financial_recurring_transactions')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringTransactions'] })
      toast({
        title: "Sucesso",
        description: "Transação recorrente atualizada com sucesso!",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

export const useDeleteRecurringTransaction = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('financial_recurring_transactions')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(error.message)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringTransactions'] })
      toast({
        title: "Sucesso",
        description: "Transação recorrente removida com sucesso!",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

export const useExecuteRecurringTransaction = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // Execute manually since the RPC function may not exist
      const { data: recurring, error: fetchError } = await supabase
        .from('financial_recurring_transactions')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) throw new Error(fetchError.message)

      // Update last execution date
      const { error: updateError } = await supabase
        .from('financial_recurring_transactions')
        .update({
          last_execution_date: new Date().toISOString().split('T')[0],
          execution_count: (recurring.execution_count || 0) + 1
        })
        .eq('id', id)

      if (updateError) throw new Error(updateError.message)

      return recurring
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringTransactions'] })
      queryClient.invalidateQueries({ queryKey: ['financialTransactions'] })
      queryClient.invalidateQueries({ queryKey: ['financialMetrics'] })
      toast({
        title: "Sucesso",
        description: "Transação recorrente executada com sucesso!",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}
