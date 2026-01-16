import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMedicalRecords, calculateBMI, classifyBMI } from '@/hooks/useMedicalRecords';
import {
  CreateMedicalRecordInput,
  MedicationPrescription,
  RequestedExam,
  VitalSigns,
  RECORD_TYPES,
  COMMON_CID_CODES,
  MEDICATION_ROUTES
} from '@/types/medicalRecords';
import {
  Stethoscope,
  Heart,
  Thermometer,
  Activity,
  Scale,
  Ruler,
  Pill,
  TestTube,
  FileText,
  Save,
  X,
  Plus,
  Trash2,
  Search
} from 'lucide-react';
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";

// Schema de validação
const recordSchema = z.object({
  record_type: z.enum(['consultation', 'return', 'procedure', 'exam', 'emergency']),
  chief_complaint: z.string().optional(),
  history_current_illness: z.string().optional(),
  past_medical_history: z.string().optional(),
  family_history: z.string().optional(),
  social_history: z.string().optional(),
  general_condition: z.string().optional(),
  physical_exam_notes: z.string().optional(),
  diagnostic_hypothesis: z.string().optional(),
  treatment_plan: z.string().optional(),
  complications: z.string().optional(),
  patient_instructions: z.string().optional(),
  follow_up_notes: z.string().optional(),
  next_appointment_date: z.string().optional(),
});

type RecordFormData = z.infer<typeof recordSchema>;

interface NewRecordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  patientName: string;
}

export function NewRecordModal({ open, onOpenChange, contactId, patientName }: NewRecordModalProps) {
  const { createRecord, isCreating } = useMedicalRecords(contactId);
  const [activeTab, setActiveTab] = useState('anamnese');

  // Estados para sinais vitais
  const [vitalSigns, setVitalSigns] = useState<VitalSigns>({});

  // Estados para listas
  const [allergiesNoted, setAllergiesNoted] = useState<string[]>([]);
  const [cidCodes, setCidCodes] = useState<string[]>([]);
  const [prescriptions, setPrescriptions] = useState<MedicationPrescription[]>([]);
  const [examsRequested, setExamsRequested] = useState<RequestedExam[]>([]);

  // Estados para inputs temporários
  const [newAllergy, setNewAllergy] = useState('');
  const [cidSearch, setCidSearch] = useState('');
  const [newMedication, setNewMedication] = useState<Partial<MedicationPrescription>>({});
  const [newExam, setNewExam] = useState<Partial<RequestedExam>>({});

  const form = useForm<RecordFormData>({
    resolver: zodResolver(recordSchema),
    defaultValues: {
      record_type: 'consultation',
    },
  });

  // Calcular IMC automaticamente
  const bmi = calculateBMI(vitalSigns.weight, vitalSigns.height);
  const bmiClassification = classifyBMI(bmi);

  // Filtrar CIDs pela busca
  const filteredCIDs = cidSearch
    ? COMMON_CID_CODES.filter(
      cid =>
        cid.code.toLowerCase().includes(cidSearch.toLowerCase()) ||
        cid.description.toLowerCase().includes(cidSearch.toLowerCase())
    )
    : COMMON_CID_CODES;

  const handleSubmit = async (data: RecordFormData) => {
    const recordInput: CreateMedicalRecordInput = {
      contact_id: contactId,
      ...data,
      vital_signs: Object.keys(vitalSigns).length > 0 ? { ...vitalSigns, bmi: bmi || undefined } : undefined,
      allergies_noted: allergiesNoted.length > 0 ? allergiesNoted : undefined,
      cid_codes: cidCodes.length > 0 ? cidCodes : undefined,
      prescriptions: prescriptions.length > 0 ? prescriptions : undefined,
      exams_requested: examsRequested.length > 0 ? examsRequested : undefined,
    };

    try {
      await createRecord.mutateAsync(recordInput);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      // Erro já é tratado pelo hook useMedicalRecords com toast
      console.error('Erro ao criar prontuário:', error);
    }
  };

  const resetForm = () => {
    form.reset();
    setVitalSigns({});
    setAllergiesNoted([]);
    setCidCodes([]);
    setPrescriptions([]);
    setExamsRequested([]);
    setActiveTab('anamnese');
  };

  const addPrescription = () => {
    if (newMedication.medication && newMedication.dosage) {
      setPrescriptions([...prescriptions, {
        id: crypto.randomUUID(),
        medication: newMedication.medication,
        dosage: newMedication.dosage,
        frequency: newMedication.frequency || '',
        duration: newMedication.duration || '',
        quantity: newMedication.quantity,
        instructions: newMedication.instructions,
        route: newMedication.route,
      }]);
      setNewMedication({});
    }
  };

  const removePrescription = (index: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const addExam = () => {
    if (newExam.exam_name) {
      setExamsRequested([...examsRequested, {
        id: crypto.randomUUID(),
        exam_name: newExam.exam_name,
        urgency: newExam.urgency || 'routine',
        notes: newExam.notes,
      }]);
      setNewExam({});
    }
  };

  const removeExam = (index: number) => {
    setExamsRequested(examsRequested.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            Novo Atendimento
          </DialogTitle>
          <DialogDescription>
            Paciente: <strong>{patientName}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <ScrollArea className="h-[calc(90vh-180px)]">
            <div className="p-6 pt-4">
              {/* Tipo de atendimento */}
              <div className="mb-4">
                <Label>Tipo de Atendimento</Label>
                <Select
                  value={form.watch('record_type')}
                  onValueChange={(value: any) => form.setValue('record_type', value)}
                >
                  <SelectTrigger className="w-full md:w-[300px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RECORD_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label} - {type.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-5 w-full">
                  <TabsTrigger value="anamnese">Anamnese</TabsTrigger>
                  <TabsTrigger value="exame">Exame Físico</TabsTrigger>
                  <TabsTrigger value="diagnostico">Diagnóstico</TabsTrigger>
                  <TabsTrigger value="prescricao">Prescrições</TabsTrigger>
                  <TabsTrigger value="exames">Exames</TabsTrigger>
                </TabsList>

                {/* Tab Anamnese */}
                <TabsContent value="anamnese" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="chief_complaint">Queixa Principal</Label>
                    <Textarea
                      id="chief_complaint"
                      placeholder="Qual o motivo da consulta?"
                      {...form.register('chief_complaint')}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="history_current_illness">História da Doença Atual (HDA)</Label>
                    <Textarea
                      id="history_current_illness"
                      placeholder="Descreva a evolução dos sintomas..."
                      {...form.register('history_current_illness')}
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="past_medical_history">História Patológica Pregressa</Label>
                      <Textarea
                        id="past_medical_history"
                        placeholder="Doenças anteriores, cirurgias..."
                        {...form.register('past_medical_history')}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="family_history">História Familiar</Label>
                      <Textarea
                        id="family_history"
                        placeholder="Doenças na família..."
                        {...form.register('family_history')}
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="social_history">Hábitos de Vida</Label>
                    <Textarea
                      id="social_history"
                      placeholder="Tabagismo, etilismo, atividade física, alimentação..."
                      {...form.register('social_history')}
                      rows={2}
                    />
                  </div>

                  {/* Alergias identificadas nesta consulta */}
                  <div className="space-y-2">
                    <Label>Alergias Identificadas</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Adicionar alergia..."
                        value={newAllergy}
                        onChange={(e) => setNewAllergy(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newAllergy.trim()) {
                              setAllergiesNoted([...allergiesNoted, newAllergy.trim()]);
                              setNewAllergy('');
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (newAllergy.trim()) {
                            setAllergiesNoted([...allergiesNoted, newAllergy.trim()]);
                            setNewAllergy('');
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {allergiesNoted.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {allergiesNoted.map((allergy, index) => (
                          <Badge key={index} variant="secondary" className="gap-1">
                            {allergy}
                            <button
                              type="button"
                              onClick={() => setAllergiesNoted(allergiesNoted.filter((_, i) => i !== index))}
                              className="ml-1 hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Tab Exame Físico */}
                <TabsContent value="exame" className="space-y-4 mt-4">
                  {/* Sinais Vitais */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        Sinais Vitais
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-1">
                            <Heart className="h-3 w-3 text-red-500" />
                            PA Sistólica
                          </Label>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              placeholder="120"
                              value={vitalSigns.bp_systolic || ''}
                              onChange={(e) => setVitalSigns({ ...vitalSigns, bp_systolic: Number(e.target.value) || undefined })}
                            />
                            <span className="text-xs text-muted-foreground">mmHg</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="flex items-center gap-1">
                            <Heart className="h-3 w-3 text-red-500" />
                            PA Diastólica
                          </Label>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              placeholder="80"
                              value={vitalSigns.bp_diastolic || ''}
                              onChange={(e) => setVitalSigns({ ...vitalSigns, bp_diastolic: Number(e.target.value) || undefined })}
                            />
                            <span className="text-xs text-muted-foreground">mmHg</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="flex items-center gap-1">
                            <Activity className="h-3 w-3 text-pink-500" />
                            Freq. Cardíaca
                          </Label>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              placeholder="70"
                              value={vitalSigns.heart_rate || ''}
                              onChange={(e) => setVitalSigns({ ...vitalSigns, heart_rate: Number(e.target.value) || undefined })}
                            />
                            <span className="text-xs text-muted-foreground">bpm</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="flex items-center gap-1">
                            <Activity className="h-3 w-3 text-blue-500" />
                            Freq. Respiratória
                          </Label>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              placeholder="16"
                              value={vitalSigns.respiratory_rate || ''}
                              onChange={(e) => setVitalSigns({ ...vitalSigns, respiratory_rate: Number(e.target.value) || undefined })}
                            />
                            <span className="text-xs text-muted-foreground">irpm</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="flex items-center gap-1">
                            <Thermometer className="h-3 w-3 text-orange-500" />
                            Temperatura
                          </Label>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="36.5"
                              value={vitalSigns.temperature || ''}
                              onChange={(e) => setVitalSigns({ ...vitalSigns, temperature: Number(e.target.value) || undefined })}
                            />
                            <span className="text-xs text-muted-foreground">°C</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="flex items-center gap-1">
                            <Activity className="h-3 w-3 text-cyan-500" />
                            SpO2
                          </Label>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              placeholder="98"
                              value={vitalSigns.spo2 || ''}
                              onChange={(e) => setVitalSigns({ ...vitalSigns, spo2: Number(e.target.value) || undefined })}
                            />
                            <span className="text-xs text-muted-foreground">%</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="flex items-center gap-1">
                            <Scale className="h-3 w-3 text-green-500" />
                            Peso
                          </Label>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="70"
                              value={vitalSigns.weight || ''}
                              onChange={(e) => setVitalSigns({ ...vitalSigns, weight: Number(e.target.value) || undefined })}
                            />
                            <span className="text-xs text-muted-foreground">kg</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="flex items-center gap-1">
                            <Ruler className="h-3 w-3 text-purple-500" />
                            Altura
                          </Label>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              placeholder="170"
                              value={vitalSigns.height || ''}
                              onChange={(e) => setVitalSigns({ ...vitalSigns, height: Number(e.target.value) || undefined })}
                            />
                            <span className="text-xs text-muted-foreground">cm</span>
                          </div>
                        </div>
                      </div>

                      {/* IMC calculado */}
                      {bmi && (
                        <div className="mt-4 p-3 rounded-lg bg-muted/50">
                          <p className="text-sm">
                            <strong>IMC:</strong> {bmi} kg/m² -{' '}
                            <span className={`font-medium text-${bmiClassification.color}-600`}>
                              {bmiClassification.label}
                            </span>
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Estado geral e exame físico */}
                  <div className="space-y-2">
                    <Label htmlFor="general_condition">Estado Geral</Label>
                    <Input
                      id="general_condition"
                      placeholder="Bom estado geral, lúcido, orientado..."
                      {...form.register('general_condition')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="physical_exam_notes">Exame Físico Detalhado</Label>
                    <Textarea
                      id="physical_exam_notes"
                      placeholder="Descreva o exame físico por sistemas (cabeça, pescoço, tórax, abdome, membros...)"
                      {...form.register('physical_exam_notes')}
                      rows={6}
                    />
                  </div>
                </TabsContent>

                {/* Tab Diagnóstico */}
                <TabsContent value="diagnostico" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="diagnostic_hypothesis">Hipótese Diagnóstica</Label>
                    <Textarea
                      id="diagnostic_hypothesis"
                      placeholder="Descreva a hipótese diagnóstica..."
                      {...form.register('diagnostic_hypothesis')}
                      rows={3}
                    />
                  </div>

                  {/* Busca CID-10 */}
                  <div className="space-y-2">
                    <Label>Código CID-10</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar CID por código ou descrição..."
                          value={cidSearch}
                          onChange={(e) => setCidSearch(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    {cidSearch && (
                      <div className="max-h-40 overflow-y-auto border rounded-md">
                        {filteredCIDs.slice(0, 10).map((cid) => (
                          <button
                            key={cid.code}
                            type="button"
                            className="w-full p-2 text-left hover:bg-muted text-sm border-b last:border-b-0"
                            onClick={() => {
                              if (!cidCodes.includes(cid.code)) {
                                setCidCodes([...cidCodes, cid.code]);
                              }
                              setCidSearch('');
                            }}
                          >
                            <span className="font-medium">{cid.code}</span> - {cid.description}
                          </button>
                        ))}
                      </div>
                    )}

                    {cidCodes.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {cidCodes.map((code, index) => {
                          const cidInfo = COMMON_CID_CODES.find(c => c.code === code);
                          return (
                            <Badge key={index} variant="secondary" className="gap-1">
                              {code}
                              {cidInfo && <span className="text-xs opacity-70">({cidInfo.description.substring(0, 20)}...)</span>}
                              <button
                                type="button"
                                onClick={() => setCidCodes(cidCodes.filter((_, i) => i !== index))}
                                className="ml-1 hover:text-destructive"
                              >
                                ×
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="treatment_plan">Conduta / Plano Terapêutico</Label>
                    <Textarea
                      id="treatment_plan"
                      placeholder="Descreva o tratamento proposto..."
                      {...form.register('treatment_plan')}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="complications" className="flex items-center gap-2">
                      Complicações
                      <Badge variant="outline" className="text-xs font-normal">
                        Importante para procedimentos
                      </Badge>
                    </Label>
                    <Textarea
                      id="complications"
                      placeholder="Registre qualquer intercorrência, complicação ou evento adverso ocorrido durante o atendimento..."
                      {...form.register('complications')}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="patient_instructions">Orientações ao Paciente</Label>
                    <Textarea
                      id="patient_instructions"
                      placeholder="Orientações gerais, cuidados, sinais de alerta..."
                      {...form.register('patient_instructions')}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="follow_up_notes">Acompanhamento</Label>
                      <Textarea
                        id="follow_up_notes"
                        placeholder="Notas sobre acompanhamento..."
                        {...form.register('follow_up_notes')}
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="next_appointment_date">Data do Retorno</Label>
                      <DatePicker
                        date={form.watch('next_appointment_date') ? new Date(form.watch('next_appointment_date')! + 'T00:00:00') : undefined}
                        setDate={(date) => form.setValue('next_appointment_date', date ? format(date, 'yyyy-MM-dd') : '')}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Tab Prescrições */}
                <TabsContent value="prescricao" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Pill className="h-4 w-4 text-blue-500" />
                        Adicionar Medicamento
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Medicamento *</Label>
                          <Input
                            placeholder="Nome do medicamento"
                            value={newMedication.medication || ''}
                            onChange={(e) => setNewMedication({ ...newMedication, medication: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Dosagem *</Label>
                          <Input
                            placeholder="Ex: 500mg"
                            value={newMedication.dosage || ''}
                            onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Posologia</Label>
                          <Input
                            placeholder="Ex: 8/8h, 1x ao dia"
                            value={newMedication.frequency || ''}
                            onChange={(e) => setNewMedication({ ...newMedication, frequency: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Duração</Label>
                          <Input
                            placeholder="Ex: 7 dias, 30 dias"
                            value={newMedication.duration || ''}
                            onChange={(e) => setNewMedication({ ...newMedication, duration: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Quantidade</Label>
                          <Input
                            placeholder="Ex: 21 comprimidos"
                            value={newMedication.quantity || ''}
                            onChange={(e) => setNewMedication({ ...newMedication, quantity: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Via de Administração</Label>
                          <Select
                            value={newMedication.route || ''}
                            onValueChange={(value) => setNewMedication({ ...newMedication, route: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {MEDICATION_ROUTES.map((route) => (
                                <SelectItem key={route.value} value={route.value}>
                                  {route.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Instruções Adicionais</Label>
                        <Input
                          placeholder="Ex: Tomar após as refeições"
                          value={newMedication.instructions || ''}
                          onChange={(e) => setNewMedication({ ...newMedication, instructions: e.target.value })}
                        />
                      </div>
                      <Button type="button" onClick={addPrescription} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Adicionar à Prescrição
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Lista de medicamentos */}
                  {prescriptions.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Medicamentos Prescritos ({prescriptions.length})</h4>
                      {prescriptions.map((med, index) => (
                        <Card key={med.id || index} className="bg-blue-50 dark:bg-blue-950">
                          <CardContent className="p-3 flex items-start justify-between">
                            <div>
                              <p className="font-medium">{med.medication} - {med.dosage}</p>
                              <p className="text-sm text-muted-foreground">
                                {med.frequency} por {med.duration}
                                {med.quantity && ` (${med.quantity})`}
                              </p>
                              {med.instructions && (
                                <p className="text-sm text-muted-foreground italic">{med.instructions}</p>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removePrescription(index)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Tab Exames */}
                <TabsContent value="exames" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <TestTube className="h-4 w-4 text-cyan-500" />
                        Solicitar Exame
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Nome do Exame *</Label>
                          <Input
                            placeholder="Ex: Hemograma completo"
                            value={newExam.exam_name || ''}
                            onChange={(e) => setNewExam({ ...newExam, exam_name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Urgência</Label>
                          <Select
                            value={newExam.urgency || 'routine'}
                            onValueChange={(value: any) => setNewExam({ ...newExam, urgency: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="routine">Rotina</SelectItem>
                              <SelectItem value="urgent">Urgente</SelectItem>
                              <SelectItem value="emergency">Emergência</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Observações</Label>
                          <Input
                            placeholder="Instruções especiais"
                            value={newExam.notes || ''}
                            onChange={(e) => setNewExam({ ...newExam, notes: e.target.value })}
                          />
                        </div>
                      </div>
                      <Button type="button" onClick={addExam} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Adicionar Exame
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Lista de exames */}
                  {examsRequested.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Exames Solicitados ({examsRequested.length})</h4>
                      <div className="flex flex-wrap gap-2">
                        {examsRequested.map((exam, index) => (
                          <Badge
                            key={exam.id || index}
                            variant="outline"
                            className="gap-2 py-2 px-3"
                          >
                            {exam.exam_name}
                            {exam.urgency === 'urgent' && <span className="text-orange-500">⚡</span>}
                            {exam.urgency === 'emergency' && <span className="text-red-500">🔴</span>}
                            <button
                              type="button"
                              onClick={() => removeExam(index)}
                              className="ml-1 hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>

          {/* Footer com botões */}
          <div className="flex items-center justify-end gap-2 p-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={isCreating}>
              <Save className="h-4 w-4 mr-2" />
              {isCreating ? 'Salvando...' : 'Salvar Atendimento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
