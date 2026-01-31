import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Heart, Phone, Mail, Calendar, ArrowLeft, User } from "lucide-react";
import { format, differenceInYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Patient } from "@/types/medicalRecords";
import { useNavigate } from "react-router-dom";

interface PatientHeaderProps {
  patient: Patient | null;
  isLoading?: boolean;
}

export function PatientHeader({ patient, isLoading }: PatientHeaderProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center gap-4 animate-pulse">
          <div className="w-12 h-12 rounded-full bg-muted" />
          <div className="space-y-2">
            <div className="h-5 w-48 bg-muted rounded" />
            <div className="h-4 w-32 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <p className="text-muted-foreground">Paciente não encontrado</p>
        </div>
      </div>
    );
  }

  const age = patient.birth_date
    ? differenceInYears(new Date(), new Date(patient.birth_date))
    : null;

  const initials = patient.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "??";

  const hasAllergies = patient.allergies && patient.allergies.length > 0;
  const hasChronicConditions = patient.chronic_conditions && patient.chronic_conditions.length > 0;

  return (
    <div className="bg-card border-b border-border">
      <div className="p-4">
        <div className="flex items-center gap-4">
          {/* Botão voltar */}
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>

          {/* Avatar */}
          <Avatar className="w-12 h-12 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Info principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold truncate">{patient.full_name}</h1>
              {age && (
                <span className="text-sm text-muted-foreground">
                  {age} anos
                </span>
              )}
              {patient.gender && (
                <Badge variant="outline" className="text-xs">
                  {patient.gender === 'masculino' ? 'M' : patient.gender === 'feminino' ? 'F' : 'O'}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
              {patient.insurance_type && (
                <Badge
                  variant={patient.insurance_type === 'particular' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {patient.insurance_type === 'particular' ? 'Particular' : patient.insurance_name || 'Convênio'}
                </Badge>
              )}
              {patient.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {patient.phone}
                </span>
              )}
              {patient.blood_type && (
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3 text-red-500" />
                  {patient.blood_type}
                </span>
              )}
            </div>
          </div>

          {/* Alertas */}
          <div className="flex items-center gap-2">
            {hasAllergies && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="w-3 h-3" />
                Alergias: {patient.allergies?.join(", ")}
              </Badge>
            )}
            {hasChronicConditions && (
              <Badge variant="outline" className="gap-1 border-orange-500 text-orange-600">
                <Heart className="w-3 h-3" />
                {patient.chronic_conditions?.length} condição(ões)
              </Badge>
            )}
          </div>
        </div>

        {/* Medicamentos em uso */}
        {patient.current_medications && patient.current_medications.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Medicamentos em uso:</span>{" "}
              {patient.current_medications.join(", ")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
