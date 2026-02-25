import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
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
    if (appointments && appointments.length > 0) {
      appointments.forEach(appt => {
        try {
          if (!appt.start_time) return;
          const date = parseISO(appt.start_time);
          const dateKey = format(date, 'yyyy-MM-dd');
          const current = map.get(dateKey) || { appointments: 0, meetings: 0 };
          current.appointments += 1;
          map.set(dateKey, current);
        } catch {
          // Ignore invalid dates
        }
      });
    }

    // Contar reuniões
    if (meetings && meetings.length > 0) {
      meetings.forEach(meeting => {
        try {
          if (!meeting.start_time) return;
          const date = parseISO(meeting.start_time);
          const dateKey = format(date, 'yyyy-MM-dd');
          const current = map.get(dateKey) || { appointments: 0, meetings: 0 };
          current.meetings += 1;
          map.set(dateKey, current);
        } catch {
          // Ignore invalid dates
        }
      });
    }

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

  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  return (
    <Card className="shadow-sm border-border">
      <CardContent className="p-3 sm:p-6">
        {/* Header com navegação */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevMonth}
            className="h-9 w-9 sm:h-8 sm:w-8 rounded-full hover:bg-muted active:bg-muted"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <h3 className="text-sm sm:text-base font-semibold capitalize text-foreground">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h3>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            className="h-9 w-9 sm:h-8 sm:w-8 rounded-full hover:bg-muted active:bg-muted"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Dias da semana */}
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1 sm:mb-2">
          {weekDays.map((day, i) => (
            <div
              key={i}
              className="text-center text-[10px] sm:text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider py-1.5 sm:py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grid de dias */}
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
          {days.map((day, dayIdx) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayEvents = eventsByDate.get(dateKey);
            const hasAppointments = dayEvents?.appointments > 0;
            const hasMeetings = dayEvents?.meetings > 0;
            const hasEvents = hasAppointments || hasMeetings;
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
                  'aspect-square p-0.5 rounded-lg sm:rounded-xl transition-all duration-200',
                  'hover:bg-muted active:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
                  !isCurrentMonth && 'opacity-25 cursor-not-allowed',
                  isCurrentMonth && 'cursor-pointer',
                  isCurrentDay && !isSelected && 'bg-primary/15 ring-2 ring-primary/40',
                  isSelected && 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg scale-105'
                )}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <span
                    className={cn(
                      'text-xs sm:text-sm font-medium',
                      isSelected && 'text-primary-foreground font-bold',
                      !isSelected && isCurrentDay && 'text-primary font-bold',
                      !isSelected && !isCurrentDay && 'text-foreground'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  {hasEvents && isCurrentMonth && (
                    <div className="mt-0.5 flex items-center justify-center gap-0.5">
                      {hasAppointments && (
                        <div
                          className={cn(
                            'w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full flex-shrink-0',
                            isSelected
                              ? 'bg-primary-foreground'
                              : 'bg-primary'
                          )}
                        />
                      )}
                      {hasMeetings && (
                        <div
                          className={cn(
                            'w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full flex-shrink-0',
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

        {/* Footer with Go to Today */}
        <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToday}
            className="w-full h-9 sm:h-8 text-xs text-muted-foreground hover:text-primary active:text-primary"
          >
            <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
            Ir para Hoje
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
