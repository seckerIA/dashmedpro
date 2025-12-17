import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { MedicalAppointmentWithRelations } from '@/types/medicalAppointments';
import { GeneralMeeting } from '@/types/generalMeetings';
import { parseISO } from 'date-fns';

interface MonthlyCalendarViewProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  appointments: MedicalAppointmentWithRelations[];
  meetings?: GeneralMeeting[];
}

export function MonthlyCalendarView({
  selectedDate,
  onDateSelect,
  appointments,
  meetings = [],
}: MonthlyCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate));

  // Calcular dias do mês
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  // Começar do domingo da semana que contém o primeiro dia do mês
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - getDay(monthStart));
  
  // Terminar no sábado da semana que contém o último dia do mês
  const endDate = new Date(monthEnd);
  endDate.setDate(endDate.getDate() + (6 - getDay(monthEnd)));

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Contar consultas e reuniões por dia
  const eventsByDate = useMemo(() => {
    const map = new Map<string, { appointments: number; meetings: number }>();
    
    // Contar consultas
    appointments.forEach(appt => {
      try {
        const date = parseISO(appt.start_time);
        const dateKey = format(date, 'yyyy-MM-dd');
        const current = map.get(dateKey) || { appointments: 0, meetings: 0 };
        current.appointments += 1;
        map.set(dateKey, current);
      } catch {
        // Ignore invalid dates
      }
    });

    // Contar reuniões
    meetings.forEach(meeting => {
      try {
        const date = parseISO(meeting.start_time);
        const dateKey = format(date, 'yyyy-MM-dd');
        const current = map.get(dateKey) || { appointments: 0, meetings: 0 };
        current.meetings += 1;
        map.set(dateKey, current);
      } catch {
        // Ignore invalid dates
      }
    });

    return map;
  }, [appointments, meetings]);

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(startOfMonth(today));
    onDateSelect(today);
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <Card className="bg-gradient-card shadow-card border-border">
      <CardContent className="p-6">
        {/* Header com navegação */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevMonth}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
            <h3 className="text-base sm:text-lg font-semibold capitalize text-center">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              className="h-7 text-xs"
            >
              Hoje
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Dias da semana */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grid de dias */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, dayIdx) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayEvents = eventsByDate.get(dateKey) || { appointments: 0, meetings: 0 };
            const hasEvents = dayEvents.appointments > 0 || dayEvents.meetings > 0;
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentDay = isToday(day);

            return (
              <button
                key={dayIdx}
                onClick={() => {
                  if (isCurrentMonth) {
                    onDateSelect(day);
                  }
                }}
                className={cn(
                  'aspect-square p-1 rounded-lg transition-all duration-200',
                  'hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
                  !isCurrentMonth && 'opacity-30 cursor-not-allowed',
                  isCurrentMonth && 'cursor-pointer',
                  isCurrentDay && !isSelected && 'bg-primary/10 ring-1 ring-primary/30',
                  isSelected && 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1 shadow-md'
                )}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <span
                    className={cn(
                      'text-sm font-medium',
                      isSelected && 'text-primary-foreground',
                      !isSelected && isCurrentDay && 'text-primary font-bold',
                      !isSelected && !isCurrentDay && 'text-foreground'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  {hasEvents && isCurrentMonth && (
                    <div className="mt-1 flex items-center justify-center gap-0.5">
                      {dayEvents.appointments > 0 && (
                        <div
                          className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            isSelected
                              ? 'bg-primary-foreground'
                              : 'bg-primary'
                          )}
                        />
                      )}
                      {dayEvents.meetings > 0 && (
                        <div
                          className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            isSelected
                              ? 'bg-primary-foreground'
                              : 'bg-orange-500'
                          )}
                        />
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

