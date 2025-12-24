import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CommercialCampaign, CommercialCampaignInsert, CommercialCampaignUpdate } from "@/types/commercial";

export function useCommercialCampaigns() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: campaigns, isLoading, error } = useQuery({
    queryKey: ["commercial-campaigns", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("commercial_campaigns")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CommercialCampaign[];
    },
    enabled: !!user,
  });

  const createCampaign = useMutation({
    mutationFn: async (campaign: CommercialCampaignInsert) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("commercial_campaigns")
        .insert({ ...campaign, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data as CommercialCampaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commercial-campaigns"] });
      toast({
        title: "Campanha criada",
        description: "A campanha foi criada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar campanha",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCampaign = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: CommercialCampaignUpdate }) => {
      const { data, error } = await supabase
        .from("commercial_campaigns")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as CommercialCampaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commercial-campaigns"] });
      toast({
        title: "Campanha atualizada",
        description: "A campanha foi atualizada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar campanha",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("commercial_campaigns")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commercial-campaigns"] });
      toast({
        title: "Campanha excluída",
        description: "A campanha foi excluída com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir campanha",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    campaigns: campaigns || [],
    isLoading,
    error,
    createCampaign,
    updateCampaign,
    deleteCampaign,
  };
}
















