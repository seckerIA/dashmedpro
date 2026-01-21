
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useUserProfile } from "./useUserProfile";

export type Supplier = {
    id: string;
    user_id: string;
    name: string;
    cnpj: string | null;
    email: string | null;
    phone: string | null;
    contact_person: string | null;
    address: string | null;
    created_at: string;
    updated_at: string;
};

export type SupplierInsert = Omit<Supplier, "id" | "created_at" | "updated_at">;
export type SupplierUpdate = Partial<SupplierInsert>;

export function useSuppliers() {
    const { user } = useAuth();
    const { profile } = useUserProfile();
    const queryClient = useQueryClient();

    const suppliersQuery = useQuery({
        queryKey: ["inventory-suppliers"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("inventory_suppliers")
                .select("*")
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
                    organization_id: profile?.organization_id
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventory-suppliers"] });
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
        },
    });

    const deleteSupplier = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("inventory_suppliers")
                .delete()
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventory-suppliers"] });
        },
    });

    return {
        suppliers: suppliersQuery.data || [],
        isLoading: suppliersQuery.isLoading,
        createSupplier,
        updateSupplier,
        deleteSupplier,
    };
}
