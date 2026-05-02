import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useMedicalAppointments } from '@/hooks/useMedicalAppointments';
import { useGeneralMeetings } from '@/hooks/useGeneralMeetings';
import { useToast } from '@/hooks/use-toast';
import { AppointmentForm } from '@/components/medical-calendar/AppointmentForm';
import { AppointmentDetailsModal } from '@/components/medical-calendar/AppointmentDetailsModal';
import { MeetingDetailsModal } from '@/components/medical-calendar/MeetingDetailsModal';
import { MeetingActionModal, MeetingActionType } from '@/components/medical-calendar/MeetingActionModal';
import { FinancialRequirementModal } from '@/components/financial/FinancialRequirementModal';
import { useFinancialAccounts } from '@/hooks/useFinancialAccounts';
import { MeetingForm } from '@/components/medical-calendar/MeetingForm';
import { MedicalRecordModal } from '@/components/medical-records/MedicalRecordModal';
import { MonthlyCalendarView } from '@/components/medical-calendar/MonthlyCalendarView';
import { DailyAppointmentsList } from '@/components/medical-calendar/DailyAppointmentsList';
import { TimeGridView } from '@/components/medical-calendar/TimeGridView';
import { AppointmentMetrics } from '@/components/medical-calendar/AppointmentMetrics';
import { AttendanceChecklist } from '@/components/medical-calendar/AttendanceChecklist';
import { PaymentConfirmationModal } from '@/components/medical-calendar/PaymentConfirmationModal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MedicalCalendarPageSkeleton } from '@/components/ui/LoadingSkeletons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useDoctors } from '@/hooks/useDoctors';
import { MedicalAppointmentWithRelations, AppointmentType, AppointmentStatus, PaymentStatus } from '@/types/medicalAppointments';
import { GeneralMeeting } from '@/types/generalMeetings';
import { Calendar, Plus, CalendarDays, Clock, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { startOfMonth, endOfMonth } from 'date-fns';

type CalendarView = 'monthly' | 'daily-hours';

export default function MedicalCalendar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isMedico, isAdmin, isSecretaria } = useUserProfile();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('monthly');
  const [typeFilter, setTypeFilter] = useState<AppointmentType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | 'all'>('all');
  const [searchFilter, setSearchFilter] = useState<string>('all');
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [showMeetingDetails, setShowMeetingDetails] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<MedicalAppointmentWithRelations | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<GeneralMeeting | null>(null);
  const [prefilledDates, setPrefilledDates] = useState<{ start?: Date; end?: Date }>({});
  const [conversionData, setConversionData] = useState<{
    contactId?: string;
    appointmentValue?: number;
    paidInAdvance?: boolean;
  } | null>(null);

  // Medical Record Modal state
  const [showMedicalRecordModal, setShowMedicalRecordModal] = useState(false);
  const [recordContactId, setRecordContactId] = useState<string | null>(null);
  const [recordAppointmentId, setRecordAppointmentId] = useState<string | null>(null);
  const [recordContactName, setRecordContactName] = useState<string | undefined>(undefined);

  // Payment Confirmation Modal state
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [appointmentForPayment, setAppointmentForPayment] = useState<MedicalAppointmentWithRelations | null>(null);

  // Meeting Action Modal state (cancel/delete)
  const [showMeetingActionModal, setShowMeetingActionModal] = useState(false);
  const [meetingActionType, setMeetingActionType] = useState<'cancel' | 'delete'>('cancel');
  const [meetingForAction, setMeetingForAction] = useState<GeneralMeeting | null>(null);

  // State for Financial Requirement Modal
  const [showFinancialRequirement, setShowFinancialRequirement] = useState(false);
  const { accounts } = useFinancialAccounts();

  // Calcular range do mês para carregar consultas
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);

  // Fetch appointments with filters
  const filters = {
    startDate: monthStart,
    endDate: monthEnd,
    appointmentType: typeFilter,
    status: statusFilter,
    paymentStatus: paymentFilter,
    isSecretaria, // Secretária vê todos os agendamentos de todos os médicos
  };

  const {
    appointments,
    isLoading: isLoadingAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    markAsCompleted,
    markAsNoShow,
    cancelAppointment,
  } = useMedicalAppointments(filters);

  // Buscar lista de médicos
  const { doctors: allDoctors } = useDoctors();

  // Filtrar lista de médicos baseado no role do usuário
  // Médicos só podem ver a si mesmos, admin/dono/secretária veem todos
  const doctors = useMemo(() => {
    if (isMedico && !isAdmin && user?.id) {
      // Médico só vê a si mesmo
      return allDoctors.filter(doc => doc.id === user.id);
    }
    // Admin, dono e secretária veem todos
    return allDoctors;
  }, [allDoctors, isMedico, isAdmin, user?.id]);

  // Extrair lista única de pacientes das consultas
  const uniquePatients = useMemo(() => {
    const patientsMap = new Map<string, { id: string; name: string }>();
    appointments.forEach((apt) => {
      if (apt.contact && apt.contact_id) {
        if (!patientsMap.has(apt.contact_id)) {
          patientsMap.set(apt.contact_id, {
            id: apt.contact_id,
            name: apt.contact.full_name || 'Sem nome',
          });
        }
      }
    });
    return Array.from(patientsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [appointments]);

  // Filtrar consultas baseado no searchFilter
  const filteredAppointments = useMemo(() => {
    if (searchFilter === 'all') {
      return appointments;
    }

    if (searchFilter.startsWith('doctor:')) {
      const doctorId = searchFilter.replace('doctor:', '');
      return appointments.filter((apt) => apt.doctor_id === doctorId);
    }

    if (searchFilter.startsWith('patient:')) {
      const contactId = searchFilter.replace('patient:', '');
      return appointments.filter((apt) => apt.contact_id === contactId);
    }

    return appointments;
  }, [appointments, searchFilter]);

  // Determinar quais reuniões visualizar
  const meetingsViewAsUserIds = useMemo(() => {
    if (searchFilter.startsWith('doctor:')) {
      return [searchFilter.replace('doctor:', '')];
    }
    return undefined;
  }, [searchFilter]);

  const prefilledMeetingUserId = useMemo(() => {
    if (searchFilter.startsWith('doctor:')) {
      return searchFilter.replace('doctor:', '');
    }
    return undefined;
  }, [searchFilter]);

  // Buscar reuniões do mesmo período
  const {
    meetings,
    isLoading: isLoadingMeetings,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    markAsCompleted: markMeetingCompleted,
    cancelMeeting,
  } = useGeneralMeetings({
    startDate: monthStart,
    endDate: monthEnd,
    viewAsUserIds: meetingsViewAsUserIds,
  });

  const isLoading = isLoadingAppointments || isLoadingMeetings;

  // Loading skeleton moved to prevent hook errors
  // if (isLoading) {
  //   return <MedicalCalendarPageSkeleton />;
  // }

  // Detectar query params de conversão e abrir formulário
  useEffect(() => {
    const convertedFromDeal = searchParams.get('convertedFromDeal');
    if (convertedFromDeal) {
      const contactId = searchParams.get('contactId');
      const appointmentValue = searchParams.get('appointmentValue');
      const paidInAdvance = searchParams.get('paidInAdvance') === 'true';

      if (contactId && appointmentValue) {
        setConversionData({
          contactId,
          appointmentValue: parseFloat(appointmentValue),
          paidInAdvance,
        });
        setShowAppointmentForm(true);

        // Limpar query params
        setSearchParams({});
      }
    }
  }, [searchParams, setSearchParams]);

  // Detectar query param de status para aplicar filtro (ex: vindo do dashboard da secretaria)
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) {
      // Mapear valores de status validos
      const validStatuses: AppointmentStatus[] = ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'];
      if (validStatuses.includes(statusParam as AppointmentStatus)) {
        setStatusFilter(statusParam as AppointmentStatus);
        // Limpar o query param apos aplicar o filtro
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('status');
        setSearchParams(newParams);
      }
    }
  }, [searchParams, setSearchParams]);

  // Detectar query param openForm para abrir modal de nova consulta (ex: vindo do Dashboard)
  useEffect(() => {
    const openFormParam = searchParams.get('openForm');
    if (openFormParam === 'true') {
      setShowAppointmentForm(true);
      // Limpar o query param apos abrir o modal
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('openForm');
      setSearchParams(newParams);
    }
  }, [searchParams, setSearchParams]);

  // Handle date selection from calendar
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  // Handle event click (from appointment card)
  const handleAppointmentClick = (appointment: MedicalAppointmentWithRelations) => {
    setSelectedAppointment(appointment);
    setShowAppointmentDetails(true);
  };

  // Handle appointment form submit
  const handleAppointmentFormSubmit = async (data: any) => {
    // The AppointmentForm already calculates end_time, but if it's empty, calculate it
    if (!data.end_time && data.start_time && data.duration_minutes) {
      const startDateTime = new Date(data.start_time);
      const endDateTime = new Date(startDateTime.getTime() + data.duration_minutes * 60000);
      data.end_time = endDateTime.toISOString();
    }

    let result;
    if (selectedAppointment) {
      // Editing existing appointment
      result = await updateAppointment.mutateAsync({
        id: selectedAppointment.id,
        updates: data,
      });
    } else {
      // Creating new appointment
      result = await createAppointment.mutateAsync(data);
    }
    setShowAppointmentForm(false);
    setPrefilledDates({});
    setSelectedAppointment(null);
    return result;
  };

  // Handle appointment created - manual opening only (no auto-open)
  const handleAppointmentCreated = (appointment: MedicalAppointmentWithRelations) => {
    // Prontuário é aberto manualmente via botão "Ver Prontuário"
    // Não abre automaticamente
  };

  // Handle view medical record from appointment details
  const handleViewMedicalRecord = () => {
    if (selectedAppointment) {
      setRecordContactId(selectedAppointment.contact_id);
      setRecordAppointmentId(selectedAppointment.id);
      setRecordContactName(selectedAppointment.contact?.full_name);
      setShowAppointmentDetails(false);
      setShowMedicalRecordModal(true);
    }
  };

  // Handle meeting form submit
  const handleMeetingFormSubmit = async (data: any) => {
    if (selectedMeeting) {
      // Editing existing meeting
      await updateMeeting.mutateAsync({
        id: selectedMeeting.id,
        updates: data,
      });
    } else {
      // Creating new meeting
      await createMeeting.mutateAsync(data);
    }
    setShowMeetingForm(false);
    setPrefilledDates({});
    setSelectedMeeting(null);
  };

  // Handle actions from appointment card
  const handleEdit = (appointment: MedicalAppointmentWithRelations) => {
    setSelectedAppointment(appointment);
    setShowAppointmentDetails(false);
    setPrefilledDates({
      start: new Date(appointment.start_time),
      end: new Date(appointment.end_time),
    });
    setShowAppointmentForm(true);
  };

  const handleDelete = async (appointment: MedicalAppointmentWithRelations) => {
    if (confirm('Tem certeza que deseja excluir esta consulta?')) {
      await deleteAppointment.mutateAsync(appointment.id);
      setShowAppointmentDetails(false);
      setSelectedAppointment(null);
    }
  };

  const handleMarkCompleted = async (appointment: MedicalAppointmentWithRelations) => {
    // Verificar se existe conta bancária antes de prosseguir (exceto para secretárias que usam conta do médico)
    if (!isSecretaria && accounts && accounts.length === 0) {
      setShowFinancialRequirement(true);
      return;
    }

    // Usar o mesmo fluxo de confirmação de pagamento
    setAppointmentForPayment(appointment);
    setShowPaymentConfirmation(true);
  };

  const handleMarkAttended = async (appointment: MedicalAppointmentWithRelations) => {
    // Verificar se existe conta bancária antes de prosseguir (exceto para secretárias que usam conta do médico)
    if (!isSecretaria && accounts && accounts.length === 0) {
      setShowFinancialRequirement(true);
      return;
    }

    // Abrir modal de confirmação de pagamento antes de marcar como compareceu
    setAppointmentForPayment(appointment);
    setShowPaymentConfirmation(true);
  };

  const handlePaymentConfirmation = async (paid: boolean, procedureData?: { procedure: { id: string; name: string; price: number }; value: number }) => {
    if (!appointmentForPayment) return;

    try {
      // Marcar como completado com confirmação de pagamento e procedimento opcional
      await markAsCompleted.mutateAsync({
        id: appointmentForPayment.id,
        confirmedPayment: paid,
        procedureData: procedureData ? { name: procedureData.procedure.name, value: procedureData.value } : undefined,
      });

      // Fechar modal
      setShowPaymentConfirmation(false);
      setAppointmentForPayment(null);

      // Se for médico ou admin, redirecionar para o prontuário do paciente
      if ((isMedico || isAdmin) && appointmentForPayment.contact_id) {
        navigate(`/prontuarios?patientId=${appointmentForPayment.contact_id}&tab=historico`);
      }
    } catch (error) {
      console.error('Erro ao marcar consulta como compareceu:', error);
    }
  };

  const handleMarkNoShow = async (appointment: MedicalAppointmentWithRelations) => {
    await markAsNoShow.mutateAsync(appointment.id);
  };

  const handleCancel = async (appointment: MedicalAppointmentWithRelations) => {
    const reason = prompt('Motivo do cancelamento:');
    if (reason) {
      await cancelAppointment.mutateAsync({ id: appointment.id, reason });
      setShowAppointmentDetails(false);
      setSelectedAppointment(null);
    }
  };

  // Handle meeting actions
  const handleMeetingClick = (meeting: GeneralMeeting) => {
    setSelectedMeeting(meeting);
    setShowMeetingDetails(true);
  };

  const handleMeetingEdit = (meeting: GeneralMeeting) => {
    setSelectedMeeting(meeting);
    setPrefilledDates({
      start: new Date(meeting.start_time),
      end: new Date(meeting.end_time),
    });
    setShowMeetingDetails(false);
    setShowMeetingForm(true);
  };

  const handleMeetingDelete = (meeting: GeneralMeeting) => {
    setMeetingForAction(meeting);
    setMeetingActionType('delete');
    setShowMeetingActionModal(true);
  };

  const handleMeetingCompleted = async (meeting: GeneralMeeting) => {
    await markMeetingCompleted.mutateAsync(meeting.id);
    setShowMeetingDetails(false);
    setSelectedMeeting(null);
  };

  const handleMeetingCancel = (meeting: GeneralMeeting) => {
    setMeetingForAction(meeting);
    setMeetingActionType('cancel');
    setShowMeetingActionModal(true);
  };

  // Handler para confirmar ação do modal
  const handleMeetingActionConfirm = async (reason?: string) => {
    if (!meetingForAction) return;

    try {
      if (meetingActionType === 'delete') {
        await deleteMeeting.mutateAsync(meetingForAction.id);
        toast({
          title: 'Reunião excluída',
          description: 'A reunião foi excluída com sucesso.',
        });
      } else {
        await cancelMeeting.mutateAsync(meetingForAction.id);
        toast({
          title: 'Reunião cancelada',
          description: reason ? `Motivo: ${reason}` : 'A reunião foi cancelada.',
        });
      }
      setShowMeetingActionModal(false);
      setMeetingForAction(null);
      setShowMeetingDetails(false);
      setSelectedMeeting(null);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível completar a ação.',
        variant: 'destructive',
      });
    }
  };

  // Handle meeting details modal actions
  const handleMeetingDetailsEdit = () => {
    if (selectedMeeting) {
      handleMeetingEdit(selectedMeeting);
    }
  };

  const handleMeetingDetailsDelete = () => {
    if (selectedMeeting) {
      handleMeetingDelete(selectedMeeting);
    }
  };

  const handleMeetingDetailsCompleted = async () => {
    if (selectedMeeting) {
      await handleMeetingCompleted(selectedMeeting);
    }
  };

  const handleMeetingDetailsCancel = () => {
    if (selectedMeeting) {
      handleMeetingCancel(selectedMeeting);
    }
  };

  const handleTimeSlotClick = (startTime: Date, endTime: Date) => {
    setPrefilledDates({ start: startTime, end: endTime });
    // Por padrão, abrir formulário de consulta
    setShowAppointmentForm(true);
  };

  // Handle actions from appointment details modal
  const handleDetailsEdit = () => {
    if (selectedAppointment) {
      setShowAppointmentDetails(false);
      setPrefilledDates({
        start: new Date(selectedAppointment.start_time),
        end: new Date(selectedAppointment.end_time),
      });
      setShowAppointmentForm(true);
    }
  };

  const handleDetailsDelete = async () => {
    if (selectedAppointment && confirm('Tem certeza que deseja excluir esta consulta?')) {
      await deleteAppointment.mutateAsync(selectedAppointment.id);
      setShowAppointmentDetails(false);
      setSelectedAppointment(null);
    }
  };

  const handleDetailsMarkCompleted = async () => {
    if (selectedAppointment) {
      if (!isSecretaria && accounts && accounts.length === 0) {
        setShowFinancialRequirement(true);
        return;
      }
      // Fechar modal de detalhes e abrir modal de confirmação de pagamento
      setShowAppointmentDetails(false);
      setAppointmentForPayment(selectedAppointment);
      setShowPaymentConfirmation(true);
    }
  };

  const handleDetailsMarkNoShow = async () => {
    if (selectedAppointment) {
      await markAsNoShow.mutateAsync(selectedAppointment.id);
      setShowAppointmentDetails(false);
      setSelectedAppointment(null);
    }
  };

  const handleDetailsCancel = async () => {
    if (selectedAppointment) {
      const reason = prompt('Motivo do cancelamento:');
      if (reason) {
        await cancelAppointment.mutateAsync({ id: selectedAppointment.id, reason });
        setShowAppointmentDetails(false);
        setSelectedAppointment(null);
      }
    }
  };

  if (isLoading) {
    return <MedicalCalendarPageSkeleton />;
  }

  return (
    <div className="min-h-screen space-y-3 sm:space-y-4 bg-background pb-20 px-1 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10">
            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-card-foreground">Agenda Médica</h1>
            <p className="text-muted-foreground text-[11px] sm:text-sm">Sistema de Agendamento</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            onClick={() => setShowAppointmentForm(true)}
            size="default"
            className="flex-1 sm:flex-none h-9 sm:h-11 text-xs sm:text-sm bg-primary hover:bg-primary/90 active:bg-primary/80"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
            Nova Consulta
          </Button>
          <Button
            onClick={() => setShowMeetingForm(true)}
            size="default"
            variant="outline"
            className="flex-1 sm:flex-none h-9 sm:h-11 text-xs sm:text-sm active:bg-muted"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Nova </span>Reunião
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <AppointmentMetrics appointments={filteredAppointments} meetings={meetings} />

      {/* Filters + View Toggle */}
      <Card className="p-3 sm:p-4">
        {/* Header: Filters title + View toggle */}
        <div className="flex items-center justify-between mb-2.5 sm:mb-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <SlidersHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            <span className="text-xs sm:text-sm font-semibold text-muted-foreground">Filtros</span>
          </div>
          <div className="flex items-center rounded-lg bg-muted/50 p-0.5">
            <Button
              variant={view === 'monthly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('monthly')}
              className={cn("h-7 px-3 text-xs rounded-md gap-1.5", view !== 'monthly' && "text-muted-foreground")}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Mensal
            </Button>
            <Button
              variant={view === 'daily-hours' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('daily-hours')}
              className={cn("h-7 px-3 text-xs rounded-md gap-1.5", view !== 'daily-hours' && "text-muted-foreground")}
            >
              <Clock className="h-3.5 w-3.5" />
              Diário
            </Button>
          </div>
        </div>

        {/* Filter grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Médico</Label>
            <Select
              value={searchFilter.startsWith('doctor:') ? searchFilter : 'all'}
              onValueChange={(value) => {
                if (value === 'all') {
                  // Se limpar médico, manter filtro de paciente se houver
                  if (!searchFilter.startsWith('patient:')) {
                    setSearchFilter('all');
                  }
                } else {
                  setSearchFilter(value);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os Médicos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Médicos</SelectItem>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={`doctor:${doctor.id}`}>
                    {doctor.full_name?.startsWith('Dr') ? doctor.full_name : `Dr(a). ${doctor.full_name}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Paciente</Label>
            <Select
              value={searchFilter.startsWith('patient:') ? searchFilter : 'all'}
              onValueChange={(value) => {
                if (value === 'all') {
                  // Se limpar paciente, manter filtro de médico se houver
                  if (!searchFilter.startsWith('doctor:')) {
                    setSearchFilter('all');
                  }
                } else {
                  setSearchFilter(value);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os Pacientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Pacientes</SelectItem>
                {uniquePatients.map((patient) => (
                  <SelectItem key={patient.id} value={`patient:${patient.id}`}>
                    {patient.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Tipo de Consulta</Label>
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as AppointmentType | 'all')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="first_visit">Primeira Consulta</SelectItem>
                <SelectItem value="return">Retorno</SelectItem>
                <SelectItem value="procedure">Procedimento</SelectItem>
                <SelectItem value="urgent">Urgência</SelectItem>
                <SelectItem value="follow_up">Acompanhamento</SelectItem>
                <SelectItem value="exam">Exame</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Status</Label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as AppointmentStatus | 'all')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="scheduled">Agendado</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
                <SelectItem value="no_show">Não Compareceu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Pagamento</Label>
            <Select value={paymentFilter} onValueChange={(value) => setPaymentFilter(value as PaymentStatus | 'all')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="partial">Parcial</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Main Layout: Calendar + Appointments List */}
      {view === 'monthly' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
          {/* Calendar - Left Column */}
          <div className="lg:col-span-1 order-2 lg:order-1 space-y-3 sm:space-y-6">
            <MonthlyCalendarView
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              appointments={filteredAppointments}
              meetings={meetings}
            />

          </div>

          {/* Appointments List - Right Column */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <DailyAppointmentsList
              selectedDate={selectedDate}
              appointments={filteredAppointments}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onMarkCompleted={handleMarkCompleted}
              onCancel={handleCancel}
              onMarkAttended={handleMarkAttended}
              onMarkNoShow={handleMarkNoShow}
              canEdit={!isSecretaria}
            />
          </div>
        </div>
      ) : (
        /* Time Grid View */
        <TimeGridView
          selectedDate={selectedDate}
          appointments={filteredAppointments}
          meetings={meetings}
          onDateChange={setSelectedDate}
          onAppointmentClick={(appt) => {
            setSelectedAppointment(appt);
            setShowAppointmentDetails(true);
          }}
          onMeetingClick={handleMeetingClick}
          onMeetingCancel={handleMeetingCancel}
          onMeetingDelete={handleMeetingDelete}
          onMeetingCompleted={handleMeetingCompleted}
          onSlotClick={handleTimeSlotClick}
          onCreateAppointment={() => setShowAppointmentForm(true)}
          onCreateMeeting={() => setShowMeetingForm(true)}
        />
      )}

      {/* Attendance Checklist */}
      <AttendanceChecklist />

      {/* Payment Confirmation Modal */}
      <PaymentConfirmationModal
        open={showPaymentConfirmation}
        onOpenChange={(open) => {
          setShowPaymentConfirmation(open);
          if (!open) {
            setAppointmentForPayment(null);
          }
        }}
        appointment={appointmentForPayment}
        onConfirm={handlePaymentConfirmation}
        isProcessing={markAsCompleted.isPending}
      />

      {/* Modals */}
      <AppointmentForm
        open={showAppointmentForm}
        onOpenChange={(open) => {
          setShowAppointmentForm(open);
          if (!open) {
            setSelectedAppointment(null);
            setPrefilledDates({});
          }
        }}
        onSubmit={handleAppointmentFormSubmit}
        prefilledStart={prefilledDates.start}
        prefilledEnd={prefilledDates.end}
        appointment={selectedAppointment}
        conversionData={conversionData}
        onAppointmentCreated={handleAppointmentCreated}
      />

      <MeetingForm
        open={showMeetingForm}
        onOpenChange={(open) => {
          setShowMeetingForm(open);
          if (!open) {
            setSelectedMeeting(null);
            setPrefilledDates({});
          }
        }}
        onSubmit={handleMeetingFormSubmit}
        prefilledStart={prefilledDates.start}
        prefilledEnd={prefilledDates.end}
        prefilledUserId={prefilledMeetingUserId}
        meeting={selectedMeeting}
      />

      <AppointmentDetailsModal
        open={showAppointmentDetails}
        onOpenChange={setShowAppointmentDetails}
        appointment={selectedAppointment}
        onEdit={handleDetailsEdit}
        onDelete={handleDetailsDelete}
        onMarkCompleted={handleDetailsMarkCompleted}
        onMarkNoShow={handleDetailsMarkNoShow}
        onCancel={handleDetailsCancel}
        onViewMedicalRecord={handleViewMedicalRecord}
        canEdit={!isSecretaria}
      />

      <MeetingDetailsModal
        open={showMeetingDetails}
        onOpenChange={setShowMeetingDetails}
        meeting={selectedMeeting}
        onEdit={handleMeetingDetailsEdit}
        onDelete={handleMeetingDetailsDelete}
        onMarkCompleted={handleMeetingDetailsCompleted}
        onCancel={handleMeetingDetailsCancel}
      />

      <MeetingActionModal
        open={showMeetingActionModal}
        onOpenChange={setShowMeetingActionModal}
        meetingTitle={meetingForAction?.title || ''}
        actionType={meetingActionType}
        onConfirm={handleMeetingActionConfirm}
      />

      <MedicalRecordModal
        open={showMedicalRecordModal}
        onOpenChange={setShowMedicalRecordModal}
        contactId={recordContactId}
        appointmentId={recordAppointmentId}
        contactName={recordContactName}
      />

      <FinancialRequirementModal
        isOpen={showFinancialRequirement}
        onOpenChange={setShowFinancialRequirement}
      />
    </div>
  );
}
