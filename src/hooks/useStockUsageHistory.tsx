
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { supabaseQueryWithTimeout } from "@/utils/supabaseQuery";

export type StockUsageHistoryItem = {
    id: string;
    quantity: number;
    created_at: string;
    appointment: {
        id: string;
        title: string;
        start_time: string;
        patient_name: string;
        doctor_name: string;
    };
    item: {
        id: string;
        name: string;
        unit: string;
    };
};

export function useStockUsageHistory() {
    const { user } = useAuth();

    const query = useQuery({
        queryKey: ["stock-usage-history", user?.id],
        queryFn: async (): Promise<StockUsageHistoryItem[]> => {
            const { data, error } = await supabase
                .from("appointment_stock_usage")
                .select(`
                    id,
                    quantity,
                    created_at,
                    medical_appointments (
                        id,
                        title,
                        start_time,
                        contact:crm_contacts(full_name),
                        doctor:profiles!medical_appointments_doctor_id_profiles_fk(full_name)
                    ),
                    inventory_items (
                        id,
                        name,
                        unit
                    )
                `)
                .order("created_at", { ascending: false })
                .limit(100);

            if (error) throw error;

            console.log("Stock usage data raw:", data);

            return data.map((d: any) => ({
                id: d.id,
                quantity: d.quantity,
                created_at: d.created_at,
                appointment: {
                    id: d.medical_appointments?.id,
                    title: d.medical_appointments?.title,
                    start_time: d.medical_appointments?.start_time,
                    patient_name: d.medical_appointments?.contact?.full_name || "Paciente Removido",
                    doctor_name: d.medical_appointments?.doctor?.full_name || "N/A"
                },
                item: {
                    id: d.inventory_items?.id,
                    name: d.inventory_items?.name || "Item Removido",
                    unit: d.inventory_items?.unit || "un"
                }
            }));
        },
        enabled: !!user,
    });

    return query;
}
