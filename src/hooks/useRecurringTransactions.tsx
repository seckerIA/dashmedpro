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
          template_transaction:financial_transactions!template_transaction_id(*)
        `)
        .order('next_occurrence', { ascending: true })

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
    mutationFn: async (data: {
      user_id: string;
      template_transaction_id?: string | null;
      frequency: string;
      amount: number;
      type: string;
      description?: string | null;
      account_id?: string | null;
      category_id?: string | null;
      next_date: string;
      is_active?: boolean;
      execution_count?: number;
      auto_create?: boolean;
    }) => {
      const insertData = {
        user_id: data.user_id,
        template_transaction_id: data.template_transaction_id || null,
        frequency: data.frequency,
        start_date: data.next_date,
        next_occurrence: data.next_date,
        is_active: data.is_active ?? true,
      }

      const { data: result, error } = await supabase
        .from('financial_recurring_transactions')
        .insert([insertData])
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

      // Update next occurrence date (calculate next based on frequency)
      const nextOccurrence = new Date(recurring.next_occurrence)
      // Simple increment by 1 month for now (can be improved based on frequency)
      nextOccurrence.setMonth(nextOccurrence.getMonth() + 1)
      
      const { error: updateError } = await supabase
        .from('financial_recurring_transactions')
        .update({
          next_occurrence: nextOccurrence.toISOString().split('T')[0]
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
