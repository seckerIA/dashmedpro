import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMedicalAppointments } from '@/hooks/useMedicalAppointments';
import { FullCalendarView } from '@/components/medical-calendar/FullCalendarView';
import { CalendarToolbar } from '@/components/medical-calendar/CalendarToolbar';
import { AppointmentForm } from '@/components/medical-calendar/AppointmentForm';
import { AppointmentDetailsModal } from '@/components/medical-calendar/AppointmentDetailsModal';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MedicalAppointmentWithRelations, AppointmentType, AppointmentStatus, PaymentStatus } from '@/types/medicalAppointments';
import { CalendarCheck, DollarSign, Clock } from 'lucide-react';

export default function MedicalCalendar() {
  const { user } = useAuth();
  const [view, setView] = useState<'timeGridDay' | 'timeGridWeek' | 'dayGridMonth'>('timeGridWeek');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [typeFilter, setTypeFilter] = useState<AppointmentType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<MedicalAppointmentWithRelations | null>(null);
  const [prefilledDates, setPrefilledDates] = useState<{ start?: Date; end?: Date }>({});

  // Fetch appointments with filters
  const filters = {
    appointmentType: typeFilter,
    status: statusFilter,
    paymentStatus: paymentFilter,
  };

  const {
    appointments,
    todayAppointments,
    pendingPaymentsCount,
    isLoading,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    markAsCompleted,
    markAsNoShow,
    cancelAppointment,
  } = useMedicalAppointments(filters);

  // Handle navigation
  const handleNavigate = (action: 'prev' | 'next' | 'today') => {
    const newDate = new Date(currentDate);
    switch (action) {
      case 'prev':
        if (view === 'timeGridDay') {
          newDate.setDate(newDate.getDate() - 1);
        } else if (view === 'timeGridWeek') {
          newDate.setDate(newDate.getDate() - 7);
        } else {
          newDate.setMonth(newDate.getMonth() - 1);
        }
        break;
      case 'next':
        if (view === 'timeGridDay') {
          newDate.setDate(newDate.getDate() + 1);
        } else if (view === 'timeGridWeek') {
          newDate.setDate(newDate.getDate() + 7);
        } else {
          newDate.setMonth(newDate.getMonth() + 1);
        }
        break;
      case 'today':
        setCurrentDate(new Date());
        return;
    }
    setCurrentDate(newDate);
  };

  // Handle event click
  const handleEventClick = (appointment: MedicalAppointmentWithRelations) => {
    setSelectedAppointment(appointment);
    setShowDetails(true);
  };

  // Handle event drop (drag-and-drop)
  const handleEventDrop = async (appointmentId: string, newStart: Date, newEnd: Date) => {
    await updateAppointment.mutateAsync({
      id: appointmentId,
      updates: {
        start_time: newStart.toISOString(),
        end_time: newEnd.toISOString(),
        duration_minutes: Math.round((newEnd.getTime() - newStart.getTime()) / 60000),
      },
    });
  };

  // Handle date selection (click to create)
  const handleDateSelect = (start: Date, end: Date) => {
    setPrefilledDates({ start, end });
    setShowForm(true);
  };

  // Handle form submit
  const handleFormSubmit = async (data: any) => {
    await createAppointment.mutateAsync(data);
  };

  // Handle actions from details modal
  const handleMarkCompleted = async () => {
    if (selectedAppointment) {
      await markAsCompleted.mutateAsync(selectedAppointment.id);
      setShowDetails(false);
    }
  };

  const handleMarkNoShow = async () => {
    if (selectedAppointment) {
      await markAsNoShow.mutateAsync(selectedAppointment.id);
      setShowDetails(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (selectedAppointment) {
      const reason = prompt('Motivo do cancelamento:');
      if (reason) {
        await cancelAppointment.mutateAsync({ id: selectedAppointment.id, reason });
        setShowDetails(false);
      }
    }
  };

  const handleDeleteAppointment = async () => {
    if (selectedAppointment && confirm('Tem certeza que deseja excluir esta consulta?')) {
      await deleteAppointment.mutateAsync(selectedAppointment.id);
      setShowDetails(false);
    }
  };

  return (
    <div className="min-h-screen space-y-6 bg-background pb-20">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-full bg-primary/10">
            <CalendarCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total de Consultas</p>
            <p className="text-2xl font-bold">{appointments.length}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-full bg-blue-500/10">
            <Clock className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Consultas Hoje</p>
            <p className="text-2xl font-bold">{todayAppointments.length}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-full bg-yellow-500/10">
            <DollarSign className="h-6 w-6 text-yellow-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Pagamentos Pendentes</p>
            <p className="text-2xl font-bold">{pendingPaymentsCount}</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* Calendar Toolbar */}
      <CalendarToolbar
        currentDate={currentDate}
        view={view}
        onViewChange={setView}
        onNavigate={handleNavigate}
        onNewAppointment={() => setShowForm(true)}
      />

      {/* Calendar */}
      <FullCalendarView
        appointments={appointments}
        view={view}
        onEventClick={handleEventClick}
        onEventDrop={handleEventDrop}
        onDateSelect={handleDateSelect}
        isLoading={isLoading}
        currentDate={currentDate}
      />

      {/* Modals */}
      <AppointmentForm
        open={showForm}
        onOpenChange={setShowForm}
        onSubmit={handleFormSubmit}
        prefilledStart={prefilledDates.start}
        prefilledEnd={prefilledDates.end}
      />

      <AppointmentDetailsModal
        open={showDetails}
        onOpenChange={setShowDetails}
        appointment={selectedAppointment}
        onEdit={() => {
          setShowDetails(false);
          setShowForm(true);
        }}
        onDelete={handleDeleteAppointment}
        onMarkCompleted={handleMarkCompleted}
        onMarkNoShow={handleMarkNoShow}
        onCancel={handleCancelAppointment}
      />
    </div>
  );
}
