import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { FinancialCategory } from '@/types/financial'

export const useFinancialCategories = () => {
  return useQuery({
    queryKey: ['financial-categories'],
    queryFn: async (): Promise<FinancialCategory[]> => {
      const { data, error } = await supabase
        .from('financial_categories')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error fetching financial categories:', error)
        throw error
      }

      return data || []
    },
  })
}
