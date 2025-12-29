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
import { MeetingForm } from '@/components/medical-calendar/MeetingForm';
import { MedicalRecordModal } from '@/components/medical-records/MedicalRecordModal';
import { MonthlyCalendarView } from '@/components/medical-calendar/MonthlyCalendarView';
import { DailyAppointmentsList } from '@/components/medical-calendar/DailyAppointmentsList';
import { TimeGridView } from '@/components/medical-calendar/TimeGridView';
import { AppointmentMetrics } from '@/components/medical-calendar/AppointmentMetrics';
import { AttendanceChecklist } from '@/components/medical-calendar/AttendanceChecklist';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useDoctors } from '@/hooks/useDoctors';
import { MedicalAppointmentWithRelations, AppointmentType, AppointmentStatus, PaymentStatus } from '@/types/medicalAppointments';
import { GeneralMeeting } from '@/types/generalMeetings';
import { Calendar, Plus, CalendarDays, Clock } from 'lucide-react';
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
  const { doctors } = useDoctors();

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
  });

  const isLoading = isLoadingAppointments || isLoadingMeetings;

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
    await markAsCompleted.mutateAsync(appointment.id);
    setShowAppointmentDetails(false);
    setSelectedAppointment(null);
  };

  const handleMarkAttended = async (appointment: MedicalAppointmentWithRelations) => {
    await markAsCompleted.mutateAsync(appointment.id);
    
    // Se for médico ou admin, redirecionar para o prontuário do paciente
    if ((isMedico || isAdmin) && appointment.contact_id) {
      navigate(`/prontuarios?patientId=${appointment.contact_id}&tab=historico`);
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

  const handleMeetingDelete = async (meeting: GeneralMeeting) => {
    if (confirm('Tem certeza que deseja excluir esta reunião?')) {
      await deleteMeeting.mutateAsync(meeting.id);
      setShowMeetingDetails(false);
      setSelectedMeeting(null);
    }
  };

  const handleMeetingCompleted = async (meeting: GeneralMeeting) => {
    await markMeetingCompleted.mutateAsync(meeting.id);
    setShowMeetingDetails(false);
    setSelectedMeeting(null);
  };

  const handleMeetingCancel = async (meeting: GeneralMeeting) => {
    const reason = prompt('Motivo do cancelamento (opcional):');
    if (reason !== null) { // User clicked OK (even if empty)
      await cancelMeeting.mutateAsync(meeting.id);
      setShowMeetingDetails(false);
      setSelectedMeeting(null);
    }
  };

  // Handle meeting details modal actions
  const handleMeetingDetailsEdit = () => {
    if (selectedMeeting) {
      handleMeetingEdit(selectedMeeting);
    }
  };

  const handleMeetingDetailsDelete = async () => {
    if (selectedMeeting) {
      await handleMeetingDelete(selectedMeeting);
    }
  };

  const handleMeetingDetailsCompleted = async () => {
    if (selectedMeeting) {
      await handleMeetingCompleted(selectedMeeting);
    }
  };

  const handleMeetingDetailsCancel = async () => {
    if (selectedMeeting) {
      await handleMeetingCancel(selectedMeeting);
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
      await markAsCompleted.mutateAsync(selectedAppointment.id);
      setShowAppointmentDetails(false);
      setSelectedAppointment(null);
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

  return (
    <div className="min-h-screen space-y-6 bg-background pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Calendar className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-card-foreground">Agenda Médica</h1>
            <p className="text-muted-foreground text-sm sm:text-lg">Sistema de Agendamento</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            onClick={() => setShowAppointmentForm(true)} 
            size="lg" 
            className="flex-1 sm:flex-none bg-primary hover:bg-primary/90"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nova Consulta
          </Button>
          <Button 
            onClick={() => setShowMeetingForm(true)} 
            size="lg" 
            variant="outline"
            className="flex-1 sm:flex-none"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nova Reunião
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <AppointmentMetrics appointments={filteredAppointments} meetings={meetings} />

      {/* View Toggle */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Visualização</Label>
          <div className="flex items-center gap-2">
            <Button
              variant={view === 'monthly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('monthly')}
              className="gap-2"
            >
              <CalendarDays className="h-4 w-4" />
              Mensal
            </Button>
            <Button
              variant={view === 'daily-hours' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('daily-hours')}
              className="gap-2"
            >
              <Clock className="h-4 w-4" />
              Diário em Horas
            </Button>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Médico / Paciente</Label>
            <Select value={searchFilter} onValueChange={setSearchFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {doctors.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>Médicos</SelectLabel>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={`doctor:${doctor.id}`}>
                        {doctor.full_name || doctor.email}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
                {uniquePatients.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>Pacientes</SelectLabel>
                    {uniquePatients.map((patient) => (
                      <SelectItem key={patient.id} value={`patient:${patient.id}`}>
                        {patient.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tipo de Consulta</Label>
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

          <div className="space-y-2">
            <Label>Status</Label>
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

          <div className="space-y-2">
            <Label>Pagamento</Label>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar - Left Column */}
          <div className="lg:col-span-1 order-2 lg:order-1 space-y-6">
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

      <MedicalRecordModal
        open={showMedicalRecordModal}
        onOpenChange={setShowMedicalRecordModal}
        contactId={recordContactId}
        appointmentId={recordAppointmentId}
        contactName={recordContactName}
      />
    </div>
  );
}
