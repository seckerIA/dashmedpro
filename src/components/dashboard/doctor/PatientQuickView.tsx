import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, History, User, Activity, Calendar, Pill } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { usePatientMedicalHistory } from "@/hooks/useMedicalRecords";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

interface PatientQuickViewProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    patientId?: string;
    patientName?: string;
}

export function PatientQuickView({ open, onOpenChange, patientId, patientName }: PatientQuickViewProps) {
    const navigate = useNavigate();
    const { data: history, isLoading } = usePatientMedicalHistory(open && patientId ? patientId : null);

    const handleViewProfile = () => {
        if (patientId) {
            onOpenChange(false);
            navigate(`/comercial?tab=leads`);
        }
    };

    const handleStartConsultation = () => {
        if (patientId) {
            onOpenChange(false);
            navigate(`/prontuarios?patientId=${patientId}&openNewRecord=true`);
        }
    };

    const latestRecord = history?.records?.[0];
    const latestExam = latestRecord?.physical_exam_notes; // Fallback if no structured vital signs yet
    const vitalSigns = latestRecord?.vital_signs;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col gap-0 p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2 space-y-4">
                    <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16 border-2 border-primary/10">
                            <AvatarImage />
                            <AvatarFallback className="text-xl bg-primary/10 text-primary">
                                {patientName?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                            <DialogTitle className="text-xl">{patientName}</DialogTitle>
                            <DialogDescription className="flex items-center gap-2">
                                {/* Mock demographics for now, as usePatientMedicalHistory focuses on clinical data */}
                                <span>Paciente</span>
                                <span>•</span>
                                {history?.appointments?.[0] && (
                                    <span className="text-green-500">
                                        Última visita: {format(new Date(history.appointments[0].start_time), "dd/MM/yyyy")}
                                    </span>
                                )}
                            </DialogDescription>
                            <div className="flex gap-2 mt-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs"
                                    onClick={handleViewProfile}
                                    disabled={!patientId}
                                >
                                    <User className="w-3 h-3 mr-1.5" /> Perfil Completo
                                </Button>
                                <Button
                                    size="sm"
                                    className="h-7 text-xs bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
                                    onClick={handleStartConsultation}
                                    disabled={!patientId}
                                >
                                    Iniciar Atendimento
                                </Button>
                            </div>
                        </div>
                    </div>

                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0 px-2 gap-6">
                            <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-0 py-2">
                                Visão Geral
                            </TabsTrigger>
                            <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-0 py-2">
                                Histórico ({history?.totalRecords || 0})
                            </TabsTrigger>
                            <TabsTrigger value="prescriptions" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-0 py-2">
                                Prescrições ({history?.totalPrescriptions || 0})
                            </TabsTrigger>
                        </TabsList>

                        <div className="p-1 pt-4 h-full bg-background">
                            {isLoading ? (
                                <div className="p-4 space-y-4">
                                    <Skeleton className="h-20 w-full" />
                                    <Skeleton className="h-20 w-full" />
                                </div>
                            ) : (
                                <>
                                    <TabsContent value="overview" className="m-0 h-full">
                                        <ScrollArea className="h-[400px] pr-4">
                                            <div className="space-y-6">
                                                <div>
                                                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                                        <Activity className="w-4 h-4 text-primary" />
                                                        Últimos Sinais Vitais
                                                    </h4>
                                                    {vitalSigns ? (
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                            <div className="bg-muted/50 p-3 rounded-lg border border-border/50 text-center">
                                                                <span className="text-xs text-muted-foreground block">PA</span>
                                                                <span className="font-semibold text-foreground">{vitalSigns.bp_systolic && vitalSigns.bp_diastolic ? `${vitalSigns.bp_systolic}/${vitalSigns.bp_diastolic}` : '-'}</span>
                                                            </div>
                                                            <div className="bg-muted/50 p-3 rounded-lg border border-border/50 text-center">
                                                                <span className="text-xs text-muted-foreground block">FC</span>
                                                                <span className="font-semibold text-foreground">{vitalSigns.heart_rate || '-'} bpm</span>
                                                            </div>
                                                            <div className="bg-muted/50 p-3 rounded-lg border border-border/50 text-center">
                                                                <span className="text-xs text-muted-foreground block">Temp</span>
                                                                <span className="font-semibold text-foreground">{vitalSigns.temperature || '-'}°C</span>
                                                            </div>
                                                            <div className="bg-muted/50 p-3 rounded-lg border border-border/50 text-center">
                                                                <span className="text-xs text-muted-foreground block">Peso</span>
                                                                <span className="font-semibold text-foreground">{vitalSigns.weight || '-'}kg</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground italic pl-6">Nenhum sinal vital registrado recentemente.</p>
                                                    )}
                                                </div>

                                                <Separator />

                                                <div>
                                                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                                        <History className="w-4 h-4 text-primary" />
                                                        Última Anotação Clínica
                                                    </h4>
                                                    <div className="text-sm text-muted-foreground space-y-2 pl-6 border-l-2 border-muted">
                                                        {latestRecord ? (
                                                            <>
                                                                <p className="font-medium text-foreground mb-1">
                                                                    {format(new Date(latestRecord.created_at), "dd 'de' MMM, yyyy")}
                                                                </p>
                                                                <p>{latestRecord.history_current_illness || latestRecord.chief_complaint || "Sem detalhes registrados."}</p>
                                                            </>
                                                        ) : (
                                                            <p>Nenhum prontuário anterior encontrado.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </ScrollArea>
                                    </TabsContent>

                                    <TabsContent value="history" className="m-0">
                                        <ScrollArea className="h-[400px] pr-4">
                                            <div className="space-y-4">
                                                {history?.records?.map((rec) => (
                                                    <div key={rec.id} className="p-4 rounded-lg border bg-card">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="font-semibold text-sm">Consulta</span>
                                                            <span className="text-xs text-muted-foreground">{format(new Date(rec.created_at), "dd/MM/yyyy")}</span>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                                            {rec.chief_complaint || rec.history_current_illness || "Sem queixa principal registrada."}
                                                        </p>
                                                    </div>
                                                ))}
                                                {(!history?.records || history.records.length === 0) && (
                                                    <p className="text-center text-muted-foreground py-8">Nenhum histórico disponível.</p>
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </TabsContent>

                                    <TabsContent value="prescriptions" className="m-0">
                                        <ScrollArea className="h-[400px] pr-4">
                                            <div className="space-y-3">
                                                {history?.prescriptions?.map((pres) => (
                                                    <div key={pres.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                                                        <div className="bg-blue-500/10 p-2 rounded-full text-blue-600">
                                                            <Pill className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium">Receita {format(new Date(pres.created_at), "dd/MM/yyyy")}</p>
                                                            <p className="text-xs text-muted-foreground">{pres.medications?.length || 0} medicamentos</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!history?.prescriptions || history.prescriptions.length === 0) && (
                                                    <p className="text-center text-muted-foreground py-8">Nenhuma prescrição encontrada.</p>
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </TabsContent>
                                </>
                            )}
                        </div>
                    </Tabs>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    );
}
