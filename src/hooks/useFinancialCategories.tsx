import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { FinancialCategory } from '@/types/financial'

export const useFinancialCategories = () => {
  return useQuery({
    queryKey: ['financial-categories'],
    queryFn: async (): Promise<FinancialCategory[]> => {
      console.log('🔍 useFinancialCategories - Buscando categorias...')
      const { data, error } = await supabase
        .from('financial_categories')
        .select('*')
        .order('name')

      if (error) {
        console.error('❌ Error fetching financial categories:', error)
        throw error
      }

      console.log('✅ useFinancialCategories - Categorias encontradas:', data?.length || 0)
      if (data && data.length > 0) {
        console.log('   Categorias:', data.map(c => ({ id: c.id, name: c.name, type: c.type })))
      }

      return data || []
    },
    staleTime: 0, // Sempre buscar dados frescos
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
}
