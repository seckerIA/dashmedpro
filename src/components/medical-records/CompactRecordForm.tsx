import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Save, CheckCircle, Plus, X, Loader2 } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import {
  CreateMedicalRecordInput,
  VitalSigns,
  MedicationPrescription,
  RequestedExam,
  calculateBMI,
  COMMON_CID_CODES,
  RECORD_TYPES,
} from "@/types/medicalRecords";

const formSchema = z.object({
  chief_complaint: z.string().optional(),
  history_current_illness: z.string().optional(),
  past_medical_history: z.string().optional(),
  family_history: z.string().optional(),
  social_history: z.string().optional(),
  general_condition: z.string().optional(),
  physical_exam_notes: z.string().optional(),
  bp_systolic: z.string().optional(),
  bp_diastolic: z.string().optional(),
  heart_rate: z.string().optional(),
  respiratory_rate: z.string().optional(),
  temperature: z.string().optional(),
  spo2: z.string().optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
  diagnostic_hypothesis: z.string().optional(),
  imaging_exams: z.string().optional(),
  treatment_plan: z.string().optional(),
  patient_instructions: z.string().optional(),
  follow_up_notes: z.string().optional(),
  record_type: z.enum(['consultation', 'return', 'procedure', 'exam', 'emergency']).default('consultation'),
});

type FormData = z.infer<typeof formSchema>;

interface CompactRecordFormProps {
  patientId: string;
  appointmentId?: string;
  onSave: (data: CreateMedicalRecordInput, status: 'draft' | 'completed') => Promise<void>;
  isSaving?: boolean;
  initialData?: Partial<CreateMedicalRecordInput>;
}

export function CompactRecordForm({
  patientId,
  appointmentId,
  onSave,
  isSaving,
  initialData,
}: CompactRecordFormProps) {
  const [selectedCids, setSelectedCids] = useState<string[]>(initialData?.cid_codes || []);
  const [cidSearch, setCidSearch] = useState("");
  const [prescriptions, setPrescriptions] = useState<MedicationPrescription[]>(
    initialData?.prescriptions || []
  );
  const [nextAppointmentDate, setNextAppointmentDate] = useState<Date | undefined>(
    initialData?.next_appointment_date ? new Date(initialData.next_appointment_date) : undefined
  );

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
      imaging_exams: initialData?.exams_requested?.map(e => e.exam_name).join('\n') || "",
      treatment_plan: initialData?.treatment_plan || "",
      patient_instructions: initialData?.patient_instructions || "",
      follow_up_notes: initialData?.follow_up_notes || "",
      record_type: (initialData?.record_type as any) || "consultation",
    },
  });

  const weight = form.watch("weight");
  const height = form.watch("height");
  const bmi = weight && height ? calculateBMI(parseFloat(weight), parseFloat(height)) : null;

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

    const examsRequested: RequestedExam[] = [];
    if (data.imaging_exams?.trim()) {
      data.imaging_exams.split('\n').filter(Boolean).forEach(line => {
        examsRequested.push({ exam_name: line.trim(), category: 'imagem' });
      });
    }

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
      exams_requested: examsRequested.length > 0 ? examsRequested : undefined,
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

  const filteredCids = COMMON_CID_CODES.filter(
    (c) => !selectedCids.includes(c.code) &&
      (c.code.toLowerCase().includes(cidSearch.toLowerCase()) ||
        c.description.toLowerCase().includes(cidSearch.toLowerCase()))
  ).slice(0, 5);

  return (
    <div className="space-y-5 pb-28" style={{ paddingBottom: 'calc(7rem + var(--keyboard-height, 0px))' }}>
      {/* Row 1: Tipo + Queixa Principal */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase">Tipo</Label>
          <Select
            value={form.watch("record_type")}
            onValueChange={(v) => form.setValue("record_type", v as any)}
          >
            <SelectTrigger className="mt-1 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RECORD_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-3">
          <Label className="text-xs font-semibold text-muted-foreground uppercase">Queixa Principal</Label>
          <Textarea {...form.register("chief_complaint")} className="mt-1 min-h-[40px] resize-none" rows={1} placeholder="Motivo da consulta" />
        </div>
      </div>

      {/* Row 2: Sinais Vitais — compact grid */}
      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">Sinais Vitais</Label>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          <div>
            <Label className="text-[10px] text-muted-foreground">PA Sist</Label>
            <Input {...form.register("bp_systolic")} type="number" placeholder="120" className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">PA Diast</Label>
            <Input {...form.register("bp_diastolic")} type="number" placeholder="80" className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">FC</Label>
            <Input {...form.register("heart_rate")} type="number" placeholder="72" className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">FR</Label>
            <Input {...form.register("respiratory_rate")} type="number" placeholder="16" className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">Temp °C</Label>
            <Input {...form.register("temperature")} type="number" step="0.1" placeholder="36.5" className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">SpO2 %</Label>
            <Input {...form.register("spo2")} type="number" placeholder="98" className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">Peso kg</Label>
            <Input {...form.register("weight")} type="number" step="0.1" placeholder="70" className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">Alt cm</Label>
            <Input {...form.register("height")} type="number" placeholder="170" className="h-8 text-sm" />
          </div>
        </div>
        {bmi && (
          <p className="text-xs text-muted-foreground mt-1">
            IMC: <span className="font-semibold">{bmi.toFixed(1)}</span>
            {bmi < 18.5 ? " (Abaixo)" : bmi < 25 ? " (Normal)" : bmi < 30 ? " (Sobrepeso)" : " (Obesidade)"}
          </p>
        )}
      </div>

      {/* Row 3: HDA + Exame Físico side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase">HDA</Label>
          <Textarea {...form.register("history_current_illness")} className="mt-1 min-h-[60px]" placeholder="História da doença atual" />
        </div>
        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase">Exame Físico</Label>
          <Textarea {...form.register("physical_exam_notes")} className="mt-1 min-h-[60px]" placeholder="Achados do exame físico" />
        </div>
      </div>

      {/* Row 4: Diagnóstico + CID + Exame de Imagem */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase">Diagnóstico</Label>
          <Textarea {...form.register("diagnostic_hypothesis")} className="mt-1 min-h-[40px]" rows={2} placeholder="Hipótese diagnóstica" />
          {/* CID inline */}
          <div className="mt-2">
            <Input
              placeholder="Buscar CID-10..."
              value={cidSearch}
              onChange={(e) => setCidSearch(e.target.value)}
              className="h-8 text-xs"
            />
            {cidSearch && filteredCids.length > 0 && (
              <div className="mt-1 space-y-0.5 max-h-24 overflow-y-auto">
                {filteredCids.map((cid) => (
                  <button
                    key={cid.code}
                    type="button"
                    className="w-full text-left text-xs px-2 py-1 rounded hover:bg-muted flex justify-between"
                    onClick={() => {
                      setSelectedCids([...selectedCids, cid.code]);
                      setCidSearch("");
                    }}
                  >
                    <span className="font-mono font-semibold">{cid.code}</span>
                    <span className="text-muted-foreground truncate ml-2">{cid.description}</span>
                  </button>
                ))}
              </div>
            )}
            {selectedCids.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedCids.map((code) => (
                  <Badge key={code} variant="secondary" className="text-xs cursor-pointer" onClick={() => setSelectedCids(selectedCids.filter(c => c !== code))}>
                    {code} <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase">Exame de Imagem</Label>
          <Textarea {...form.register("imaging_exams")} className="mt-1 min-h-[40px]" rows={2} placeholder="Um exame por linha" />
        </div>
      </div>

      {/* Row 5: Conduta + Orientações */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase">Conduta / Tratamento</Label>
          <Textarea {...form.register("treatment_plan")} className="mt-1 min-h-[60px]" placeholder="Plano de tratamento" />
        </div>
        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase">Orientações ao Paciente</Label>
          <Textarea {...form.register("patient_instructions")} className="mt-1 min-h-[60px]" placeholder="Orientações" />
        </div>
      </div>

      {/* Row 6: Prescrições — compact inline */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs font-semibold text-muted-foreground uppercase">Prescrições</Label>
          <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => setPrescriptions([...prescriptions, { medication: "", dosage: "", frequency: "", duration: "" }])}>
            <Plus className="w-3 h-3 mr-1" /> Medicamento
          </Button>
        </div>
        {prescriptions.map((rx, i) => (
          <div key={i} className="grid grid-cols-5 gap-2 mb-2">
            <Input
              placeholder="Medicamento"
              value={rx.medication}
              onChange={(e) => { const p = [...prescriptions]; p[i].medication = e.target.value; setPrescriptions(p); }}
              className="h-8 text-xs col-span-2"
            />
            <Input
              placeholder="Dose"
              value={rx.dosage}
              onChange={(e) => { const p = [...prescriptions]; p[i].dosage = e.target.value; setPrescriptions(p); }}
              className="h-8 text-xs"
            />
            <Input
              placeholder="Posologia"
              value={rx.frequency}
              onChange={(e) => { const p = [...prescriptions]; p[i].frequency = e.target.value; setPrescriptions(p); }}
              className="h-8 text-xs"
            />
            <div className="flex gap-1">
              <Input
                placeholder="Dias"
                value={rx.duration}
                onChange={(e) => { const p = [...prescriptions]; p[i].duration = e.target.value; setPrescriptions(p); }}
                className="h-8 text-xs flex-1"
              />
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-red-500" onClick={() => setPrescriptions(prescriptions.filter((_, j) => j !== i))}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Row 7: Follow-up + Retorno */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase">Observações de Acompanhamento</Label>
          <Textarea {...form.register("follow_up_notes")} className="mt-1 min-h-[40px]" rows={2} placeholder="Notas de follow-up" />
        </div>
        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase">Próximo Retorno</Label>
          <div className="mt-1">
            <DatePicker date={nextAppointmentDate} onSelect={setNextAppointmentDate} />
          </div>
        </div>
      </div>

      {/* Fixed action bar — keyboard-aware */}
      <div className="fixed left-0 right-0 bg-background border-t p-3 flex justify-end gap-3 z-50" style={{ bottom: 'var(--keyboard-height, 0px)' }}>
        <div className="max-w-4xl mx-auto w-full flex justify-end gap-3">
          <Button type="button" variant="outline" size="sm" onClick={handleSaveDraft} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
            Rascunho
          </Button>
          <Button type="button" size="sm" onClick={handleFinalize} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
            Finalizar
          </Button>
        </div>
      </div>
    </div>
  );
}
