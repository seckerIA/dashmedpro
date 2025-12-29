import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useMedicalRecords } from '@/hooks/useMedicalRecords';
import { MedicalRecord, RECORD_TYPES } from '@/types/medicalRecords';
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Calendar,
  Stethoscope,
  Pill,
  TestTube,
  Clock
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MedicalHistoryTabProps {
  contactId: string;
}

export function MedicalHistoryTab({ contactId }: MedicalHistoryTabProps) {
  const { records, isLoading, error } = useMedicalRecords(contactId);
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set());

  const toggleExpand = (recordId: string) => {
    const newExpanded = new Set(expandedRecords);
    if (newExpanded.has(recordId)) {
      newExpanded.delete(recordId);
    } else {
      newExpanded.add(recordId);
    }
    setExpandedRecords(newExpanded);
  };

  const getRecordTypeInfo = (type: string) => {
    const typeInfo = RECORD_TYPES.find(t => t.value === type);
    return typeInfo || { label: type, description: '' };
  };

  const getRecordTypeColor = (type: string) => {
    switch (type) {
      case 'consultation':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'return':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'procedure':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'exam':
        return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      case 'emergency':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center text-muted-foreground">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          Carregando histórico...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        Erro ao carregar histórico: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Histórico de Atendimentos</h3>
        <p className="text-sm text-muted-foreground">
          {records?.length || 0} registro(s) encontrado(s)
        </p>
      </div>

      {/* Lista de prontuários */}
      {records && records.length > 0 ? (
        <div className="space-y-3">
          {records.map((record) => (
            <RecordCard
              key={record.id}
              record={record}
              isExpanded={expandedRecords.has(record.id)}
              onToggle={() => toggleExpand(record.id)}
              getTypeColor={getRecordTypeColor}
              getTypeInfo={getRecordTypeInfo}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h4 className="font-medium text-lg mb-2">Nenhum atendimento registrado</h4>
            <p className="text-muted-foreground text-sm">
              Registre o primeiro atendimento na aba "Ficha"
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Componente de Card individual do prontuário
interface RecordCardProps {
  record: MedicalRecord;
  isExpanded: boolean;
  onToggle: () => void;
  getTypeColor: (type: string) => string;
  getTypeInfo: (type: string) => { label: string; description: string };
}

function RecordCard({ record, isExpanded, onToggle, getTypeColor, getTypeInfo }: RecordCardProps) {
  const typeInfo = getTypeInfo(record.record_type);

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <Card className={`transition-shadow ${isExpanded ? 'shadow-md' : 'hover:shadow-sm'}`}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                {/* Data */}
                <div className="flex flex-col items-center justify-center min-w-[60px] p-2 rounded-md bg-primary/10">
                  <span className="text-xs font-medium text-primary">
                    {format(parseISO(record.created_at), 'dd MMM', { locale: ptBR })}
                  </span>
                  <span className="text-lg font-bold text-foreground">
                    {format(parseISO(record.created_at), 'yyyy', { locale: ptBR })}
                  </span>
                </div>

                {/* Info principal */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className={getTypeColor(record.record_type)}>
                      {typeInfo.label}
                    </Badge>
                    {record.cid_codes && record.cid_codes.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        CID: {record.cid_codes[0]}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-base">
                    {record.diagnostic_hypothesis || record.chief_complaint || 'Atendimento registrado'}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(parseISO(record.created_at), "HH:mm", { locale: ptBR })}
                    </span>
                    {record.doctor && (
                      <span className="flex items-center gap-1">
                        <Stethoscope className="h-3 w-3" />
                        Dr(a). {record.doctor.full_name}
                      </span>
                    )}
                  </CardDescription>
                </div>
              </div>

              {/* Indicadores e botão expand */}
              <div className="flex items-center gap-3">
                {record.prescriptions && record.prescriptions.length > 0 && (
                  <Badge variant="outline" className="gap-1">
                    <Pill className="h-3 w-3" />
                    {record.prescriptions.length}
                  </Badge>
                )}
                {record.exams_requested && record.exams_requested.length > 0 && (
                  <Badge variant="outline" className="gap-1">
                    <TestTube className="h-3 w-3" />
                    {record.exams_requested.length}
                  </Badge>
                )}
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Queixa Principal */}
            {record.chief_complaint && (
              <div className="space-y-1">
                <h5 className="text-sm font-medium text-muted-foreground">Queixa Principal</h5>
                <p className="text-sm">{record.chief_complaint}</p>
              </div>
            )}

            {/* HDA */}
            {record.history_current_illness && (
              <div className="space-y-1">
                <h5 className="text-sm font-medium text-muted-foreground">História da Doença Atual</h5>
                <p className="text-sm">{record.history_current_illness}</p>
              </div>
            )}

            {/* Sinais Vitais */}
            {record.vital_signs && Object.keys(record.vital_signs).length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-muted-foreground">Sinais Vitais</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {record.vital_signs.bp_systolic && record.vital_signs.bp_diastolic && (
                    <div className="p-2 rounded bg-muted/50">
                      <span className="text-xs text-muted-foreground">PA</span>
                      <p className="font-medium">
                        {record.vital_signs.bp_systolic}/{record.vital_signs.bp_diastolic} mmHg
                      </p>
                    </div>
                  )}
                  {record.vital_signs.heart_rate && (
                    <div className="p-2 rounded bg-muted/50">
                      <span className="text-xs text-muted-foreground">FC</span>
                      <p className="font-medium">{record.vital_signs.heart_rate} bpm</p>
                    </div>
                  )}
                  {record.vital_signs.temperature && (
                    <div className="p-2 rounded bg-muted/50">
                      <span className="text-xs text-muted-foreground">Temp</span>
                      <p className="font-medium">{record.vital_signs.temperature} °C</p>
                    </div>
                  )}
                  {record.vital_signs.spo2 && (
                    <div className="p-2 rounded bg-muted/50">
                      <span className="text-xs text-muted-foreground">SpO2</span>
                      <p className="font-medium">{record.vital_signs.spo2}%</p>
                    </div>
                  )}
                  {record.vital_signs.weight && (
                    <div className="p-2 rounded bg-muted/50">
                      <span className="text-xs text-muted-foreground">Peso</span>
                      <p className="font-medium">{record.vital_signs.weight} kg</p>
                    </div>
                  )}
                  {record.vital_signs.height && (
                    <div className="p-2 rounded bg-muted/50">
                      <span className="text-xs text-muted-foreground">Altura</span>
                      <p className="font-medium">{record.vital_signs.height} cm</p>
                    </div>
                  )}
                  {record.vital_signs.bmi && (
                    <div className="p-2 rounded bg-muted/50">
                      <span className="text-xs text-muted-foreground">IMC</span>
                      <p className="font-medium">{record.vital_signs.bmi}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Exame Físico */}
            {record.physical_exam_notes && (
              <div className="space-y-1">
                <h5 className="text-sm font-medium text-muted-foreground">Exame Físico</h5>
                <p className="text-sm whitespace-pre-line">{record.physical_exam_notes}</p>
              </div>
            )}

            {/* Diagnóstico */}
            {record.diagnostic_hypothesis && (
              <div className="space-y-1">
                <h5 className="text-sm font-medium text-muted-foreground">Diagnóstico</h5>
                <p className="text-sm">{record.diagnostic_hypothesis}</p>
                {record.cid_codes && record.cid_codes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {record.cid_codes.map((cid, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {cid}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Conduta */}
            {record.treatment_plan && (
              <div className="space-y-1">
                <h5 className="text-sm font-medium text-muted-foreground">Conduta / Tratamento</h5>
                <p className="text-sm whitespace-pre-line">{record.treatment_plan}</p>
              </div>
            )}

            {/* Complicações */}
            {record.complications && (
              <div className="space-y-1 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                <h5 className="text-sm font-medium text-red-700 dark:text-red-400">Complicações / Intercorrências</h5>
                <p className="text-sm whitespace-pre-line">{record.complications}</p>
              </div>
            )}

            {/* Prescrições */}
            {record.prescriptions && record.prescriptions.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Pill className="h-4 w-4" />
                  Prescrições ({record.prescriptions.length})
                </h5>
                <div className="space-y-2">
                  {record.prescriptions.map((med, i) => (
                    <div key={i} className="p-2 rounded bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                      <p className="font-medium text-sm">{med.medication}</p>
                      <p className="text-xs text-muted-foreground">
                        {med.dosage} - {med.frequency} por {med.duration}
                      </p>
                      {med.instructions && (
                        <p className="text-xs text-muted-foreground mt-1">{med.instructions}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exames Solicitados */}
            {record.exams_requested && record.exams_requested.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TestTube className="h-4 w-4" />
                  Exames Solicitados ({record.exams_requested.length})
                </h5>
                <div className="flex flex-wrap gap-2">
                  {record.exams_requested.map((exam, i) => (
                    <Badge key={i} variant="outline">
                      {exam.exam_name}
                      {exam.urgency === 'urgent' && (
                        <span className="ml-1 text-red-500">⚡</span>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Orientações */}
            {record.patient_instructions && (
              <div className="space-y-1">
                <h5 className="text-sm font-medium text-muted-foreground">Orientações ao Paciente</h5>
                <p className="text-sm whitespace-pre-line">{record.patient_instructions}</p>
              </div>
            )}

            {/* Retorno */}
            {record.next_appointment_date && (
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-600" />
                  Retorno agendado para:{' '}
                  {format(parseISO(record.next_appointment_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
