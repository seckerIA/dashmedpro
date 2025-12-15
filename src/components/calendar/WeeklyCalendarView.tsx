import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SalesCallWithRelations, CALL_STATUS_COLORS } from '@/types/salesCalls';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  isSameDay,
  parseISO,
  isToday
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

interface WeeklyCalendarViewProps {
  calls: SalesCallWithRelations[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onCallClick: (call: SalesCallWithRelations) => void;
}

export function WeeklyCalendarView({ 
  calls, 
  currentDate, 
  onDateChange,
  onCallClick 
}: WeeklyCalendarViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    onDateChange(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    onDateChange(newDate);
  };

  const getCallsForDay = (day: Date) => {
    return calls.filter(call => 
      isSameDay(parseISO(call.scheduled_at), day)
    ).sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  };

  return (
    <div className="space-y-4">
      {/* Header de navegação */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {format(weekStart, 'dd MMM', { locale: ptBR })} - {format(weekEnd, 'dd MMM yyyy', { locale: ptBR })}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevWeek}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onDateChange(new Date())}
          >
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextWeek}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Grid de dias da semana */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {daysOfWeek.map((day) => {
          const dayCalls = getCallsForDay(day);
          const isDayToday = isToday(day);

          return (
            <Card 
              key={day.toISOString()} 
              className={`${isDayToday ? 'border-primary border-2' : ''}`}
            >
              <CardContent className="p-3">
                {/* Header do dia */}
                <div className="text-center mb-3 pb-2 border-b">
                  <p className="text-xs text-muted-foreground uppercase">
                    {format(day, 'EEE', { locale: ptBR })}
                  </p>
                  <p className={`text-xl font-bold ${isDayToday ? 'text-primary' : ''}`}>
                    {format(day, 'dd')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {dayCalls.length} {dayCalls.length === 1 ? 'call' : 'calls'}
                  </p>
                </div>

                {/* Calls do dia */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {dayCalls.map((call) => {
                    const statusColors = CALL_STATUS_COLORS[call.status];
                    const initials = call.contact?.full_name
                      ?.split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2) || '??';

                    return (
                      <div
                        key={call.id}
                        onClick={() => onCallClick(call)}
                        className={`
                          p-2 rounded-lg cursor-pointer transition-all
                          hover:shadow-md border
                          ${statusColors.bg} ${statusColors.border}
                        `}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className={`w-3 h-3 ${statusColors.text}`} />
                          <span className={`text-xs font-medium ${statusColors.text}`}>
                            {format(parseISO(call.scheduled_at), 'HH:mm')}
                          </span>
                        </div>
                        
                        <p className={`text-xs font-semibold line-clamp-1 mb-1 ${statusColors.text}`}>
                          {call.title}
                        </p>
                        
                        <div className="flex items-center gap-1">
                          <div className={`
                            w-5 h-5 rounded-full flex items-center justify-center
                            text-[10px] font-bold bg-primary/20 text-primary
                          `}>
                            {initials}
                          </div>
                          <p className={`text-[10px] line-clamp-1 flex-1 ${statusColors.text} opacity-80`}>
                            {call.contact?.full_name || 'Sem contato'}
                          </p>
                        </div>

                        <p className={`text-[10px] mt-1 ${statusColors.text} opacity-70`}>
                          {call.duration_minutes}min
                        </p>
                      </div>
                    );
                  })}

                  {dayCalls.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Sem calls
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

