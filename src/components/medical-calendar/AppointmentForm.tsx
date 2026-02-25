import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCRM } from '@/hooks/useCRM';
import { useAuth } from '@/hooks/useAuth';
import { useAvailability } from '@/hooks/useAvailability';
import { useCommercialProcedures } from '@/hooks/useCommercialProcedures';
import { useDoctors } from '@/hooks/useDoctors';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { ContactForm } from '@/components/crm/ContactForm';
import { UserPlus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AppointmentType,
  AppointmentStatus,
  PaymentStatus,
  APPOINTMENT_TYPE_LABELS,
  APPOINTMENT_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  DURATION_OPTIONS,
  generateTimeSlots,
  MedicalAppointment,
} from '@/types/medicalAppointments';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Loader2, AlertCircle, Upload, Eye, X, Search, CheckCircle2, Download } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useSinalReceipts } from '@/hooks/useSinalReceipts';
import { useFinancialAccounts } from '@/hooks/useFinancialAccounts';
import { StockUsageSelector, StockUsageItem } from '@/components/inventory/StockUsageSelector';

// Ensure ptBR is available (defensive check)
const locale = ptBR || undefined;
import { cn } from '@/lib/utils';
import React, { useState, useEffect, useRef } from 'react';
import { parseISO } from 'date-fns';
import { formatCurrencyInput, parseCurrencyToNumber, formatCurrency } from '@/lib/currency';

const appointmentSchema = z.object({
  doctor_id: z.string().uuid().optional(),
  contact_id: z.string().uuid({ message: 'Paciente é obrigatório' }),
  appointment_type: z.enum(['first_visit', 'return', 'procedure', 'urgent', 'follow_up', 'exam']),
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  start_date: z.date({ required_error: 'Data é obrigatória' }),
  start_time: z.string().min(1, 'Horário é obrigatório'),
  duration_minutes: z.number().min(15).max(480),
  status: z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']),
  notes: z.string().optional(),
  internal_notes: z.string().optional(),
  estimated_value: z.string().optional().transform((val) => val ? parseCurrencyToNumber(val) : undefined),
  payment_status: z.enum(['pending', 'paid', 'partial', 'cancelled']),
  paid_in_advance: z.boolean().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<any>;
  appointment?: MedicalAppointment | null;
  prefilledStart?: Date;
  prefilledEnd?: Date;
  conversionData?: {
    contactId?: string;
    appointmentValue?: number;
    paidInAdvance?: boolean;
  } | null;
  onAppointmentCreated?: (appointment: any) => void;
}

export function AppointmentForm({
  open,
  onOpenChange,
  onSubmit,
  appointment,
  prefilledStart,
  prefilledEnd,
  conversionData,
  onAppointmentCreated,
}: AppointmentFormProps) {
  const { user } = useAuth();
  const { contacts, isLoadingContacts, refetchContacts } = useCRM(undefined, true); // true = buscar todos os contatos
  const { checkAvailability } = useAvailability();
  const { procedures, isLoading: isLoadingProcedures } = useCommercialProcedures();
  const { doctors, isLoading: isLoadingDoctors } = useDoctors();
  const { canScheduleForOthers, profile } = useUserProfile();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [estimatedValueDisplay, setEstimatedValueDisplay] = useState<string>('');
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [showNewContactForm, setShowNewContactForm] = useState(false);
  const [formInitialized, setFormInitialized] = useState(false);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');

  // Estados para Sinal (entrada/depósito)
  const [sinalPaid, setSinalPaid] = useState(false);
  const [sinalFile, setSinalFile] = useState<File | null>(null);
  const [sinalReceiptUrl, setSinalReceiptUrl] = useState<string | null>(null);
  const [sinalAmount, setSinalAmount] = useState<number | null>(null);
  const [sinalAmountDisplay, setSinalAmountDisplay] = useState<string>('');
  const [hasNoSinal, setHasNoSinal] = useState(false);
  const [linkedProcedure, setLinkedProcedure] = useState<any>(null);
  const [selectedProcedureId, setSelectedProcedureId] = useState<string | null>(null);
  const { uploadReceipt, isUploading } = useSinalReceipts();
  const { accounts, isLoading: isLoadingAccounts } = useFinancialAccounts();
  const hasActiveAccount = accounts && accounts.length > 0;
  const [stockUsage, setStockUsage] = useState<StockUsageItem[]>([]);

  // Refs para evitar loops infinitos de re-renders
  const contactsRef = useRef(contacts);
  const proceduresRef = useRef(procedures);
  const hasAutoFilledRef = useRef<string | null>(null); // Armazena o ID do contato já preenchido

  // Atualizar refs quando arrays mudam (sem causar re-render)
  useEffect(() => {
    contactsRef.current = contacts;
  }, [contacts]);

  useEffect(() => {
    proceduresRef.current = procedures;
  }, [procedures]);

  // Reset da flag de preenchimento quando fecha o modal ou muda o contato
  useEffect(() => {
    if (!open) {
      hasAutoFilledRef.current = null;
      // Resetar estados de sinal
      setSinalPaid(false);
      setSinalFile(null);
      setSinalAmount(null);
      setSinalAmountDisplay('');
      setHasNoSinal(false);
      setLinkedProcedure(null);
      setSelectedProcedureId(null);
    }
  }, [open]);

  // Invalidar cache quando o formulário abrir para garantir dados frescos
  useEffect(() => {
    if (open && user?.id && !isLoadingContacts) {
      // Apenas invalidar o cache, não remover completamente
      queryClient.invalidateQueries({ queryKey: ['crm-contacts', user.id] });

      // Se não há contatos carregados, forçar refetch
      if (contacts.length === 0 && refetchContacts) {
        refetchContacts().catch(() => { });
      }
    }
  }, [open, user?.id, queryClient, refetchContacts, isLoadingContacts, contacts.length]);

  // Fetch existing stock usage when editing
  useEffect(() => {
    if (appointment?.id && open) {
      const fetchUsage = async () => {
        const { data, error } = await (supabase
          .from('appointment_stock_usage' as any) as any)
          .select(`
            inventory_item_id, 
            quantity, 
            inventory_items(
              name, 
              unit, 
              min_stock,
              inventory_batches(expiration_date, is_active, quantity)
            )
          `)
          .eq('appointment_id', appointment.id);

        if (data) {
          const formatted: StockUsageItem[] = data.map((d: any) => {
            const item = d.inventory_items;
            const batches = item?.inventory_batches || [];

            // Get nearest active expiry
            const validDates = batches
              .filter((b: any) => b.is_active !== false && b.expiration_date)
              .map((b: any) => parseISO(b.expiration_date));

            const nearestExpiry = validDates.length > 0
              ? validDates.sort((a: any, b: any) => a.getTime() - b.getTime())[0].toISOString()
              : null;

            // Calculate total quantity from batches since it's not a real column
            const totalQuantity = batches.reduce((acc: number, b: any) => acc + (b.quantity || 0), 0);

            return {
              inventory_item_id: d.inventory_item_id,
              quantity: Number(d.quantity),
              name: item?.name || 'Item desconhecido',
              unit: item?.unit || 'un',
              total_quantity: totalQuantity,
              min_stock: item?.min_stock,
              nearest_expiry: nearestExpiry
            };
          });
          setStockUsage(formatted);
        }
      };
      fetchUsage();
    } else if (!open) {
      setStockUsage([]);
    }
  }, [appointment, open]);

  const timeSlots = generateTimeSlots();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      appointment_type: 'first_visit',
      status: 'scheduled',
      duration_minutes: 30,
      payment_status: 'pending',
      start_date: prefilledStart || new Date(),
      start_time: prefilledStart ? format(prefilledStart, 'HH:mm') : '09:00',
    },
  });

  const handleFormSubmit = async (data: AppointmentFormData) => {
    setIsSubmitting(true);
    setAvailabilityError(null);

    try {
      // Combine date and time
      const [hours, minutes] = data.start_time.split(':');
      const startDateTime = new Date(data.start_date);
      startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Calculate end time
      const endDateTime = new Date(startDateTime.getTime() + data.duration_minutes * 60000);

      // Check availability (exclude current appointment if editing)
      const availability = checkAvailability(
        startDateTime,
        endDateTime,
        appointment?.id
      );

      if (!availability.available) {
        const conflictMessages = availability.conflicts.map((conflict) => {
          const conflictType = conflict.type === 'appointment' ? 'Consulta médica' : 'Reunião';
          const conflictTime = format(parseISO(conflict.start_time), 'HH:mm', { locale: ptBR });
          return `${conflictType}: ${conflict.title} às ${conflictTime}`;
        });

        setAvailabilityError(
          `Horário indisponível! Conflito com: ${conflictMessages.join(', ')}`
        );
        setIsSubmitting(false);
        return;
      }

      if (!user?.id) {
        setAvailabilityError('Usuário não autenticado. Por favor, faça login novamente.');
        setIsSubmitting(false);
        return;
      }

      // Usar a URL já carregada no upload imediato se disponível
      let finalSinalReceiptUrl = sinalReceiptUrl;

      // Se ainda não foi feito o upload (ex: novo agendamento onde não disparou imediato)
      // Faz o upload agora
      if (sinalPaid && sinalFile && !finalSinalReceiptUrl && !hasNoSinal) {
        finalSinalReceiptUrl = await uploadReceipt(sinalFile, `appointment-${Date.now()}`);
        if (!finalSinalReceiptUrl) {
          setAvailabilityError('Erro ao fazer upload do comprovante. Tente novamente.');
          setIsSubmitting(false);
          return;
        }
      }

      const submitData = {
        user_id: user.id,
        doctor_id: data.doctor_id || user.id,
        contact_id: data.contact_id,
        title: data.title,
        appointment_type: data.appointment_type,
        status: data.status,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        duration_minutes: data.duration_minutes,
        notes: data.notes || null,
        internal_notes: data.internal_notes || null,
        estimated_value: data.estimated_value || null,
        payment_status: data.payment_status,
        paid_in_advance: data.paid_in_advance || false,
        sinal_amount: hasNoSinal ? null : (sinalAmount || null),
        sinal_paid: hasNoSinal ? false : sinalPaid,
        sinal_receipt_url: hasNoSinal ? null : finalSinalReceiptUrl,
        sinal_paid_at: (hasNoSinal || !sinalPaid) ? null : new Date().toISOString(),
        organization_id: profile?.organization_id,
      };

      const result = await onSubmit(submitData);

      // Save stock usage if any (only for procedures)
      if (result && stockUsage.length > 0 && data.appointment_type === 'procedure') {
        // Delete existing (simple strategy to handle updates)
        await (supabase.from('appointment_stock_usage' as any) as any).delete().eq('appointment_id', result.id);

        const usageToInsert = stockUsage.map(item => ({
          appointment_id: result.id,
          inventory_item_id: item.inventory_item_id,
          quantity: item.quantity,
          deducted: false // Will be deducted by trigger when status becomes 'completed'
        }));

        if (usageToInsert.length > 0) {
          const { error: usageError } = await (supabase.from('appointment_stock_usage' as any) as any).insert(usageToInsert);
          if (usageError) console.error('Error saving stock usage:', usageError);
        }
      }

      setAvailabilityError(null);
      setEstimatedValueDisplay('');
      // Resetar estados de sinal
      setSinalPaid(false);
      setSinalFile(null);
      setSinalAmount(null);
      setHasNoSinal(false);
      setLinkedProcedure(null);
      reset();
      onOpenChange(false);

      // Call callback if provided and if creating new appointment
      if (!appointment && onAppointmentCreated && result) {
        onAppointmentCreated(result);
      }
    } catch (error) {
      console.error('Error submitting appointment:', error);
      setAvailabilityError('Erro ao salvar consulta. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Populate form when editing or when conversion data is provided
  useEffect(() => {
    if (appointment && open) {
      const startDate = parseISO(appointment.start_time);
      const estimatedValueFormatted = appointment.estimated_value
        ? formatCurrency(appointment.estimated_value)
        : '';
      setEstimatedValueDisplay(estimatedValueFormatted);
      reset({
        doctor_id: appointment.doctor_id || undefined,
        contact_id: appointment.contact_id,
        appointment_type: appointment.appointment_type,
        title: appointment.title,
        start_date: startDate,
        start_time: format(startDate, 'HH:mm'),
        duration_minutes: appointment.duration_minutes,
        status: appointment.status,
        notes: appointment.notes || '',
        internal_notes: appointment.internal_notes || '',
        estimated_value: estimatedValueFormatted as any,
        payment_status: appointment.payment_status,
        paid_in_advance: appointment.paid_in_advance || false,
      });

      if (appointment.sinal_receipt_url) {
        setSinalReceiptUrl(appointment.sinal_receipt_url);
        setSinalPaid(appointment.sinal_paid);
      }
    } else if (!appointment && open) {
      // Reset to defaults for new appointment
      const isConversion = conversionData && conversionData.contactId;
      const estimatedValueFormatted = isConversion && conversionData.appointmentValue
        ? formatCurrency(conversionData.appointmentValue)
        : '';

      setEstimatedValueDisplay(estimatedValueFormatted);
      reset({
        doctor_id: undefined,
        appointment_type: 'first_visit',
        status: 'scheduled',
        duration_minutes: 30,
        payment_status: isConversion && conversionData.paidInAdvance ? 'paid' : 'pending',
        start_date: prefilledStart || new Date(),
        start_time: prefilledStart ? format(prefilledStart, 'HH:mm') : '09:00',
        title: '',
        contact_id: isConversion ? conversionData.contactId! : '',
        notes: '',
        internal_notes: '',
        estimated_value: estimatedValueFormatted as any,
        paid_in_advance: isConversion ? conversionData.paidInAdvance || false : false,
      });
      // Marcar como inicializado após um pequeno delay para garantir que o reset foi aplicado
      setTimeout(() => setFormInitialized(true), 50);
    } else if (!open) {
      // Reset flag quando fechar o formulário
      setFormInitialized(false);
    }
  }, [appointment, open, prefilledStart, reset, conversionData]);

  const selectedContactId = watch('contact_id');
  const selectedType = watch('appointment_type');
  const selectedDoctorId = watch('doctor_id');

  // Para usuários que não podem agendar para outros (médicos), usar user.id como doctor_id
  const effectiveDoctorId = selectedDoctorId || (!canScheduleForOthers && user?.id) || null;

  // Filtrar procedimentos pelo médico selecionado ou pelo usuário atual (se médico)
  const filteredProcedures = procedures.filter(p => {
    // Se não tem médico efetivo, não mostrar procedimentos
    if (!effectiveDoctorId) return false;
    // Mostrar procedimentos do médico selecionado/atual
    return p.user_id === effectiveDoctorId;
  });

  // Handler para quando seleciona um procedimento
  const handleProcedureSelect = (procedureId: string) => {
    setSelectedProcedureId(procedureId);
    const procedure = procedures.find(p => p.id === procedureId);
    if (procedure) {
      setLinkedProcedure(procedure);
      // Preencher título
      setValue('title', procedure.name);
      // Preencher duração
      if (procedure.duration_minutes) {
        setValue('duration_minutes', procedure.duration_minutes);
      }
      // Preencher valor estimado
      if (procedure.price) {
        const formattedPrice = formatCurrency(procedure.price);
        setEstimatedValueDisplay(formattedPrice);
        setValue('estimated_value', formattedPrice as any);
      }
      // Calcular valor do sinal
      const sinalPercentage = procedure.sinal_percentage || 30;
      const calculatedSinal = procedure.price * (sinalPercentage / 100);
      setSinalAmount(calculatedSinal);
      setSinalAmountDisplay(formatCurrency(calculatedSinal));
    }
  };

  // Buscar procedimento vinculado ao contato selecionado e preencher automaticamente
  // IMPORTANTE: Usamos refs para evitar loop infinito de re-renders
  useEffect(() => {
    // Evitar execução se já preencheu para este contato
    if (hasAutoFilledRef.current === selectedContactId) {
      return;
    }

    // Condições para pular preenchimento
    if (appointment || !selectedContactId || !open || isLoadingProcedures || isLoadingContacts) {
      return;
    }

    // Usar refs para acessar arrays sem causar re-render
    const currentContacts = contactsRef.current;
    const currentProcedures = proceduresRef.current;

    // Precisamos ter contatos e procedimentos carregados
    if (!currentContacts?.length || !currentProcedures?.length) {
      return;
    }

    // Marcar como preenchido para este contato ANTES de executar
    hasAutoFilledRef.current = selectedContactId;

    // Função async para buscar e preencher procedimento
    const fetchAndFillProcedure = async () => {
      // Buscar o contato completo na lista de contatos
      const selectedContact = currentContacts.find(c => c.id === selectedContactId);

      if (!selectedContact) {
        return;
      }

      // Extrair procedure_id de custom_fields
      let customFields: any = (selectedContact as any).custom_fields;

      // Se custom_fields for uma string, tentar fazer parse
      if (typeof customFields === 'string') {
        try {
          customFields = JSON.parse(customFields);
        } catch (e) {
          customFields = {};
        }
      }

      if (!customFields || (typeof customFields === 'object' && Object.keys(customFields).length === 0)) {
        customFields = {};
      }

      let procedureId = customFields?.procedure_id;

      // Se não encontrou no custom_fields, buscar no lead comercial convertido
      if (!procedureId) {
        try {
          const { data: allLeads, error: leadsError } = await supabase
            .from('commercial_leads' as any)
            .select('procedure_id, status, contact_id, name')
            .eq('contact_id', selectedContactId)
            .order('created_at', { ascending: false })
            .limit(10);

          if (!leadsError && allLeads && allLeads.length > 0) {
            const leadWithProcedure = allLeads.find((lead: any) => lead.procedure_id && lead.procedure_id !== null);

            if (leadWithProcedure) {
              procedureId = (leadWithProcedure as any).procedure_id;

              // Atualizar o custom_fields do contato para futuras buscas
              const updatedCustomFields = { ...customFields, procedure_id: procedureId };
              await supabase
                .from('crm_contacts')
                .update({ custom_fields: updatedCustomFields } as any)
                .eq('id', selectedContactId);
            } else {
              return;
            }
          } else {
            return;
          }
        } catch (error) {
          return;
        }
      }

      // Buscar o procedimento correspondente se houver procedureId
      let linkedProcedure: any = null;
      if (procedureId) {
        linkedProcedure = currentProcedures?.find(p => p.id === procedureId);
      }

      // Se não encontrou procedimento mas contato tem service_value, usar esse valor
      if (!linkedProcedure && (selectedContact as any).service_value) {
        const serviceValue = (selectedContact as any).service_value;
        const currentEstimatedValue = watch('estimated_value');

        // Preencher valor estimado se estiver vazio
        if (!currentEstimatedValue || currentEstimatedValue === '' as any) {
          const formattedPrice = formatCurrency(serviceValue);
          setEstimatedValueDisplay(formattedPrice);
          setValue('estimated_value', formattedPrice as any);
        }

        // Preencher título se estiver vazio
        const currentTitle = watch('title');
        if (!currentTitle || currentTitle.trim() === '') {
          // Verificar se é consulta baseado no service ou custom_fields
          const service = (selectedContact as any).service;
          if (service === 'CONSULTA' || customFields?.service === 'CONSULTA') {
            setValue('title', 'CONSULTA');
          } else {
            setValue('title', service || 'Consulta');
          }
        }

        return; // Não precisa continuar se não tem procedimento vinculado
      }

      if (!linkedProcedure) {
        return;
      }

      // Preencher automaticamente os campos do formulário
      // Usar getValues() para verificar valores atuais sem causar re-render
      const form = { setValue, getValues: () => ({ title: watch('title'), duration_minutes: watch('duration_minutes') }) };
      const currentTitle = form.getValues().title;
      const currentDuration = form.getValues().duration_minutes;

      // Preencher título se estiver vazio
      if (!currentTitle || currentTitle.trim() === '') {
        setValue('title', linkedProcedure.name);
      }

      // Preencher duração se for o valor padrão (30 minutos)
      if (!currentDuration || currentDuration === 30) {
        setValue('duration_minutes', linkedProcedure.duration_minutes);
      }

      // Preencher valor estimado
      const formattedPrice = formatCurrency(linkedProcedure.price);
      setEstimatedValueDisplay(formattedPrice);
      setValue('estimated_value', formattedPrice as any);

      // Armazenar o procedimento vinculado para cálculo do sinal
      setLinkedProcedure(linkedProcedure);

      // Calcular valor do sinal automaticamente
      const sinalPercentage = linkedProcedure.sinal_percentage || 30;
      const calculatedSinal = linkedProcedure.price * (sinalPercentage / 100);
      setSinalAmount(calculatedSinal);
      setSinalAmountDisplay(formatCurrency(calculatedSinal));
    };

    // Pequeno delay para garantir que o reset já foi executado
    const timeoutId = setTimeout(() => {
      fetchAndFillProcedure();
    }, 100);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedContactId, appointment, open, isLoadingProcedures, isLoadingContacts]);
  // NOTA: setValue, watch e setEstimatedValueDisplay são funções estáveis do react-hook-form
  // mas não devem estar nas dependências para evitar loop infinito de re-renders

  // Filtrar contatos pela busca do usuário
  // NOTA: Ordenação alfabética já é feita no backend. Aqui filtramos por texto de busca.
  const filteredContacts = React.useMemo(() => {
    if (!patientSearchTerm.trim()) {
      return contacts;
    }
    const searchLower = patientSearchTerm.toLowerCase().trim();
    return contacts.filter(contact => {
      const name = (contact.full_name || '').toLowerCase();
      const phone = (contact.phone || '').toLowerCase();
      const email = (contact.email || '').toLowerCase();
      return name.includes(searchLower) || phone.includes(searchLower) || email.includes(searchLower);
    });
  }, [contacts, patientSearchTerm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {appointment ? 'Editar Consulta' : 'Nova Consulta'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Availability Error Alert */}
          {availabilityError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Horário Indisponível</AlertTitle>
              <AlertDescription>{availabilityError}</AlertDescription>
            </Alert>
          )}

          {/* Patient Selection */}
          <div className="space-y-2">
            <Label htmlFor="contact_id">Paciente *</Label>
            <Select
              value={watch('contact_id') || ''}
              onValueChange={(value) => {
                setValue('contact_id', value);
                // Limpar campos quando mudar o contato (para permitir novo preenchimento)
                if (!appointment) {
                  setValue('title', '');
                  setEstimatedValueDisplay('');
                  setValue('estimated_value', '' as any);
                  // Reset da flag para permitir novo preenchimento automático
                  hasAutoFilledRef.current = null;
                }
                setFormInitialized(true);
              }}
              disabled={isLoadingContacts || !user?.id}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  !user?.id
                    ? "Aguardando autenticação..."
                    : isLoadingContacts
                      ? "Carregando pacientes..."
                      : "Selecione o paciente"
                } />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-hidden">
                {/* Campo de busca de pacientes - fixo no topo */}
                <div className="p-2 border-b bg-background sticky top-0 z-50 -mt-1 pt-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome, telefone ou email..."
                      value={patientSearchTerm}
                      onChange={(e) => setPatientSearchTerm(e.target.value)}
                      className="pl-8 h-9"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                <div className="overflow-y-auto max-h-[220px]">
                  {!user?.id ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      Aguardando autenticação...
                    </div>
                  ) : isLoadingContacts ? (
                    <div className="p-2 text-sm text-muted-foreground flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando pacientes...
                    </div>
                  ) : filteredContacts.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      {patientSearchTerm ?
                        `Nenhum paciente encontrado para "${patientSearchTerm}".` :
                        'Nenhum paciente cadastrado. Clique em "Cadastrar novo paciente" para adicionar.'
                      }
                    </div>
                  ) : (
                    filteredContacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{contact.full_name || 'Sem nome'}</span>
                          <span className="text-xs text-muted-foreground">
                            {contact.phone || ''} {contact.email && `• ${contact.email}`}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </div>
              </SelectContent>
            </Select>
            {errors.contact_id && (
              <p className="text-sm text-destructive">{errors.contact_id.message}</p>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowNewContactForm(true)}
              className="w-full"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Cadastrar novo paciente
            </Button>
          </div>

          {/* Doctor Selection - Only show for users who can schedule for others */}
          {canScheduleForOthers && (
            <div className="space-y-2">
              <Label htmlFor="doctor_id">Medico Responsavel *</Label>
              <Select
                value={watch('doctor_id') || ''}
                onValueChange={(value) => setValue('doctor_id', value)}
                disabled={isLoadingDoctors}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    isLoadingDoctors
                      ? "Carregando medicos..."
                      : "Selecione o medico"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingDoctors ? (
                    <div className="p-2 text-sm text-muted-foreground flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando medicos...
                    </div>
                  ) : doctors.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      Nenhum medico encontrado.
                    </div>
                  ) : (
                    doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{doctor.full_name || 'Sem nome'}</span>
                          <span className="text-xs text-muted-foreground">{doctor.email}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.doctor_id && (
                <p className="text-sm text-destructive">{errors.doctor_id.message}</p>
              )}
            </div>
          )}

          {/* Appointment Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appointment_type">Tipo de Consulta *</Label>
              <Select
                value={watch('appointment_type')}
                onValueChange={(value) => setValue('appointment_type', value as AppointmentType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(APPOINTMENT_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {appointment && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={watch('status')}
                  onValueChange={(value) => setValue('status', value as AppointmentStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(APPOINTMENT_STATUS_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Procedure Selection - Only show when type is 'procedure' and doctor is selected */}
          {selectedType === 'procedure' && effectiveDoctorId && (
            <div className="space-y-2">
              <Label htmlFor="procedure_id">Procedimento *</Label>
              <Select
                value={selectedProcedureId || ''}
                onValueChange={handleProcedureSelect}
                disabled={isLoadingProcedures}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    isLoadingProcedures
                      ? "Carregando procedimentos..."
                      : filteredProcedures.length === 0
                        ? "Nenhum procedimento cadastrado para este médico"
                        : "Selecione o procedimento"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingProcedures ? (
                    <div className="p-2 text-sm text-muted-foreground flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando procedimentos...
                    </div>
                  ) : filteredProcedures.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      Nenhum procedimento cadastrado para este médico.
                    </div>
                  ) : (
                    filteredProcedures.map((procedure) => (
                      <SelectItem key={procedure.id} value={procedure.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{procedure.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatCurrency(procedure.price)} • {procedure.duration_minutes} min
                            {procedure.sinal_percentage > 0 && ` • Sinal: ${procedure.sinal_percentage}%`}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedType === 'procedure' && !effectiveDoctorId && (
                <p className="text-sm text-amber-600">Selecione um médico primeiro</p>
              )}
            </div>
          )}

          {/* Stock Usage Selector - Only for Procedures */}
          {selectedType === 'procedure' && (
            <StockUsageSelector
              value={stockUsage}
              onChange={setStockUsage}
            />
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Ex: Consulta de retorno - João Silva"
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Date, Time, Duration */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Data *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !watch('start_date') && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {watch('start_date') ? (() => {
                      try {
                        return format(watch('start_date'), 'PPP', locale ? { locale } : undefined);
                      } catch (e) {
                        // Fallback if ptBR is not available
                        return format(watch('start_date'), 'PPP');
                      }
                    })() : 'Selecione'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={watch('start_date')}
                    onSelect={(date) => date && setValue('start_date', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_time">Horário *</Label>
              <Select
                value={watch('start_time')}
                onValueChange={(value) => setValue('start_time', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration_minutes">Duração</Label>
              <Select
                value={watch('duration_minutes')?.toString()}
                onValueChange={(value) => setValue('duration_minutes', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Observações da consulta..."
              rows={3}
            />
          </div>

          {/* Internal Notes */}
          <div className="space-y-2">
            <Label htmlFor="internal_notes">Notas Internas</Label>
            <Textarea
              id="internal_notes"
              {...register('internal_notes')}
              placeholder="Notas privadas (não visíveis ao paciente)..."
              rows={2}
            />
          </div>

          {/* Financial Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimated_value">Valor Estimado</Label>
              <Input
                id="estimated_value"
                type="text"
                inputMode="decimal"
                value={estimatedValueDisplay}
                onChange={(e) => {
                  const formatted = formatCurrencyInput(e.target.value);
                  setEstimatedValueDisplay(formatted);
                  setValue('estimated_value', formatted as any);
                }}
                placeholder="R$ 0,00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_status">Status de Pagamento</Label>
              <Select
                value={watch('payment_status')}
                onValueChange={(value) => setValue('payment_status', value as PaymentStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Aviso de conta bancária obrigatória */}
          {watch('payment_status') === 'paid' && !hasActiveAccount && !isLoadingAccounts && (
            <Alert variant="destructive" className="border-red-500 bg-red-50 dark:bg-red-950/50">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Conta Bancária Obrigatória</AlertTitle>
              <AlertDescription>
                Para marcar consultas como "Pago", você precisa primeiro cadastrar uma conta bancária no módulo Financeiro.
                Sem uma conta ativa, a transação financeira não será registrada e você poderá perder o controle dos recebimentos.
                <br />
                <a href="/financeiro" className="text-primary underline font-medium hover:text-primary/80">
                  Ir para Financeiro → Cadastrar Conta
                </a>
              </AlertDescription>
            </Alert>
          )}

          {/* Seção de Sinal (Entrada/Depósito) - Sempre visível */}
          <div className="space-y-3 border-t pt-4 mt-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 -mx-6 px-6 py-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold flex items-center gap-2">
                <span className="text-yellow-600 dark:text-yellow-400">Sinal (Entrada)</span>
              </Label>
            </div>

            {/* Campo editável para valor do sinal */}
            <div className="space-y-2">
              <Label htmlFor="sinal_amount" className="text-sm">Valor do Sinal</Label>
              <Input
                id="sinal_amount"
                type="text"
                inputMode="decimal"
                value={sinalAmountDisplay}
                disabled={hasNoSinal}
                onChange={(e) => {
                  const formatted = formatCurrencyInput(e.target.value);
                  setSinalAmountDisplay(formatted);
                  setSinalAmount(parseCurrencyToNumber(formatted));
                }}
                placeholder="R$ 0,00"
                className="max-w-[200px]"
              />
              {linkedProcedure && !hasNoSinal && (
                <p className="text-xs text-muted-foreground">
                  Sugestão: {linkedProcedure.sinal_percentage || 30}% do procedimento = {formatCurrency((linkedProcedure.price || 0) * ((linkedProcedure.sinal_percentage || 30) / 100))}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="sinal_paid"
                  checked={sinalPaid}
                  disabled={hasNoSinal}
                  onCheckedChange={(checked) => {
                    setSinalPaid(!!checked);
                    if (checked) {
                      setHasNoSinal(false);
                    }
                  }}
                />
                <Label htmlFor="sinal_paid" className="cursor-pointer font-normal">
                  Sinal já foi pago
                </Label>
              </div>

              <div className="flex items-center gap-3">
                <Checkbox
                  id="has_no_sinal"
                  checked={hasNoSinal}
                  onCheckedChange={(checked) => {
                    setHasNoSinal(!!checked);
                    if (checked) {
                      setSinalPaid(false);
                      setSinalFile(null);
                      setSinalAmount(null);
                      setSinalAmountDisplay('');
                    }
                  }}
                />
                <Label htmlFor="has_no_sinal" className="cursor-pointer font-normal text-muted-foreground">
                  Não tem sinal
                </Label>
              </div>
            </div>

            {sinalPaid && !hasNoSinal && (
              <div className="space-y-2 pl-7">
                <Label htmlFor="sinal_receipt" className="text-sm">Comprovante de Pagamento</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={async (e) => {
                      const file = e.target.files?.[0] || null;
                      setSinalFile(file);
                      if (file && appointment?.id) {
                        const url = await uploadReceipt(file, appointment.id);
                        setSinalReceiptUrl(url);
                      }
                    }}
                    className="flex-1"
                  />
                  {(sinalFile || sinalReceiptUrl) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSinalFile(null);
                        setSinalReceiptUrl(null);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {(sinalFile || sinalReceiptUrl) && (
                  <div className="flex flex-col gap-1">
                    <p className={cn(
                      "text-xs flex items-center gap-1.5",
                      sinalReceiptUrl ? "text-green-600" : "text-amber-600"
                    )}>
                      {isUploading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : sinalReceiptUrl ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <Upload className="h-3 w-3" />
                      )}
                      <span className="truncate max-w-[200px]">{sinalFile?.name || 'Comprovante carregado'}</span>
                      • {isUploading ? "Enviando..." : sinalReceiptUrl ? "Upload concluído" : "Pronto para enviar"}
                    </p>
                    {sinalReceiptUrl && (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs text-blue-500"
                          onClick={() => window.open(sinalReceiptUrl, '_blank')}
                        >
                          <Eye className="h-3 w-3 mr-1" /> Visualizar
                        </Button>
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs text-green-500"
                          onClick={async () => {
                            try {
                              const response = await fetch(sinalReceiptUrl);
                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `comprovante-sinal.pdf`;
                              document.body.appendChild(a);
                              a.click();
                              window.URL.revokeObjectURL(url);
                              document.body.removeChild(a);
                            } catch (error) {
                              console.error('Erro ao baixar comprovante:', error);
                            }
                          }}
                        >
                          <Download className="h-3 w-3 mr-1" /> Baixar
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Formatos aceitos: JPG, PNG, PDF (máx. 5MB)
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {appointment ? 'Salvar Alterações' : 'Agendar Consulta'}
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Contact Form Modal */}
      {showNewContactForm && (
        <ContactForm
          forceOpen={true}
          onContactCreated={async (contactId) => {
            // Invalidar a lista de contatos para garantir que o novo paciente apareça
            queryClient.invalidateQueries({ queryKey: ['crm-contacts', user?.id] });
            setValue('contact_id', contactId);
            setShowNewContactForm(false);
          }}
          onCancel={() => setShowNewContactForm(false)}
          onSuccess={() => {
            // Invalidar a lista de contatos
            queryClient.invalidateQueries({ queryKey: ['crm-contacts', user?.id] });
            setShowNewContactForm(false);
          }}
        />
      )}
    </Dialog>
  );
}
