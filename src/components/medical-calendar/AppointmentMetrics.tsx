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
    <div className="space-y-4">
      {/* Primeira linha: Consultas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total de Consultas */}
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Total de Consultas
                </p>
                <p className="text-3xl font-bold text-primary">{metrics.totalAppointments}</p>
              </div>
              <div className="p-3 rounded-full bg-primary/20">
                <CalendarCheck className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agendadas */}
        <Card className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border-blue-500/20 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Consultas Agendadas
                </p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {metrics.scheduledAppointments}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Pendentes</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/20">
                <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Concluídas */}
        <Card className="bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent border-green-500/20 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Consultas Concluídas
                </p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {metrics.completedAppointments}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pacientes Hoje */}
        <Card className="bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent border-orange-500/20 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Pacientes Hoje
                </p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {metrics.patientsToday}
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-500/20">
                <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segunda linha: Reuniões */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total de Reuniões */}
        <Card className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border-purple-500/20 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Total de Reuniões
                </p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {metrics.totalMeetings}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-500/20">
                <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reuniões Agendadas */}
        <Card className="bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent border-indigo-500/20 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Reuniões Agendadas
                </p>
                <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                  {metrics.scheduledMeetings}
                </p>
              </div>
              <div className="p-3 rounded-full bg-indigo-500/20">
                <Briefcase className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reuniões Concluídas */}
        <Card className="bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-transparent border-teal-500/20 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Reuniões Concluídas
                </p>
                <p className="text-3xl font-bold text-teal-600 dark:text-teal-400">
                  {metrics.completedMeetings}
                </p>
              </div>
              <div className="p-3 rounded-full bg-teal-500/20">
                <CheckCircle2 className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Períodos Indisponíveis */}
        <Card className="bg-gradient-to-br from-gray-500/10 via-gray-500/5 to-transparent border-gray-500/20 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Períodos Indisponíveis
                </p>
                <p className="text-3xl font-bold text-gray-600 dark:text-gray-400">
                  {metrics.busyMeetings}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Bloqueados</p>
              </div>
              <div className="p-3 rounded-full bg-gray-500/20">
                <Clock className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

