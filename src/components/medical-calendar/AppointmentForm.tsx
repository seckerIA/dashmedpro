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
import { CalendarIcon, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Ensure ptBR is available (defensive check)
const locale = ptBR || undefined;
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { parseISO } from 'date-fns';
import { formatCurrencyInput, parseCurrencyToNumber, formatCurrency } from '@/lib/currency';

const appointmentSchema = z.object({
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
  onSubmit: (data: any) => Promise<void>;
  appointment?: MedicalAppointment | null;
  prefilledStart?: Date;
  prefilledEnd?: Date;
  conversionData?: {
    contactId?: string;
    appointmentValue?: number;
    paidInAdvance?: boolean;
  } | null;
}

export function AppointmentForm({
  open,
  onOpenChange,
  onSubmit,
  appointment,
  prefilledStart,
  prefilledEnd,
  conversionData,
}: AppointmentFormProps) {
  const { user } = useAuth();
  const { contacts, isLoadingContacts, refetchContacts } = useCRM();
  const { checkAvailability } = useAvailability();
  const { procedures, isLoading: isLoadingProcedures } = useCommercialProcedures();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [estimatedValueDisplay, setEstimatedValueDisplay] = useState<string>('');
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [showNewContactForm, setShowNewContactForm] = useState(false);
  const [formInitialized, setFormInitialized] = useState(false);

  // Invalidar cache quando o formulário abrir para garantir dados frescos
  // Mas não remover completamente para evitar problemas de carregamento
  useEffect(() => {
    if (open && user?.id && !isLoadingContacts) {
      console.log('🔄 AppointmentForm - Invalidando cache de contatos...');
      console.log('   User ID:', user.id);
      console.log('   Contacts array length:', contacts.length);
      
      // Apenas invalidar o cache, não remover completamente
      // Isso permite que os dados existentes sejam usados enquanto busca novos dados em background
      queryClient.invalidateQueries({ queryKey: ['crm-contacts', user.id] });
      
      // Se não há contatos carregados, forçar refetch
      if (contacts.length === 0 && refetchContacts) {
        console.log('🔄 AppointmentForm - Nenhum contato carregado, forçando refetch...');
        refetchContacts().catch((error) => {
          console.error('❌ AppointmentForm - Erro ao refetch contatos:', error);
        });
      }
    }
  }, [open, user?.id, queryClient, refetchContacts, isLoadingContacts, contacts.length]);

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

      const submitData = {
        user_id: user.id,
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
      };

      await onSubmit(submitData);
      setAvailabilityError(null);
      setEstimatedValueDisplay('');
      reset();
      onOpenChange(false);
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
    } else if (!appointment && open) {
      // Reset to defaults for new appointment
      const isConversion = conversionData && conversionData.contactId;
      const estimatedValueFormatted = isConversion && conversionData.appointmentValue
        ? formatCurrency(conversionData.appointmentValue)
        : '';
      
      setEstimatedValueDisplay(estimatedValueFormatted);
      reset({
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

  // Buscar procedimento vinculado ao contato selecionado e preencher automaticamente
  useEffect(() => {
    // Só executar se:
    // 1. Não estiver editando uma consulta existente
    // 2. Um contato foi selecionado
    // 3. O formulário está aberto
    // 4. Os procedimentos foram carregados
    // 5. Os contatos foram carregados
    if (appointment || !selectedContactId || !open || isLoadingProcedures || isLoadingContacts) {
      if (appointment) {
        console.log('⏭️ AppointmentForm - Pulando preenchimento automático: editando consulta existente');
      } else if (!selectedContactId) {
        console.log('⏭️ AppointmentForm - Pulando preenchimento automático: nenhum contato selecionado');
      } else if (!open) {
        console.log('⏭️ AppointmentForm - Pulando preenchimento automático: formulário fechado');
      } else if (isLoadingProcedures) {
        console.log('⏭️ AppointmentForm - Pulando preenchimento automático: carregando procedimentos...');
      } else if (isLoadingContacts) {
        console.log('⏭️ AppointmentForm - Pulando preenchimento automático: carregando contatos...');
      }
      return;
    }

    // Função async para buscar e preencher procedimento
    const fetchAndFillProcedure = async () => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppointmentForm.tsx:285',message:'Iniciando busca de procedimento',data:{selectedContactId,contactsLength:contacts.length,proceduresLength:procedures?.length||0},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      console.log('🔍 AppointmentForm - Iniciando busca de procedimento vinculado...');
      console.log('   Contato selecionado:', selectedContactId);
      console.log('   Total de contatos:', contacts.length);
      console.log('   Total de procedimentos:', procedures?.length || 0);

      // Buscar o contato completo na lista de contatos
      const selectedContact = contacts.find(c => c.id === selectedContactId);
      
      if (!selectedContact) {
        console.log('❌ AppointmentForm - Contato não encontrado na lista:', selectedContactId);
        console.log('   IDs disponíveis:', contacts.map(c => c.id).slice(0, 5));
        return;
      }

      console.log('✅ AppointmentForm - Contato encontrado:', {
        id: selectedContact.id,
        name: selectedContact.full_name,
        custom_fields: selectedContact.custom_fields,
        custom_fields_type: typeof selectedContact.custom_fields,
        custom_fields_is_null: selectedContact.custom_fields === null,
        custom_fields_is_undefined: selectedContact.custom_fields === undefined,
      });

      // Extrair procedure_id de custom_fields
      // custom_fields pode ser um objeto, string JSON, ou null/undefined
      let customFields: any = selectedContact.custom_fields;
      
      // Se custom_fields for uma string, tentar fazer parse
      if (typeof customFields === 'string') {
        try {
          customFields = JSON.parse(customFields);
          console.log('📦 AppointmentForm - custom_fields parseado de string:', customFields);
        } catch (e) {
          console.error('❌ AppointmentForm - Erro ao fazer parse de custom_fields:', e);
          customFields = {};
        }
      }
      
      // Se custom_fields for null ou undefined, usar objeto vazio
      if (!customFields || (typeof customFields === 'object' && Object.keys(customFields).length === 0)) {
        customFields = {};
      }
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppointmentForm.tsx:328',message:'custom_fields processado',data:{customFields,keys:Object.keys(customFields),procedureId:customFields?.procedure_id,procedureIdType:typeof customFields?.procedure_id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      console.log('🔍 AppointmentForm - custom_fields processado:', {
        customFields,
        keys: Object.keys(customFields),
        procedure_id: customFields?.procedure_id,
        procedure_id_type: typeof customFields?.procedure_id,
      });

      let procedureId = customFields?.procedure_id;
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppointmentForm.tsx:338',message:'Procedure ID extraído',data:{procedureId,hasProcedureId:!!procedureId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      // Se não encontrou no custom_fields, buscar no lead comercial convertido
      if (!procedureId) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppointmentForm.tsx:347',message:'procedure_id não encontrado em custom_fields, buscando no lead',data:{contactId:selectedContactId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        console.log('ℹ️ AppointmentForm - procedure_id não encontrado em custom_fields, buscando no lead comercial...');
        
        try {
          console.log('🔍 AppointmentForm - Buscando lead comercial com:', {
            contactId: selectedContactId,
            status: 'converted'
          });

          // Buscar TODOS os leads vinculados ao contato para encontrar algum com procedure_id
          const { data: allLeads, error: leadsError } = await supabase
            .from('commercial_leads' as any)
            .select('procedure_id, status, contact_id, name')
            .eq('contact_id', selectedContactId)
            .order('created_at', { ascending: false })
            .limit(10);

          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppointmentForm.tsx:365',message:'Todos os leads comerciais buscados',data:{allLeadsCount:allLeads?.length||0,leadsError,hasLeads:!!allLeads},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
          // #endregion

          console.log('📊 AppointmentForm - Todos os leads encontrados:', {
            count: allLeads?.length || 0,
            leads: allLeads?.map((l: any) => ({ 
              id: l.id,
              procedure_id: l.procedure_id, 
              status: l.status,
              name: l.name,
              estimated_value: l.estimated_value,
              notes: l.notes
            })),
            error: leadsError
          });
          
          // Log detalhado de cada lead
          if (allLeads && allLeads.length > 0) {
            allLeads.forEach((lead: any, index: number) => {
              console.log(`📋 Lead ${index + 1}:`, {
                id: lead.id,
                name: lead.name,
                procedure_id: lead.procedure_id,
                status: lead.status,
                estimated_value: lead.estimated_value,
                fullLead: lead
              });
            });
          }

          if (!leadsError && allLeads && allLeads.length > 0) {
            // Procurar o primeiro lead com procedure_id não nulo
            const leadWithProcedure = allLeads.find((lead: any) => lead.procedure_id && lead.procedure_id !== null);
            
            console.log('🔍 AppointmentForm - Lead com procedure_id encontrado:', leadWithProcedure);
            
            if (leadWithProcedure) {
              procedureId = (leadWithProcedure as any).procedure_id;
              console.log('✅ AppointmentForm - procedure_id encontrado no lead comercial:', procedureId);
              
              // Atualizar o custom_fields do contato para futuras buscas
              const updatedCustomFields = { ...customFields, procedure_id: procedureId };
              const updateResult = await supabase
                .from('crm_contacts')
                .update({ custom_fields: updatedCustomFields })
                .eq('id', selectedContactId);
              
              if (updateResult.error) {
                console.error('❌ AppointmentForm - Erro ao atualizar custom_fields:', updateResult.error);
              } else {
                console.log('💾 AppointmentForm - custom_fields atualizado no contato');
              }
            } else {
              console.log('⚠️ AppointmentForm - Nenhum lead encontrado com procedure_id');
              console.log('   Leads encontrados:', allLeads.length);
              console.log('   Todos os leads têm procedure_id null ou vazio');
              console.log('   Isso significa que os leads foram criados/convertidos sem procedimento associado');
              console.log('   Para novos leads, certifique-se de selecionar um procedimento ao criar o lead');
              return;
            }
          } else {
            console.log('ℹ️ AppointmentForm - Nenhum lead comercial encontrado');
            console.log('   Erro:', leadsError);
            console.log('   contactId usado:', selectedContactId);
            return;
          }
        } catch (error) {
          console.error('❌ AppointmentForm - Erro ao buscar lead comercial:', error);
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppointmentForm.tsx:410',message:'Erro ao buscar lead comercial',data:{error:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
          return;
        }
      }

      if (!procedureId) {
        return;
      }

      console.log('🔍 AppointmentForm - Procedure ID encontrado:', procedureId);

      // Buscar o procedimento correspondente
      const linkedProcedure = procedures?.find(p => p.id === procedureId);

      if (!linkedProcedure) {
        console.log('⚠️ AppointmentForm - Procedimento vinculado não encontrado:', procedureId);
        console.log('   IDs de procedimentos disponíveis:', procedures?.map(p => p.id).slice(0, 5));
        return;
      }

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppointmentForm.tsx:355',message:'Procedimento encontrado',data:{id:linkedProcedure.id,name:linkedProcedure.name,duration:linkedProcedure.duration_minutes,price:linkedProcedure.price},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      console.log('✅ AppointmentForm - Procedimento encontrado:', {
        id: linkedProcedure.id,
        name: linkedProcedure.name,
        duration: linkedProcedure.duration_minutes,
        price: linkedProcedure.price,
      });

      // Preencher automaticamente os campos do formulário
      // Sempre preencher quando um procedimento for encontrado (substituir valores padrão)
      const currentTitle = watch('title');
      const currentDuration = watch('duration_minutes');
      const currentEstimatedValueDisplay = estimatedValueDisplay;

      console.log('📝 AppointmentForm - Estado atual dos campos:', {
        title: currentTitle,
        duration: currentDuration,
        estimatedValue: currentEstimatedValueDisplay,
      });

      // Sempre preencher título (substituir se estiver vazio ou for valor padrão)
      const shouldUpdateTitle = !currentTitle || currentTitle.trim() === '';
      if (shouldUpdateTitle) {
        console.log('✏️ AppointmentForm - Preenchendo título:', linkedProcedure.name);
        setValue('title', linkedProcedure.name);
      } else {
        console.log('⏭️ AppointmentForm - Título já preenchido, mantendo:', currentTitle);
      }

      // Sempre preencher duração se for o valor padrão (30 minutos) ou se estiver vazio
      const shouldUpdateDuration = !currentDuration || currentDuration === 30;
      if (shouldUpdateDuration) {
        console.log('✏️ AppointmentForm - Preenchendo duração:', linkedProcedure.duration_minutes);
        setValue('duration_minutes', linkedProcedure.duration_minutes);
      } else {
        console.log('⏭️ AppointmentForm - Duração já preenchida, mantendo:', currentDuration);
      }

      // Sempre preencher valor estimado com o preço do procedimento (substituir qualquer valor anterior)
      // Isso garante que o valor correto do procedimento seja usado
      const formattedPrice = formatCurrency(linkedProcedure.price);
      console.log('✏️ AppointmentForm - Preenchendo valor estimado com preço do procedimento:', formattedPrice);
      setEstimatedValueDisplay(formattedPrice);
      setValue('estimated_value', formattedPrice as any);

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppointmentForm.tsx:399',message:'Preenchimento automático concluído',data:{title:linkedProcedure.name,duration:linkedProcedure.duration_minutes,price:linkedProcedure.price},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      console.log('✅ AppointmentForm - Preenchimento automático concluído!');
    };

    // Pequeno delay para garantir que o reset já foi executado
    const timeoutId = setTimeout(() => {
      fetchAndFillProcedure();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [selectedContactId, contacts, procedures, appointment, open, watch, setValue, estimatedValueDisplay, isLoadingProcedures, isLoadingContacts, setEstimatedValueDisplay]);

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
                console.log('👤 AppointmentForm - Contato selecionado manualmente:', value);
                setValue('contact_id', value);
                // Limpar campos quando mudar o contato (para permitir novo preenchimento)
                if (!appointment) {
                  setValue('title', '');
                  setEstimatedValueDisplay('');
                  setValue('estimated_value', '' as any);
                }
                // Forçar re-execução do useEffect de preenchimento
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
              <SelectContent>
                {!user?.id ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    Aguardando autenticação...
                  </div>
                ) : isLoadingContacts ? (
                  <div className="p-2 text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando pacientes...
                  </div>
                ) : contacts.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    Nenhum paciente cadastrado. Clique em "Cadastrar novo paciente" para adicionar.
                  </div>
                ) : (
                  contacts.map((contact) => {
                    console.log('📋 Rendering contact:', { id: contact.id, name: contact.full_name });
                    return (
                      <SelectItem key={contact.id} value={contact.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{contact.full_name || 'Sem nome'}</span>
                          <span className="text-xs text-muted-foreground">
                            {contact.phone || ''} {contact.email && `• ${contact.email}`}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })
                )}
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
          </div>

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
            // Invalidar e refetch a lista de contatos para garantir que o novo paciente apareça
            await queryClient.invalidateQueries({ queryKey: ['crm-contacts', user?.id] });
            await queryClient.refetchQueries({ queryKey: ['crm-contacts', user?.id] });
            setValue('contact_id', contactId);
            setShowNewContactForm(false);
          }}
          onCancel={() => setShowNewContactForm(false)}
          onSuccess={async () => {
            // Invalidar e refetch a lista de contatos
            await queryClient.invalidateQueries({ queryKey: ['crm-contacts', user?.id] });
            await queryClient.refetchQueries({ queryKey: ['crm-contacts', user?.id] });
            setShowNewContactForm(false);
          }}
        />
      )}
    </Dialog>
  );
}
