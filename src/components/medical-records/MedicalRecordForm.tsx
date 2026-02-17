import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useMedicalRecords, useMedicalRecord } from '@/hooks/useMedicalRecords';
import { useAuth } from '@/hooks/useAuth';
import { VitalSignsInput } from './VitalSignsInput';
import { PrescriptionBuilder } from './PrescriptionBuilder';
import { TreatmentConfirmationModal } from './TreatmentConfirmationModal';
import { updateDealToTreatment, checkAndMoveToAguardandoRetorno } from '@/hooks/useMedicalAppointments';
import { VitalSigns, Prescription, MedicalRecordInsert } from '@/types/medicalRecords';
import { ProductConsumption } from '@/types/inventory';
import { useInventory } from '@/hooks/useInventory';
import { useFinancialTransactions } from '@/hooks/useFinancialTransactions';
import { StockConsumption } from './StockConsumption';
import { Save, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useQueryClient } from '@tanstack/react-query';
import { DatePicker } from "@/components/ui/date-picker";
import { format } from 'date-fns';

const formSchema = z.object({
  // Anamnese
  chief_complaint: z.string().optional(),
  history_present_illness: z.string().optional(),
  past_medical_history: z.string().optional(),
  family_history: z.string().optional(),
  medications: z.string().optional(),
  allergies: z.string().optional(),

  // Vital Signs
  vital_signs: z.any().optional(),

  // Physical Examination
  physical_examination: z.string().optional(),

  // Assessment and Diagnosis
  assessment: z.string().optional(),
  diagnosis: z.string().optional(),

  // Treatment Plan
  treatment_plan: z.string().optional(),
  prescriptions: z.any().optional(),

  // Follow-up
  follow_up_date: z.string().optional(),
  follow_up_notes: z.string().optional(),

  // Notes
  clinical_notes: z.string().optional(),
  patient_notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface MedicalRecordFormProps {
  recordId?: string | null;
  contactId: string | null;
  appointmentId?: string | null;
  onSave?: () => void;
  onCancel?: () => void;
}

export function MedicalRecordForm({
  recordId,
  contactId,
  appointmentId,
  onSave,
  onCancel,
}: MedicalRecordFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { createRecord, updateRecord, markAsCompleted } = useMedicalRecords();
  const { record, isLoading: loadingRecord } = useMedicalRecord(recordId || null);
  const [vitalSigns, setVitalSigns] = useState<VitalSigns>({});
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [consumption, setConsumption] = useState<ProductConsumption[]>([]);
  const [showTreatmentModal, setShowTreatmentModal] = useState(false);

  // Hooks para Estoque e Financeiro
  const { registerMovement } = useInventory();
  const { createTransaction, isCreating: isCreatingTransaction } = useFinancialTransactions();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      chief_complaint: '',
      history_present_illness: '',
      past_medical_history: '',
      family_history: '',
      medications: '',
      allergies: '',
      physical_examination: '',
      assessment: '',
      diagnosis: '',
      treatment_plan: '',
      follow_up_date: '',
      follow_up_notes: '',
      clinical_notes: '',
      patient_notes: '',
    },
  });

  // Load existing record data
  useEffect(() => {
    if (record) {
      form.reset({
        chief_complaint: record.chief_complaint || '',
        history_present_illness: (record as any).history_present_illness || record.history_current_illness || '',
        past_medical_history: record.past_medical_history || '',
        family_history: record.family_history || '',
        medications: (record as any).medications?.join(', ') || '',
        allergies: (record as any).allergies?.join(', ') || '',
        physical_examination: (record as any).physical_examination || record.physical_exam_notes || '',
        assessment: (record as any).assessment || '',
        diagnosis: (record as any).diagnosis?.join(', ') || '',
        treatment_plan: record.treatment_plan || '',
        follow_up_date: (record as any).follow_up_date || '',
        follow_up_notes: record.follow_up_notes || '',
        clinical_notes: (record as any).clinical_notes || '',
        patient_notes: (record as any).patient_notes || '',
      });

      if (record.vital_signs) {
        setVitalSigns(record.vital_signs);
      }

      if (record.prescriptions) {
        setPrescriptions(record.prescriptions as any);
      }
    }
  }, [record, form]);

  const handleSaveDraft = async (data: FormData) => {
    if (!user || !contactId) return;

    const recordData: any = {
      user_id: user.id,
      doctor_id: user.id,
      contact_id: contactId,
      appointment_id: appointmentId || null,
      status: 'draft',
      chief_complaint: data.chief_complaint || null,
      history_present_illness: data.history_present_illness || null,
      past_medical_history: data.past_medical_history || null,
      family_history: data.family_history || null,
      medications: data.medications
        ? data.medications.split(',').map((m) => m.trim()).filter(Boolean)
        : [],
      allergies: data.allergies
        ? data.allergies.split(',').map((a) => a.trim()).filter(Boolean)
        : [],
      vital_signs: vitalSigns,
      physical_examination: data.physical_examination || null,
      assessment: data.assessment || null,
      diagnosis: data.diagnosis
        ? data.diagnosis.split(',').map((d) => d.trim()).filter(Boolean)
        : [],
      treatment_plan: data.treatment_plan || null,
      prescriptions: prescriptions.length > 0 ? prescriptions as any : [],
      follow_up_date: data.follow_up_date || null,
      follow_up_notes: data.follow_up_notes || null,
      clinical_notes: data.clinical_notes || null,
      patient_notes: data.patient_notes || null,
    };

    if (recordId) {
      await updateRecord.mutateAsync({ recordId, updates: recordData });
    } else {
      await createRecord.mutateAsync(recordData);
    }

    onSave?.();
  };

  const handleFinalize = async (data: FormData) => {
    if (!user || !contactId) return;

    const recordData: any = {
      user_id: user.id,
      doctor_id: user.id,
      contact_id: contactId,
      appointment_id: appointmentId || null,
      status: 'completed',
      chief_complaint: data.chief_complaint || null,
      history_present_illness: data.history_present_illness || null,
      past_medical_history: data.past_medical_history || null,
      family_history: data.family_history || null,
      medications: data.medications
        ? data.medications.split(',').map((m) => m.trim()).filter(Boolean)
        : [],
      allergies: data.allergies
        ? data.allergies.split(',').map((a) => a.trim()).filter(Boolean)
        : [],
      vital_signs: vitalSigns,
      physical_examination: data.physical_examination || null,
      assessment: data.assessment || null,
      diagnosis: data.diagnosis
        ? data.diagnosis.split(',').map((d) => d.trim()).filter(Boolean)
        : [],
      treatment_plan: data.treatment_plan || null,
      prescriptions: prescriptions.length > 0 ? prescriptions as any : [],
      follow_up_date: data.follow_up_date || null,
      follow_up_notes: data.follow_up_notes || null,
      clinical_notes: data.clinical_notes || null,
      patient_notes: data.patient_notes || null,
    };

    if (recordId) {
      await markAsCompleted.mutateAsync(recordId);
    } else {
      const result = await createRecord.mutateAsync(recordData);
      if ((result as any)?.id) {
        await markAsCompleted.mutateAsync((result as any).id);
      }
    }


    // Processar Estoque e Financeiro (Apenas na finalização)
    if (consumption.length > 0) {
      try {
        for (const item of consumption) {
          // 1. Baixa no Estoque
          await registerMovement.mutateAsync({
            batchId: item.batchId,
            type: 'OUT',
            quantity: -item.quantity, // Negativo para saída
            description: `Consumo em Consulta (Paciente: ${contactId})`
          });

          // 2. Lançamento Financeiro (Se houver preço)
          if (item.price && item.price > 0) {
            const amount = item.price * item.quantity;
            createTransaction({
              type: 'income',
              amount: amount,
              description: `Venda Material: ${item.itemId} (Qtd: ${item.quantity})`,
              date: new Date().toISOString(),
              transaction_date: new Date().toISOString(),
              status: 'pending',
              category_id: null,
              account_id: null,
              user_id: user.id
            } as any);
          }
        }
      } catch (err) {
        console.error("Erro ao processar estoque/financeiro", err);
        // Não bloqueia o fluxo principal, mas poderia avisar
      }
    }


    // Processar Estoque e Financeiro (Apenas na finalização)
    if (consumption.length > 0) {
      try {
        // Precisamos processar um por um
        for (const item of consumption) {
          // 1. Baixa no Estoque (registerMovement lida com a lógica no banco ou hook)
          // Nota: registerMovement espera batchCount, type, quantity.
          // O hook useInventory.registerMovement que escrevi espera: { batchId, type, quantity, description }
          await registerMovement.mutateAsync({
            batchId: item.batchId,
            type: 'OUT',
            quantity: -item.quantity, // Enviar negativo pois é saída
            description: `Consumo em Consulta`
          });

          // 2. Lançamento Financeiro (Se houver preço)
          if (item.price && item.price > 0) {
            createTransaction({
              type: 'entrada' as const,
              amount: item.price * item.quantity,
              description: `Venda Material: ${item.itemId} (Qtd: ${item.quantity})`,
              date: new Date().toISOString(),
              transaction_date: new Date().toISOString(),
              status: 'pendente' as const,
              category_id: null,
              account_id: null,
              user_id: user.id
            });
          }
        }
      } catch (err) {
        console.error("Erro ao processar estoque/financeiro", err);
      }
    }

    // Abrir modal de confirmação de tratamento após salvar
    setShowTreatmentModal(true);
  };

  const handleTreatmentConfirm = async (isInTreatment: boolean) => {
    if (!user || !contactId) return;

    try {
      if (isInTreatment) {
        // Marcar como em tratamento e mover para stage em_tratamento
        await updateDealToTreatment(contactId, user.id);
      } else {
        // Verificar se deve ir para aguardando retorno
        await checkAndMoveToAguardandoRetorno(contactId);
      }

      // Invalidar queries do CRM para atualizar o pipeline
      queryClient.invalidateQueries({ queryKey: ['crm-deals'] });

      // Chamar callback onSave após tudo
      onSave?.();
    } catch (error) {
      console.error('Erro ao atualizar status de tratamento:', error);
      // Mesmo com erro, chamar onSave para fechar o formulário
      onSave?.();
    }
  };

  if (loadingRecord) {
    return <div className="p-8 text-center">Carregando prontuário...</div>;
  }

  return (
    <Form {...form}>
      <form className="space-y-6">
        {/* Status Badge */}
        {record && (
          <div className="flex items-center gap-2">
            <Badge variant={(record as any).status === 'draft' ? 'secondary' : 'default'}>
              {(record as any).status === 'draft' ? 'Rascunho' : 'Completo'}
            </Badge>
          </div>
        )}

        {/* Section 1: Anamnese */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">1. Anamnese</h3>

          <FormField
            control={form.control}
            name="chief_complaint"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Queixa Principal</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Qual o motivo da consulta?"
                    rows={2}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="history_present_illness"
            render={({ field }) => (
              <FormItem>
                <FormLabel>História da Doença Atual (HDA)</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Descreva a evolução dos sintomas..."
                    rows={4}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="past_medical_history"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Antecedentes Pessoais</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Doenças prévias, cirurgias, etc."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="family_history"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Antecedentes Familiares</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Histórico familiar de doenças"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="medications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medicamentos em Uso</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Separar por vírgula"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Exemplo: Losartana 50mg, Metformina 850mg
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allergies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alergias</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Separar por vírgula"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Exemplo: Penicilina, Dipirona
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Section 2: Vital Signs */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">2. Sinais Vitais</h3>
          <VitalSignsInput value={vitalSigns} onChange={setVitalSigns} />
        </div>

        <Separator />

        {/* Section 3: Physical Examination */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">3. Exame Físico</h3>

          <FormField
            control={form.control}
            name="physical_examination"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Exame Físico Descritivo</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Descreva os achados do exame físico..."
                    rows={5}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Section 4: Assessment and Diagnosis */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">4. Avaliação e Diagnóstico</h3>

          <FormField
            control={form.control}
            name="assessment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Avaliação Clínica</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Impressão clínica e raciocínio diagnóstico..."
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="diagnosis"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Diagnósticos</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Separar por vírgula"
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Exemplo: Hipertensão Arterial, Diabetes Mellitus Tipo 2
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Section 5: Treatment Plan */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">5. Plano Terapêutico</h3>

          <FormField
            control={form.control}
            name="treatment_plan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plano de Tratamento</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Orientações gerais, mudanças de estilo de vida, etc."
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <FormLabel>Prescrições</FormLabel>
            <PrescriptionBuilder value={prescriptions as any} onChange={setPrescriptions as any} />
          </div>
        </div>

        <Separator />

        {/* Section 6: Follow-up */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">6. Acompanhamento</h3>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="follow_up_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Retorno</FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value ? new Date(field.value + 'T00:00:00') : undefined}
                      setDate={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="follow_up_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações de Acompanhamento</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ex: Retornar com exames"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Section: Stock Consumption */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Consumo de Materiais</h3>
          <StockConsumption value={consumption} onChange={setConsumption} />
        </div>

        <Separator />

        {/* Section 7: Notes */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">7. Notas</h3>

          <FormField
            control={form.control}
            name="clinical_notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas Clínicas (Privado)</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Notas visíveis apenas para o médico..."
                    rows={3}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Estas notas são privadas e não serão compartilhadas
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="patient_notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas ao Paciente</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Orientações e informações para o paciente..."
                    rows={3}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Estas notas podem ser compartilhadas com o paciente
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={form.handleSubmit(handleSaveDraft)}
            disabled={createRecord.isPending || updateRecord.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar Rascunho
          </Button>

          <Button
            type="button"
            onClick={form.handleSubmit(handleFinalize)}
            disabled={createRecord.isPending || updateRecord.isPending || markAsCompleted.isPending}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Finalizar Prontuário
          </Button>

          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancelar
            </Button>
          )}
        </div>
      </form>

      {/* Modal de confirmação de tratamento */}
      <TreatmentConfirmationModal
        open={showTreatmentModal}
        onOpenChange={setShowTreatmentModal}
        onConfirm={handleTreatmentConfirm}
      />
    </Form>
  );
}
