import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMedicalRecords } from "@/hooks/useMedicalRecords";
import { useToast } from "@/hooks/use-toast";
import { PatientHeader } from "@/components/medical-records/PatientHeader";
import { SinglePageRecordForm } from "@/components/medical-records/SinglePageRecordForm";
import { CompactRecordForm } from "@/components/medical-records/CompactRecordForm";
import { Patient, CreateMedicalRecordInput } from "@/types/medicalRecords";
import { Button } from "@/components/ui/button";
import { Loader2, LayoutList, LayoutGrid } from "lucide-react";

export default function Prontuario() {
  const { patientId, appointmentId } = useParams<{
    patientId: string;
    appointmentId?: string;
  }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { createRecord, isCreating } = useMedicalRecords(patientId);
  const [viewMode, setViewMode] = useState<'full' | 'compact'>('full');

  // Buscar dados do paciente
  const { data: patient, isLoading: isLoadingPatient } = useQuery({
    queryKey: ["patient-details", patientId],
    queryFn: async () => {
      if (!patientId) return null;

      const { data, error } = await supabase
        .from("crm_contacts")
        .select(`
          id,
          full_name,
          email,
          phone,
          cpf,
          gender,
          birth_date,
          blood_type,
          health_insurance_type,
          health_insurance_name,
          allergies,
          chronic_conditions,
          current_medications,
          emergency_contact,
          created_at,
          updated_at
        `)
        .eq("id", patientId)
        .single();

      if (error) throw error;

      // Mapear para o tipo Patient
      return {
        id: data.id,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        cpf: data.cpf,
        gender: data.gender,
        birth_date: data.birth_date,
        blood_type: data.blood_type,
        insurance_type: data.health_insurance_type,
        insurance_name: data.health_insurance_name,
        allergies: data.allergies,
        chronic_conditions: data.chronic_conditions,
        current_medications: data.current_medications,
        emergency_contact: data.emergency_contact,
        created_at: data.created_at,
        updated_at: data.updated_at,
      } as Patient;
    },
    enabled: !!patientId,
  });

  const handleSave = async (
    data: CreateMedicalRecordInput,
    status: "draft" | "completed"
  ) => {
    try {
      await createRecord.mutateAsync({
        ...data,
        // record_status será definido baseado no status
      });

      toast({
        title: status === "completed" ? "Atendimento finalizado" : "Rascunho salvo",
        description:
          status === "completed"
            ? "O prontuário foi salvo com sucesso."
            : "O rascunho foi salvo. Você pode continuar depois.",
      });

      if (status === "completed") {
        // Voltar para a página anterior ou para o calendário
        navigate(-1);
      }
    } catch (error: any) {
      console.error("Erro ao salvar prontuário:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar o prontuário.",
      });
    }
  };

  if (!patientId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Paciente não especificado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header do Paciente */}
      <PatientHeader patient={patient || null} isLoading={isLoadingPatient} />

      {/* Toggle de visualização */}
      <div className="max-w-4xl mx-auto px-4 pt-4 flex items-center justify-end gap-2">
        <span className="text-xs text-muted-foreground mr-1">Visualização:</span>
        <div className="flex rounded-lg border border-border overflow-hidden">
          <Button
            variant={viewMode === 'full' ? 'default' : 'ghost'}
            size="sm"
            className="h-8 rounded-none gap-1.5 text-xs"
            onClick={() => setViewMode('full')}
          >
            <LayoutList className="h-3.5 w-3.5" />
            Completo
          </Button>
          <Button
            variant={viewMode === 'compact' ? 'default' : 'ghost'}
            size="sm"
            className="h-8 rounded-none gap-1.5 text-xs"
            onClick={() => setViewMode('compact')}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Compacto
          </Button>
        </div>
      </div>

      {/* Formulário */}
      <div className="max-w-4xl mx-auto p-4 pt-2">
        {isLoadingPatient ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : viewMode === 'compact' ? (
          <CompactRecordForm
            patientId={patientId}
            appointmentId={appointmentId}
            onSave={handleSave}
            isSaving={isCreating}
          />
        ) : (
          <SinglePageRecordForm
            patientId={patientId}
            appointmentId={appointmentId}
            onSave={handleSave}
            isSaving={isCreating}
          />
        )}
      </div>
    </div>
  );
}
