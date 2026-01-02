import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { useUserProfile } from "./useUserProfile";
import { useSecretaryDoctors } from "./useSecretaryDoctors";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CommercialSale, CommercialSaleInsert, CommercialSaleUpdate } from "@/types/commercial";

export function useCommercialSales(filters?: { status?: string; procedure_id?: string }) {
  const { user } = useAuth();
  const { isSecretaria } = useUserProfile();
  const { doctorIds } = useSecretaryDoctors();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sales, isLoading, error } = useQuery({
    queryKey: ["commercial-sales", user?.id, filters, isSecretaria, doctorIds],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const targetUserIds = isSecretaria ? [user.id, ...(doctorIds || [])] : [user.id];

      let query = supabase
        .from("commercial_sales" as any)
        .select(`
          *,
          doctor:profiles!commercial_sales_user_id_profiles_fk (full_name, email)
        `)
        .in("user_id", targetUserIds)
        .order("created_at", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      if (filters?.procedure_id) {
        query = query.eq("procedure_id", filters.procedure_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as CommercialSale[];
    },
    enabled: !!user,
  });

  const createSale = useMutation({
    mutationFn: async (sale: CommercialSaleInsert) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("commercial_sales")
        .insert({ ...sale, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data as CommercialSale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commercial-sales"] });
      queryClient.invalidateQueries({ queryKey: ["commercial-metrics"] });
      toast({
        title: "Venda criada",
        description: "A venda foi criada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar venda",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateSale = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: CommercialSaleUpdate }) => {
      const { data, error } = await supabase
        .from("commercial_sales")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as CommercialSale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commercial-sales"] });
      queryClient.invalidateQueries({ queryKey: ["commercial-metrics"] });
      toast({
        title: "Venda atualizada",
        description: "A venda foi atualizada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar venda",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteSale = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("commercial_sales")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commercial-sales"] });
      queryClient.invalidateQueries({ queryKey: ["commercial-metrics"] });
      toast({
        title: "Venda excluída",
        description: "A venda foi excluída com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir venda",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    sales: sales || [],
    isLoading,
    error,
    createSale,
    updateSale,
    deleteSale,
  };
}

















