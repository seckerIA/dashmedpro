
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useUserProfile } from "./useUserProfile";
import { useToast } from "./use-toast";

export type Supplier = {
    id: string;
    user_id: string;
    name: string;
    cnpj: string | null;
    email: string | null;
    phone: string | null;
    contact_person: string | null;
    address: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

export type SupplierInsert = Omit<Supplier, "id" | "created_at" | "updated_at" | "is_active">;
export type SupplierUpdate = Partial<SupplierInsert>;

export function useSuppliers() {
    const { user } = useAuth();
    const { profile } = useUserProfile();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // Buscar apenas fornecedores ativos
    const suppliersQuery = useQuery({
        queryKey: ["inventory-suppliers"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("inventory_suppliers")
                .select("*")
                .eq("is_active", true)
                .order("name");

            if (error) throw error;
            return data as Supplier[];
        },
        enabled: !!user,
    });

    const createSupplier = useMutation({
        mutationFn: async (supplier: SupplierInsert) => {
            const { data, error } = await supabase
                .from("inventory_suppliers")
                .insert([{
                    ...supplier,
                    organization_id: profile?.organization_id,
                    is_active: true
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventory-suppliers"] });
            toast({
                title: "Fornecedor criado",
                description: "Fornecedor cadastrado com sucesso.",
            });
        },
        onError: (error: any) => {
            toast({
                variant: "destructive",
                title: "Erro ao criar fornecedor",
                description: error.message || "Não foi possível criar o fornecedor.",
            });
        },
    });

    const updateSupplier = useMutation({
        mutationFn: async ({ id, ...supplier }: SupplierUpdate & { id: string }) => {
            const { data, error } = await supabase
                .from("inventory_suppliers")
                .update(supplier)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventory-suppliers"] });
            toast({
                title: "Fornecedor atualizado",
                description: "Dados do fornecedor atualizados com sucesso.",
            });
        },
        onError: (error: any) => {
            toast({
                variant: "destructive",
                title: "Erro ao atualizar",
                description: error.message || "Não foi possível atualizar o fornecedor.",
            });
        },
    });

    // Desativar fornecedor (em vez de excluir)
    const deactivateSupplier = useMutation({
        mutationFn: async (id: string) => {
            const { data, error } = await supabase
                .from("inventory_suppliers")
                .update({ is_active: false })
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventory-suppliers"] });
            toast({
                title: "Fornecedor desativado",
                description: "O fornecedor foi desativado e não aparecerá mais na lista.",
            });
        },
        onError: (error: any) => {
            console.error("Erro ao desativar fornecedor:", error);
            toast({
                variant: "destructive",
                title: "Erro ao desativar",
                description: error.message || "Não foi possível desativar o fornecedor.",
            });
        },
    });

    return {
        suppliers: suppliersQuery.data || [],
        isLoading: suppliersQuery.isLoading,
        createSupplier,
        updateSupplier,
        deactivateSupplier,
    };
}
