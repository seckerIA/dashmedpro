import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useDoctorSecretaries } from "@/hooks/useDoctorSecretaries";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface InboxSourceSelectorProps {
    currentOwnerId: string | 'all' | undefined;
    onOwnerChange: (ownerId: string | 'all' | undefined) => void;
}

export function InboxSourceSelector({
    currentOwnerId,
    onOwnerChange,
}: InboxSourceSelectorProps) {
    const { user } = useAuth();
    const { secretaryIds, isLoading: isLoadingIds } = useDoctorSecretaries();

    // Buscar detalhes dos perfis das secretárias
    const { data: secretaries, isLoading: isLoadingProfiles } = useQuery({
        queryKey: ["secretaries-profiles", secretaryIds],
        queryFn: async () => {
            if (!secretaryIds || secretaryIds.length === 0) return [];

            const { data } = await supabase
                .from("profiles")
                .select("id, full_name, email")
                .in("id", secretaryIds);

            return data || [];
        },
        enabled: secretaryIds.length > 0,
        staleTime: 10 * 60 * 1000,
    });

    const isLoading = isLoadingIds || isLoadingProfiles;

    // Se não tiver secretárias vinculadas, não mostrar o seletor (ou mostrar vazio se for médico, mas isso bloqueia o fluxo?)
    // Se for secretária, ela não vê isso (assumindo que esse comp só aparece pra quem tem essa permissão)
    // Mas como validar "sou médico"? O hook useDoctorSecretaries retorna vazio se não for médico (ou se não tiver links).
    // Vamos assumir que se secretaryIds > 0, mostramos.
    if (!isLoading && (!secretaries || secretaries.length === 0)) {
        return null;
    }

    if (isLoading) {
        return <Skeleton className="h-10 w-[200px]" />;
    }

    return (
        <Select
            value={currentOwnerId === 'all' ? 'all' : (currentOwnerId || 'all')}
            onValueChange={(val) => onOwnerChange(val === 'all' ? undefined : val)}
        >
            <SelectTrigger className="w-[240px] h-9 border-dashed">
                <div className="flex items-center gap-2 truncate">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="truncate">
                        <SelectValue placeholder="Filtrar por Secretária" />
                    </span>
                </div>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>Todas as Secretárias</span>
                    </div>
                </SelectItem>
                {secretaries?.map((sec) => (
                    <SelectItem key={sec.id} value={sec.id}>
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span>{sec.full_name || sec.email}</span>
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
