import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  FileText,
  Stethoscope,
  Activity,
  ClipboardList,
  Pill,
  Save,
  CheckCircle,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import {
  CreateMedicalRecordInput,
  VitalSigns,
  MedicationPrescription,
  calculateBMI,
  COMMON_CID_CODES,
  RECORD_TYPES,
} from "@/types/medicalRecords";

const formSchema = z.object({
  // Anamnese
  chief_complaint: z.string().optional(),
  history_current_illness: z.string().optional(),
  past_medical_history: z.string().optional(),
  family_history: z.string().optional(),
  social_history: z.string().optional(),

  // Exame Físico
  general_condition: z.string().optional(),
  physical_exam_notes: z.string().optional(),

  // Sinais Vitais
  bp_systolic: z.string().optional(),
  bp_diastolic: z.string().optional(),
  heart_rate: z.string().optional(),
  respiratory_rate: z.string().optional(),
  temperature: z.string().optional(),
  spo2: z.string().optional(),
  weight: z.string().optional(),
  height: z.string().optional(),

  // Diagnóstico
  diagnostic_hypothesis: z.string().optional(),

  // Conduta
  treatment_plan: z.string().optional(),
  patient_instructions: z.string().optional(),
  follow_up_notes: z.string().optional(),

  // Tipo de registro
  record_type: z.enum(['consultation', 'return', 'procedure', 'exam', 'emergency']).default('consultation'),
});

type FormData = z.infer<typeof formSchema>;

interface SinglePageRecordFormProps {
  patientId: string;
  appointmentId?: string;
  onSave: (data: CreateMedicalRecordInput, status: 'draft' | 'completed') => Promise<void>;
  isSaving?: boolean;
  initialData?: Partial<CreateMedicalRecordInput>;
}

export function SinglePageRecordForm({
  patientId,
  appointmentId,
  onSave,
  isSaving,
  initialData,
}: SinglePageRecordFormProps) {
  const [selectedCids, setSelectedCids] = useState<string[]>(initialData?.cid_codes || []);
  const [cidSearch, setCidSearch] = useState("");
  const [prescriptions, setPrescriptions] = useState<MedicationPrescription[]>(
    initialData?.prescriptions || []
  );
  const [nextAppointmentDate, setNextAppointmentDate] = useState<Date | undefined>(
    initialData?.next_appointment_date ? new Date(initialData.next_appointment_date) : undefined
  );
  const [openSections, setOpenSections] = useState<string[]>(["anamnese"]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      chief_complaint: initialData?.chief_complaint || "",
      history_current_illness: initialData?.history_current_illness || "",
      past_medical_history: initialData?.past_medical_history || "",
      family_history: initialData?.family_history || "",
      social_history: initialData?.social_history || "",
      general_condition: initialData?.general_condition || "",
      physical_exam_notes: initialData?.physical_exam_notes || "",
      bp_systolic: initialData?.vital_signs?.bp_systolic?.toString() || "",
      bp_diastolic: initialData?.vital_signs?.bp_diastolic?.toString() || "",
      heart_rate: initialData?.vital_signs?.heart_rate?.toString() || "",
      respiratory_rate: initialData?.vital_signs?.respiratory_rate?.toString() || "",
      temperature: initialData?.vital_signs?.temperature?.toString() || "",
      spo2: initialData?.vital_signs?.spo2?.toString() || "",
      weight: initialData?.vital_signs?.weight?.toString() || "",
      height: initialData?.vital_signs?.height?.toString() || "",
      diagnostic_hypothesis: initialData?.diagnostic_hypothesis || "",
      treatment_plan: initialData?.treatment_plan || "",
      patient_instructions: initialData?.patient_instructions || "",
      follow_up_notes: initialData?.follow_up_notes || "",
      record_type: initialData?.record_type || "consultation",
    },
  });

  const weight = form.watch("weight");
  const height = form.watch("height");
  const bmi = calculateBMI(
    weight ? parseFloat(weight) : undefined,
    height ? parseFloat(height) : undefined
  );

  const filteredCids = COMMON_CID_CODES.filter(
    (cid) =>
      !selectedCids.includes(cid.code) &&
      (cid.code.toLowerCase().includes(cidSearch.toLowerCase()) ||
        cid.description.toLowerCase().includes(cidSearch.toLowerCase()))
  );

  const buildRecordInput = (data: FormData): CreateMedicalRecordInput => {
    const vitalSigns: VitalSigns = {};
    if (data.bp_systolic) vitalSigns.bp_systolic = parseFloat(data.bp_systolic);
    if (data.bp_diastolic) vitalSigns.bp_diastolic = parseFloat(data.bp_diastolic);
    if (data.heart_rate) vitalSigns.heart_rate = parseFloat(data.heart_rate);
    if (data.respiratory_rate) vitalSigns.respiratory_rate = parseFloat(data.respiratory_rate);
    if (data.temperature) vitalSigns.temperature = parseFloat(data.temperature);
    if (data.spo2) vitalSigns.spo2 = parseFloat(data.spo2);
    if (data.weight) vitalSigns.weight = parseFloat(data.weight);
    if (data.height) vitalSigns.height = parseFloat(data.height);
    if (bmi) vitalSigns.bmi = bmi;

    return {
      contact_id: patientId,
      appointment_id: appointmentId,
      chief_complaint: data.chief_complaint || undefined,
      history_current_illness: data.history_current_illness || undefined,
      past_medical_history: data.past_medical_history || undefined,
      family_history: data.family_history || undefined,
      social_history: data.social_history || undefined,
      general_condition: data.general_condition || undefined,
      physical_exam_notes: data.physical_exam_notes || undefined,
      vital_signs: Object.keys(vitalSigns).length > 0 ? vitalSigns : undefined,
      diagnostic_hypothesis: data.diagnostic_hypothesis || undefined,
      cid_codes: selectedCids.length > 0 ? selectedCids : undefined,
      treatment_plan: data.treatment_plan || undefined,
      patient_instructions: data.patient_instructions || undefined,
      follow_up_notes: data.follow_up_notes || undefined,
      next_appointment_date: nextAppointmentDate?.toISOString(),
      prescriptions: prescriptions.length > 0 ? prescriptions : undefined,
      record_type: data.record_type,
    };
  };

  const handleSaveDraft = async () => {
    const data = form.getValues();
    await onSave(buildRecordInput(data), 'draft');
  };

  const handleFinalize = async () => {
    const data = form.getValues();
    await onSave(buildRecordInput(data), 'completed');
  };

  const addPrescription = () => {
    setPrescriptions([
      ...prescriptions,
      { medication: "", dosage: "", frequency: "", duration: "" },
    ]);
  };

  const removePrescription = (index: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const updatePrescription = (
    index: number,
    field: keyof MedicationPrescription,
    value: string
  ) => {
    const updated = [...prescriptions];
    updated[index] = { ...updated[index], [field]: value };
    setPrescriptions(updated);
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Tipo de Atendimento */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <Label className="text-sm font-medium">Tipo de Atendimento:</Label>
          <Select
            value={form.watch("record_type")}
            onValueChange={(value) => form.setValue("record_type", value as any)}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RECORD_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Accordion
        type="multiple"
        value={openSections}
        onValueChange={setOpenSections}
        className="space-y-2"
      >
        {/* ANAMNESE */}
        <AccordionItem value="anamnese" className="border rounded-lg bg-card">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <span className="font-semibold">Anamnese</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="chief_complaint">Queixa Principal</Label>
                <Textarea
                  id="chief_complaint"
                  placeholder="Motivo principal da consulta..."
                  className="mt-1.5 min-h-[80px]"
                  {...form.register("chief_complaint")}
                />
              </div>
              <div>
                <Label htmlFor="history_current_illness">História da Doença Atual (HDA)</Label>
                <Textarea
                  id="history_current_illness"
                  placeholder="Descreva a evolução dos sintomas..."
                  className="mt-1.5 min-h-[100px]"
                  {...form.register("history_current_illness")}
                />
              </div>
              <div>
                <Label htmlFor="past_medical_history">Antecedentes Pessoais</Label>
                <Textarea
                  id="past_medical_history"
                  placeholder="Doenças prévias, cirurgias, internações..."
                  className="mt-1.5 min-h-[80px]"
                  {...form.register("past_medical_history")}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="family_history">Antecedentes Familiares</Label>
                  <Textarea
                    id="family_history"
                    placeholder="Histórico familiar relevante..."
                    className="mt-1.5 min-h-[60px]"
                    {...form.register("family_history")}
                  />
                </div>
                <div>
                  <Label htmlFor="social_history">Hábitos de Vida</Label>
                  <Textarea
                    id="social_history"
                    placeholder="Tabagismo, etilismo, atividade física..."
                    className="mt-1.5 min-h-[60px]"
                    {...form.register("social_history")}
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* EXAME FÍSICO */}
        <AccordionItem value="exame-fisico" className="border rounded-lg bg-card">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-green-500" />
              <span className="font-semibold">Exame Físico</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="general_condition">Estado Geral</Label>
                <Select
                  value={form.watch("general_condition") || ""}
                  onValueChange={(value) => form.setValue("general_condition", value)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bom">Bom estado geral (BEG)</SelectItem>
                    <SelectItem value="regular">Regular estado geral (REG)</SelectItem>
                    <SelectItem value="ruim">Mau estado geral (MEG)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="physical_exam_notes">Exame Físico Detalhado</Label>
                <Textarea
                  id="physical_exam_notes"
                  placeholder="Descreva os achados do exame físico..."
                  className="mt-1.5 min-h-[120px]"
                  {...form.register("physical_exam_notes")}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* SINAIS VITAIS */}
        <AccordionItem value="sinais-vitais" className="border rounded-lg bg-card">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-red-500" />
              <span className="font-semibold">Sinais Vitais</span>
              {bmi && (
                <Badge variant="outline" className="ml-2">
                  IMC: {bmi}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label>PA Sistólica (mmHg)</Label>
                <Input
                  type="number"
                  placeholder="120"
                  className="mt-1.5"
                  {...form.register("bp_systolic")}
                />
              </div>
              <div>
                <Label>PA Diastólica (mmHg)</Label>
                <Input
                  type="number"
                  placeholder="80"
                  className="mt-1.5"
                  {...form.register("bp_diastolic")}
                />
              </div>
              <div>
                <Label>FC (bpm)</Label>
                <Input
                  type="number"
                  placeholder="72"
                  className="mt-1.5"
                  {...form.register("heart_rate")}
                />
              </div>
              <div>
                <Label>FR (irpm)</Label>
                <Input
                  type="number"
                  placeholder="16"
                  className="mt-1.5"
                  {...form.register("respiratory_rate")}
                />
              </div>
              <div>
                <Label>Temperatura (°C)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="36.5"
                  className="mt-1.5"
                  {...form.register("temperature")}
                />
              </div>
              <div>
                <Label>SpO2 (%)</Label>
                <Input
                  type="number"
                  placeholder="98"
                  className="mt-1.5"
                  {...form.register("spo2")}
                />
              </div>
              <div>
                <Label>Peso (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="70"
                  className="mt-1.5"
                  {...form.register("weight")}
                />
              </div>
              <div>
                <Label>Altura (cm)</Label>
                <Input
                  type="number"
                  placeholder="170"
                  className="mt-1.5"
                  {...form.register("height")}
                />
              </div>
            </div>
            {bmi && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">IMC Calculado:</span> {bmi} kg/m² -{" "}
                  {bmi < 18.5
                    ? "Abaixo do peso"
                    : bmi < 25
                    ? "Peso normal"
                    : bmi < 30
                    ? "Sobrepeso"
                    : "Obesidade"}
                </p>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* DIAGNÓSTICO */}
        <AccordionItem value="diagnostico" className="border rounded-lg bg-card">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-purple-500" />
              <span className="font-semibold">Diagnóstico</span>
              {selectedCids.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedCids.length} CID(s)
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="diagnostic_hypothesis">Hipótese Diagnóstica</Label>
                <Textarea
                  id="diagnostic_hypothesis"
                  placeholder="Descreva o diagnóstico..."
                  className="mt-1.5 min-h-[80px]"
                  {...form.register("diagnostic_hypothesis")}
                />
              </div>
              <div>
                <Label>Códigos CID-10</Label>
                <div className="mt-1.5 space-y-2">
                  {selectedCids.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedCids.map((code) => {
                        const cid = COMMON_CID_CODES.find((c) => c.code === code);
                        return (
                          <Badge key={code} variant="secondary" className="gap-1">
                            {code} - {cid?.description || ""}
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedCids(selectedCids.filter((c) => c !== code))
                              }
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                  <Input
                    placeholder="Buscar CID..."
                    value={cidSearch}
                    onChange={(e) => setCidSearch(e.target.value)}
                  />
                  {cidSearch && filteredCids.length > 0 && (
                    <div className="border rounded-lg max-h-40 overflow-y-auto">
                      {filteredCids.slice(0, 5).map((cid) => (
                        <button
                          key={cid.code}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                          onClick={() => {
                            setSelectedCids([...selectedCids, cid.code]);
                            setCidSearch("");
                          }}
                        >
                          <span className="font-medium">{cid.code}</span> - {cid.description}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* CONDUTA */}
        <AccordionItem value="conduta" className="border rounded-lg bg-card">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-orange-500" />
              <span className="font-semibold">Conduta / Tratamento</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="treatment_plan">Plano de Tratamento</Label>
                <Textarea
                  id="treatment_plan"
                  placeholder="Descreva o plano terapêutico..."
                  className="mt-1.5 min-h-[100px]"
                  {...form.register("treatment_plan")}
                />
              </div>
              <div>
                <Label htmlFor="patient_instructions">Orientações ao Paciente</Label>
                <Textarea
                  id="patient_instructions"
                  placeholder="Instruções para o paciente seguir em casa..."
                  className="mt-1.5 min-h-[80px]"
                  {...form.register("patient_instructions")}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="follow_up_notes">Observações de Acompanhamento</Label>
                  <Textarea
                    id="follow_up_notes"
                    placeholder="Notas para acompanhamento..."
                    className="mt-1.5 min-h-[60px]"
                    {...form.register("follow_up_notes")}
                  />
                </div>
                <div>
                  <Label>Data do Próximo Retorno</Label>
                  <div className="mt-1.5">
                    <DatePicker
                      date={nextAppointmentDate}
                      setDate={setNextAppointmentDate}
                    />
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* PRESCRIÇÕES */}
        <AccordionItem value="prescricoes" className="border rounded-lg bg-card">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-cyan-500" />
              <span className="font-semibold">Prescrições</span>
              {prescriptions.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {prescriptions.length} medicamento(s)
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              {prescriptions.map((prescription, index) => (
                <div key={index} className="p-4 border rounded-lg bg-muted/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Medicamento {index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePrescription(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Medicamento</Label>
                      <Input
                        placeholder="Nome do medicamento"
                        value={prescription.medication}
                        onChange={(e) =>
                          updatePrescription(index, "medication", e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Dosagem</Label>
                      <Input
                        placeholder="Ex: 500mg"
                        value={prescription.dosage}
                        onChange={(e) =>
                          updatePrescription(index, "dosage", e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Posologia</Label>
                      <Input
                        placeholder="Ex: 8/8h"
                        value={prescription.frequency}
                        onChange={(e) =>
                          updatePrescription(index, "frequency", e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Duração</Label>
                      <Input
                        placeholder="Ex: 7 dias"
                        value={prescription.duration}
                        onChange={(e) =>
                          updatePrescription(index, "duration", e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Instruções adicionais</Label>
                    <Input
                      placeholder="Ex: Tomar após as refeições"
                      value={prescription.instructions || ""}
                      onChange={(e) =>
                        updatePrescription(index, "instructions", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addPrescription}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Medicamento
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Barra de ações fixa */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 flex justify-end gap-3 z-50">
        <div className="max-w-4xl mx-auto w-full flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar Rascunho
          </Button>
          <Button type="button" onClick={handleFinalize} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            Finalizar Atendimento
          </Button>
        </div>
      </div>
    </div>
  );
}
