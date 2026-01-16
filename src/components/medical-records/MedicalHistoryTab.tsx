import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { useMedicalRecords } from '@/hooks/useMedicalRecords';
import { MedicalRecord, RECORD_TYPES } from '@/types/medicalRecords';
import {
  FileText,
  Calendar,
  Stethoscope,
  Pill,
  TestTube,
  Clock,
  ArrowRight
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MedicalHistoryTabProps {
  contactId: string;
}

export function MedicalHistoryTab({ contactId }: MedicalHistoryTabProps) {
  const { records, isLoading, error } = useMedicalRecords(contactId);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);

  const getRecordTypeInfo = (type: string) => {
    const typeInfo = RECORD_TYPES.find(t => t.value === type);
    return typeInfo || { label: type, description: '' };
  };

  const getRecordTypeColor = (type: string) => {
    switch (type) {
      case 'consultation':
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800';
      case 'return':
        return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800';
      case 'procedure':
        return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800';
      case 'exam':
        return 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-900/40 dark:text-cyan-300 dark:border-cyan-800';
      case 'emergency':
        return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
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
              onClick={() => setSelectedRecord(record)}
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

      {/* Sheet de Detalhes */}
      <Sheet open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        <SheetContent className="sm:max-w-2xl w-full flex flex-col h-full p-0">
          {selectedRecord && (
            <>
              <SheetHeader className="px-6 py-4 border-b">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getRecordTypeColor(selectedRecord.record_type)}>
                    {getRecordTypeInfo(selectedRecord.record_type).label}
                  </Badge>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(parseISO(selectedRecord.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </div>
                <SheetTitle>Detalhes do Atendimento</SheetTitle>
                <SheetDescription>
                  {selectedRecord.doctor ? `Realizado por Dr(a). ${selectedRecord.doctor.full_name}` : 'Médico não identificado'}
                  {' • '}
                  {format(parseISO(selectedRecord.created_at), "HH:mm", { locale: ptBR })}
                </SheetDescription>
              </SheetHeader>

              <ScrollArea className="flex-1 px-6">
                <div className="py-6 space-y-6">
                  {/* Conteúdo Detalhado (Migrado do Collapsible anterior) */}

                  {/* Queixa Principal */}
                  {selectedRecord.chief_complaint && (
                    <div className="space-y-1 bg-muted/30 p-3 rounded-md">
                      <h5 className="text-sm font-semibold text-primary mb-1">Queixa Principal</h5>
                      <p className="text-sm leading-relaxed">{selectedRecord.chief_complaint}</p>
                    </div>
                  )}

                  {/* HDA */}
                  {selectedRecord.history_current_illness && (
                    <div className="space-y-1">
                      <h5 className="text-sm font-medium text-muted-foreground">História da Doença Atual (HDA)</h5>
                      <p className="text-sm whitespace-pre-line leading-relaxed">{selectedRecord.history_current_illness}</p>
                    </div>
                  )}

                  {/* Históricos */}
                  {(selectedRecord.past_medical_history || selectedRecord.family_history || selectedRecord.social_history) && (
                    <div className="grid grid-cols-1 gap-4">
                      {selectedRecord.past_medical_history && (
                        <div className="space-y-1">
                          <h5 className="text-sm font-medium text-muted-foreground">Histórico Patológico</h5>
                          <p className="text-sm text-muted-foreground/90">{selectedRecord.past_medical_history}</p>
                        </div>
                      )}
                      {selectedRecord.family_history && (
                        <div className="space-y-1">
                          <h5 className="text-sm font-medium text-muted-foreground">Histórico Familiar</h5>
                          <p className="text-sm text-muted-foreground/90">{selectedRecord.family_history}</p>
                        </div>
                      )}
                      {selectedRecord.social_history && (
                        <div className="space-y-1">
                          <h5 className="text-sm font-medium text-muted-foreground">Histórico Social</h5>
                          <p className="text-sm text-muted-foreground/90">{selectedRecord.social_history}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Alergias do Atendimento */}
                  {selectedRecord.allergies_noted && selectedRecord.allergies_noted.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-muted-foreground">Alergias Identificadas no Atendimento</h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedRecord.allergies_noted.map((allergy, i) => (
                          <Badge key={i} variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                            {allergy}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-dashed" />

                  {/* Sinais Vitais */}
                  {selectedRecord.vital_signs && Object.keys(selectedRecord.vital_signs).length > 0 && (
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-muted-foreground">Sinais Vitais</h5>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {selectedRecord.vital_signs.bp_systolic && selectedRecord.vital_signs.bp_diastolic && (
                          <div className="p-2 rounded bg-muted/40 border">
                            <span className="text-xs text-muted-foreground block mb-1">PA</span>
                            <p className="font-semibold text-sm">
                              {selectedRecord.vital_signs.bp_systolic}/{selectedRecord.vital_signs.bp_diastolic} <span className="text-xs font-normal text-muted-foreground">mmHg</span>
                            </p>
                          </div>
                        )}
                        {selectedRecord.vital_signs.heart_rate && (
                          <div className="p-2 rounded bg-muted/40 border">
                            <span className="text-xs text-muted-foreground block mb-1">FC</span>
                            <p className="font-semibold text-sm">{selectedRecord.vital_signs.heart_rate} <span className="text-xs font-normal text-muted-foreground">bpm</span></p>
                          </div>
                        )}
                        {selectedRecord.vital_signs.temperature && (
                          <div className="p-2 rounded bg-muted/40 border">
                            <span className="text-xs text-muted-foreground block mb-1">Temp</span>
                            <p className="font-semibold text-sm">{selectedRecord.vital_signs.temperature} <span className="text-xs font-normal text-muted-foreground">°C</span></p>
                          </div>
                        )}
                        {selectedRecord.vital_signs.spo2 && (
                          <div className="p-2 rounded bg-muted/40 border">
                            <span className="text-xs text-muted-foreground block mb-1">SpO2</span>
                            <p className="font-semibold text-sm">{selectedRecord.vital_signs.spo2}<span className="text-xs font-normal text-muted-foreground">%</span></p>
                          </div>
                        )}
                        {selectedRecord.vital_signs.bmi && (
                          <div className="p-2 rounded bg-muted/40 border">
                            <span className="text-xs text-muted-foreground block mb-1">IMC</span>
                            <p className="font-semibold text-sm">{selectedRecord.vital_signs.bmi}</p>
                          </div>
                        )}
                        {selectedRecord.vital_signs.weight && (
                          <div className="p-2 rounded bg-muted/40 border">
                            <span className="text-xs text-muted-foreground block mb-1">Peso</span>
                            <p className="font-semibold text-sm">{selectedRecord.vital_signs.weight} <span className="text-xs font-normal text-muted-foreground">kg</span></p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Exame Físico */}
                  {(selectedRecord.general_condition || selectedRecord.physical_exam_notes) && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-muted-foreground">Exame Físico</h5>
                      <div className="bg-muted/10 rounded-md border p-3 space-y-3">
                        {selectedRecord.general_condition && (
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">Estado Geral</span>
                            <p className="text-sm">{selectedRecord.general_condition}</p>
                          </div>
                        )}
                        {selectedRecord.physical_exam_notes && (
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">Exame Segmentar</span>
                            <p className="text-sm whitespace-pre-line">{selectedRecord.physical_exam_notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-dashed" />

                  {/* Diagnóstico */}
                  {selectedRecord.diagnostic_hypothesis && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-muted-foreground">Hipótese Diagnóstica</h5>
                      <div className="bg-slate-50 dark:bg-slate-900 border p-3 rounded-md">
                        <p className="text-base font-medium">{selectedRecord.diagnostic_hypothesis}</p>

                        {(selectedRecord.cid_codes && selectedRecord.cid_codes.length > 0) || (selectedRecord.secondary_diagnoses && selectedRecord.secondary_diagnoses.length > 0) ? (
                          <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-dashed border-slate-200 dark:border-slate-800">
                            {selectedRecord.cid_codes?.map((cid, i) => (
                              <Badge key={`cid-${i}`} variant="default" className="text-xs bg-slate-700 hover:bg-slate-800">
                                {cid}
                              </Badge>
                            ))}
                            {selectedRecord.secondary_diagnoses?.map((diag, i) => (
                              <Badge key={`sec-${i}`} variant="outline" className="text-xs">
                                {diag}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}

                  {/* Conduta */}
                  {selectedRecord.treatment_plan && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-muted-foreground">Conduta / Plano Terapêutico</h5>
                      <div className="bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-md border border-blue-100 dark:border-blue-900">
                        <p className="text-sm whitespace-pre-line leading-relaxed">{selectedRecord.treatment_plan}</p>
                      </div>
                    </div>
                  )}

                  {/* Complicações */}
                  {selectedRecord.complications && (
                    <div className="space-y-1 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                      <h5 className="text-sm font-medium text-red-700 dark:text-red-400">Complicações / Intercorrências</h5>
                      <p className="text-sm whitespace-pre-line">{selectedRecord.complications}</p>
                    </div>
                  )}

                  {/* Prescrições e Exames */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Prescrições */}
                    {selectedRecord.prescriptions && selectedRecord.prescriptions.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Pill className="h-4 w-4 text-primary" />
                          Prescrições ({selectedRecord.prescriptions.length})
                        </h5>
                        <div className="space-y-2">
                          {selectedRecord.prescriptions.map((med, i) => (
                            <div key={i} className="p-2 rounded bg-background border text-sm">
                              <p className="font-semibold">{med.medication}</p>
                              <p className="text-xs text-muted-foreground">
                                {med.dosage} • {med.frequency} • {med.duration}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Exames */}
                    {selectedRecord.exams_requested && selectedRecord.exams_requested.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <TestTube className="h-4 w-4 text-primary" />
                          Exames ({selectedRecord.exams_requested.length})
                        </h5>
                        <div className="space-y-2">
                          {selectedRecord.exams_requested.map((exam, i) => (
                            <div key={i} className="p-2 rounded bg-background border flex justify-between items-center text-sm">
                              <span>{exam.exam_name}</span>
                              {exam.urgency === 'urgent' && <Badge variant="destructive" className="h-4 px-1 text-[10px]">Urgente</Badge>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Orientações */}
                  {selectedRecord.patient_instructions && (
                    <div className="space-y-1 pt-2">
                      <h5 className="text-sm font-medium text-muted-foreground">Orientações ao Paciente</h5>
                      <p className="text-sm whitespace-pre-line bg-orange-50/50 dark:bg-orange-950/10 p-3 rounded-md border border-orange-100 dark:border-orange-900/30">{selectedRecord.patient_instructions}</p>
                    </div>
                  )}

                  {/* Notas de Acompanhamento */}
                  {selectedRecord.follow_up_notes && (
                    <div className="space-y-1">
                      <h5 className="text-sm font-medium text-muted-foreground">Notas de Acompanhamento</h5>
                      <p className="text-sm whitespace-pre-line text-muted-foreground/90">{selectedRecord.follow_up_notes}</p>
                    </div>
                  )}

                  {/* Retorno */}
                  {selectedRecord.next_appointment_date && (
                    <div className="mt-4 p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-green-800 dark:text-green-300 font-semibold uppercase tracking-wide">Retorno Sugerido</p>
                        <p className="text-base font-medium flex items-center gap-2 mt-1">
                          {format(parseISO(selectedRecord.next_appointment_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                  )}

                  <div className="h-8"></div> {/* Spacer bottom */}
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Componente de Card resumido para a lista
interface RecordCardProps {
  record: MedicalRecord;
  onClick: () => void;
  getTypeColor: (type: string) => string;
  getTypeInfo: (type: string) => { label: string; description: string };
}

function RecordCard({ record, onClick, getTypeColor, getTypeInfo }: RecordCardProps) {
  const typeInfo = getTypeInfo(record.record_type);

  return (
    <Card
      className="hover:shadow-md transition-all cursor-pointer border-l-4"
      onClick={onClick}
      style={{ borderLeftColor: typeInfo.label === 'Retorno' ? '#22c55e' : typeInfo.label === 'Emergência' ? '#ef4444' : '#3b82f6' }}
    >
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Data bloco */}
            <div className="flex flex-col items-center justify-center min-w-[50px] p-1.5 rounded-md bg-muted/40 group-hover:bg-primary/10 transition-colors">
              <span className="text-[10px] font-bold uppercase text-muted-foreground group-hover:text-primary">
                {format(parseISO(record.created_at), 'MMM', { locale: ptBR })}
              </span>
              <span className="text-xl font-bold text-foreground">
                {format(parseISO(record.created_at), 'dd', { locale: ptBR })}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {format(parseISO(record.created_at), 'yyyy', { locale: ptBR })}
              </span>
            </div>

            {/* Info principal */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`font-normal ${getTypeColor(record.record_type)} bg-opacity-20 border-opacity-50`}>
                  {typeInfo.label}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(parseISO(record.created_at), "HH:mm", { locale: ptBR })}
                </span>
              </div>
              <h4 className="font-medium text-base truncate max-w-[300px] sm:max-w-[400px]">
                {record.diagnostic_hypothesis || record.chief_complaint || 'Atendimento registrado'}
              </h4>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {record.doctor ? `Dr(a). ${record.doctor.full_name}` : 'Médico não identificado'}
              </p>
            </div>
          </div>

          <ArrowRight className="h-5 w-5 text-muted-foreground/30" />
        </div>

        {/* Badges de resumo */}
        <div className="flex gap-2 mt-3 pl-[66px]">
          {record.cid_codes && record.cid_codes.length > 0 && (
            <Badge variant="secondary" className="text-xs h-5 px-1.5">CID: {record.cid_codes[0]}</Badge>
          )}
          {record.prescriptions && record.prescriptions.length > 0 && (
            <Badge variant="outline" className="text-xs h-5 px-1.5 bg-blue-50/50 text-blue-700 border-blue-200">
              <Pill className="h-3 w-3 mr-1" /> {record.prescriptions.length} Receita(s)
            </Badge>
          )}
          {record.exams_requested && record.exams_requested.length > 0 && (
            <Badge variant="outline" className="text-xs h-5 px-1.5 ">
              <TestTube className="h-3 w-3 mr-1" /> {record.exams_requested.length} Exame(s)
            </Badge>
          )}
        </div>
      </CardHeader>
    </Card>
  );
}
