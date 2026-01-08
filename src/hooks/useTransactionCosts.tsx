import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { supabaseQueryWithTimeout } from '@/utils/supabaseQuery'
import { toast } from '@/hooks/use-toast'
import { TransactionCost, TransactionCostInsert, CostBreakdown } from '@/types/financial'

// ============================================
// BUSCAR CUSTOS DE UMA TRANSAÇÃO
// ============================================

export const useTransactionCosts = (transactionId?: string) => {
  return useQuery({
    queryKey: ['transaction-costs', transactionId],
    queryFn: async () => {
      if (!transactionId) return []

      const { data, error } = await supabase
        .from('transaction_costs')
        .select('*')
        .eq('transaction_id', transactionId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as TransactionCost[]
    },
    enabled: !!transactionId,
  })
}

// ============================================
// BUSCAR BREAKDOWN DE CUSTOS (DASHBOARD)
// ============================================

export const useCostsBreakdown = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['costs-breakdown', startDate, endDate],
    queryFn: async ({ signal }) => {
      let query = supabase
        .from('transaction_costs')
        .select(`
          cost_type,
          amount,
          transaction:financial_transactions(
            transaction_date,
            user_id
          )
        `)

      if (startDate && endDate) {
        // Filtrar por data através da transação
        const filteredTransactionsQuery = supabase
          .from('financial_transactions')
          .select('id')
          .gte('transaction_date', startDate)
          .lte('transaction_date', endDate)

        const filteredResult = await supabaseQueryWithTimeout(filteredTransactionsQuery as any, undefined, signal);
        const transactionIds = filteredResult.data?.map(t => t.id) || []

        if (transactionIds.length > 0) {
          query = query.in('transaction_id', transactionIds)
        }
      }

      const queryResult = await supabaseQueryWithTimeout(query as any, undefined, signal);
      const { data, error } = queryResult;

      if (error) throw error

      // Calcular totais por tipo
      const breakdown: { [key: string]: number } = {
        ferramentas: 0,
        operacional: 0,
        terceirizacao: 0,
      }

      data?.forEach((cost: any) => {
        if (cost.cost_type in breakdown) {
          breakdown[cost.cost_type] += Number(cost.amount)
        }
      })

      const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0)

      const costLabels: { [key: string]: string } = {
        ferramentas: 'Ferramentas',
        operacional: 'Operacional',
        terceirizacao: 'Terceirização',
      }

      const costColors: { [key: string]: string } = {
        ferramentas: '#3b82f6', // blue
        operacional: '#10b981', // green
        terceirizacao: '#f59e0b', // amber
      }

      const result: CostBreakdown[] = Object.entries(breakdown)
        .filter(([_, value]) => value > 0)
        .map(([type, value]) => ({
          type: type as 'ferramentas' | 'operacional' | 'terceirizacao',
          name: costLabels[type],
          value,
          percentage: total > 0 ? (value / total) * 100 : 0,
          color: costColors[type],
        }))

      return result
    },
  })
}

// ============================================
// CRIAR CUSTO
// ============================================

export const useCreateTransactionCost = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (cost: TransactionCostInsert) => {
      const { data, error } = await supabase
        .from('transaction_costs')
        .insert([cost])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['transaction-costs', data.transaction_id] })
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['financial-metrics'] })
      queryClient.invalidateQueries({ queryKey: ['costs-breakdown'] })

      toast({
        title: "Sucesso",
        description: "Custo adicionado com sucesso!",
      })
    },
    onError: (error) => {
      console.error('Error creating transaction cost:', error)
      toast({
        title: "Erro",
        description: "Erro ao adicionar custo. Tente novamente.",
        variant: "destructive",
      })
    },
  })
}

// ============================================
// ATUALIZAR CUSTO
// ============================================

export const useUpdateTransactionCost = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TransactionCost> & { id: string }) => {
      const { data, error } = await supabase
        .from('transaction_costs')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transaction-costs', data.transaction_id] })
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['financial-metrics'] })
      queryClient.invalidateQueries({ queryKey: ['costs-breakdown'] })

      toast({
        title: "Sucesso",
        description: "Custo atualizado com sucesso!",
      })
    },
    onError: (error) => {
      console.error('Error updating transaction cost:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar custo. Tente novamente.",
        variant: "destructive",
      })
    },
  })
}

// ============================================
// DELETAR CUSTO
// ============================================

export const useDeleteTransactionCost = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, transactionId }: { id: string; transactionId: string }) => {
      const { error } = await supabase
        .from('transaction_costs')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { id, transactionId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transaction-costs', data.transactionId] })
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['financial-metrics'] })
      queryClient.invalidateQueries({ queryKey: ['costs-breakdown'] })

      toast({
        title: "Sucesso",
        description: "Custo removido com sucesso!",
      })
    },
    onError: (error) => {
      console.error('Error deleting transaction cost:', error)
      toast({
        title: "Erro",
        description: "Erro ao remover custo. Tente novamente.",
        variant: "destructive",
      })
    },
  })
}

// ============================================
// CRIAR MÚLTIPLOS CUSTOS
// ============================================

export const useCreateMultipleCosts = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (costs: TransactionCostInsert[]) => {
      const { data, error } = await supabase
        .from('transaction_costs')
        .insert(costs)
        .select()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      if (data && data.length > 0) {
        const transactionId = data[0].transaction_id
        queryClient.invalidateQueries({ queryKey: ['transaction-costs', transactionId] })
        queryClient.invalidateQueries({ queryKey: ['financial-transactions'] })
        queryClient.invalidateQueries({ queryKey: ['financial-metrics'] })
        queryClient.invalidateQueries({ queryKey: ['costs-breakdown'] })
      }

      toast({
        title: "Sucesso",
        description: `${data.length} custo(s) adicionado(s) com sucesso!`,
      })
    },
    onError: (error) => {
      console.error('Error creating multiple costs:', error)
      toast({
        title: "Erro",
        description: "Erro ao adicionar custos. Tente novamente.",
        variant: "destructive",
      })
    },
  })
}

