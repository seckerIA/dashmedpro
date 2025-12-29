import { usePatientRecordHistory } from '@/hooks/useMedicalRecords';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MEDICAL_RECORD_TYPE_LABELS } from '@/types/medicalRecords';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface PatientHistorySidebarProps {
  contactId: string | null;
}

export function PatientHistorySidebar({ contactId }: PatientHistorySidebarProps) {
  const { history, isLoading } = usePatientRecordHistory(contactId);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!contactId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Histórico do Paciente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhum paciente selecionado
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Histórico do Paciente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Histórico do Paciente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              Nenhum prontuário anterior
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Este é o primeiro atendimento do paciente
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full overflow-auto">
      <CardHeader>
        <CardTitle className="text-sm">
          Histórico do Paciente
          <Badge variant="secondary" className="ml-2">
            {history.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {history.map((record: any) => (
          <Card key={record.id} className="border-l-4 border-l-primary">
            <CardContent className="p-3 space-y-2">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(record.created_at), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {MEDICAL_RECORD_TYPE_LABELS[record.record_type as keyof typeof MEDICAL_RECORD_TYPE_LABELS]}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() =>
                    setExpandedId(expandedId === record.id ? null : record.id)
                  }
                >
                  {expandedId === record.id ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Quick Info */}
              {record.chief_complaint && (
                <div>
                  <p className="text-xs font-semibold">Queixa:</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {record.chief_complaint}
                  </p>
                </div>
              )}

              {/* Expanded Details */}
              {expandedId === record.id && (
                <div className="pt-2 border-t space-y-2">
                  {record.diagnostic_hypothesis && (
                    <div>
                      <p className="text-xs font-semibold">Hipótese Diagnóstica:</p>
                      <p className="text-xs text-muted-foreground">
                        {record.diagnostic_hypothesis}
                      </p>
                    </div>
                  )}
                  {record.cid_codes && record.cid_codes.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold">CID:</p>
                      <ul className="text-xs text-muted-foreground list-disc list-inside">
                        {record.cid_codes.map((cid: string, idx: number) => (
                          <li key={idx}>{cid}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {record.secondary_diagnoses && record.secondary_diagnoses.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold">Diagnósticos Secundários:</p>
                      <ul className="text-xs text-muted-foreground list-disc list-inside">
                        {record.secondary_diagnoses.map((dx: string, idx: number) => (
                          <li key={idx}>{dx}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
