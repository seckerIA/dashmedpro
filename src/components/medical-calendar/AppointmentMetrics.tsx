import { Card, CardContent } from '@/components/ui/card';
import { CalendarCheck, Clock, CheckCircle2, Users, Calendar, Briefcase } from 'lucide-react';
import { MedicalAppointmentWithRelations } from '@/types/medicalAppointments';
import { GeneralMeeting } from '@/types/generalMeetings';
import { useMemo } from 'react';
import { isToday, parseISO } from 'date-fns';

interface AppointmentMetricsProps {
  appointments: MedicalAppointmentWithRelations[];
  meetings?: GeneralMeeting[];
}

export function AppointmentMetrics({ appointments, meetings = [] }: AppointmentMetricsProps) {
  const metrics = useMemo(() => {
    const totalAppointments = appointments.length;
    const scheduledAppointments = appointments.filter(a => a.status === 'scheduled').length;
    const completedAppointments = appointments.filter(a => a.status === 'completed').length;

    // Pacientes únicos hoje
    const todayAppointments = appointments.filter(appt => {
      try {
        const apptDate = parseISO(appt.start_time);
        return isToday(apptDate);
      } catch {
        return false;
      }
    });

    const uniquePatientsToday = new Set(
      todayAppointments.map(a => a.contact_id).filter(Boolean)
    ).size;

    // Métricas de reuniões
    const totalMeetings = meetings.length;
    const scheduledMeetings = meetings.filter(m => m.status === 'scheduled').length;
    const completedMeetings = meetings.filter(m => m.status === 'completed').length;
    const busyMeetings = meetings.filter(m => m.is_busy && m.status === 'scheduled').length;

    return {
      totalAppointments,
      scheduledAppointments,
      completedAppointments,
      patientsToday: uniquePatientsToday,
      totalMeetings,
      scheduledMeetings,
      completedMeetings,
      busyMeetings,
    };
  }, [appointments, meetings]);

  return (
    <div className="space-y-3">
      {/* Primary row: Consultation metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        {/* Total de Consultas */}
        <Card className="relative overflow-hidden group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-3 sm:p-5">
            <div className="flex items-start gap-2.5 sm:gap-4">
              <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 shrink-0">
                <CalendarCheck className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Consultas
                </p>
                <p className="text-xl sm:text-2xl font-bold text-foreground mt-0.5 sm:mt-1">{metrics.totalAppointments}</p>
              </div>
            </div>
          </CardContent>
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-primary/30 rounded-r-xl" />
        </Card>

        {/* Agendadas */}
        <Card className="relative overflow-hidden group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-3 sm:p-5">
            <div className="flex items-start gap-2.5 sm:gap-4">
              <div className="p-2 sm:p-2.5 rounded-xl bg-blue-500/10 shrink-0">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Agendadas
                </p>
                <p className="text-xl sm:text-2xl font-bold text-foreground mt-0.5 sm:mt-1">{metrics.scheduledAppointments}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 hidden sm:block">Pendentes</p>
              </div>
            </div>
          </CardContent>
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-blue-300/30 rounded-r-xl" />
        </Card>

        {/* Concluídas */}
        <Card className="relative overflow-hidden group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-3 sm:p-5">
            <div className="flex items-start gap-2.5 sm:gap-4">
              <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/10 shrink-0">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Concluídas
                </p>
                <p className="text-xl sm:text-2xl font-bold text-foreground mt-0.5 sm:mt-1">{metrics.completedAppointments}</p>
              </div>
            </div>
          </CardContent>
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-emerald-300/30 rounded-r-xl" />
        </Card>

        {/* Pacientes Hoje */}
        <Card className="relative overflow-hidden group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-3 sm:p-5">
            <div className="flex items-start gap-2.5 sm:gap-4">
              <div className="p-2 sm:p-2.5 rounded-xl bg-orange-500/10 shrink-0">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
                  Pac. Hoje
                </p>
                <p className="text-xl sm:text-2xl font-bold text-foreground mt-0.5 sm:mt-1">{metrics.patientsToday}</p>
              </div>
            </div>
          </CardContent>
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-orange-300/30 rounded-r-xl" />
        </Card>
      </div>

      {/* Compact meetings row */}
      {(metrics.totalMeetings > 0 || metrics.scheduledMeetings > 0 || metrics.completedMeetings > 0 || metrics.busyMeetings > 0) && (
        <Card className="p-2.5 sm:p-3 overflow-x-auto">
          <div className="flex items-center gap-3 sm:gap-4 md:gap-6 min-w-max sm:min-w-0 sm:flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reuniões</span>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-3.5 w-3.5 text-purple-500" />
              <span className="font-semibold">{metrics.totalMeetings}</span>
              <span className="text-muted-foreground text-xs">total</span>
            </div>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2 text-sm">
              <Briefcase className="h-3.5 w-3.5 text-indigo-500" />
              <span className="font-semibold">{metrics.scheduledMeetings}</span>
              <span className="text-muted-foreground text-xs">agendadas</span>
            </div>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-3.5 w-3.5 text-teal-500" />
              <span className="font-semibold">{metrics.completedMeetings}</span>
              <span className="text-muted-foreground text-xs">concluídas</span>
            </div>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-3.5 w-3.5 text-gray-500" />
              <span className="font-semibold">{metrics.busyMeetings}</span>
              <span className="text-muted-foreground text-xs">bloqueados</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
