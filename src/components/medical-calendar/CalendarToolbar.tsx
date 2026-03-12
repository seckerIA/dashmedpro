import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface CalendarToolbarProps {
  currentDate: Date;
  view: 'timeGridDay' | 'timeGridWeek' | 'dayGridMonth';
  onViewChange: (view: 'timeGridDay' | 'timeGridWeek' | 'dayGridMonth') => void;
  onNavigate: (action: 'prev' | 'next' | 'today') => void;
  onNewAppointment: () => void;
}

export function CalendarToolbar({
  currentDate,
  view,
  onViewChange,
  onNavigate,
  onNewAppointment,
}: CalendarToolbarProps) {
  // Format current date based on view
  const getDateDisplay = () => {
    switch (view) {
      case 'timeGridDay':
        return format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR });
      case 'timeGridWeek':
        return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
      case 'dayGridMonth':
        return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
      default:
        return '';
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      {/* Left: Date display and navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('today')}
        >
          <CalendarIcon className="h-4 w-4 mr-2" />
          Hoje
        </Button>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            aria-label="Período anterior"
            onClick={() => onNavigate('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="px-4 py-2 text-sm font-semibold capitalize min-w-[180px] text-center">
            {getDateDisplay()}
          </div>

          <Button
            variant="outline"
            size="icon"
            aria-label="Próximo período"
            onClick={() => onNavigate('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Right: View switcher and New Appointment button */}
      <div className="flex items-center gap-2">
        {/* View switcher */}
        <div className="flex items-center border border-border rounded-md">
          <Button
            variant={view === 'timeGridDay' ? 'secondary' : 'ghost'}
            size="sm"
            className={cn(
              'rounded-none border-r',
              view === 'timeGridDay' && 'bg-muted'
            )}
            onClick={() => onViewChange('timeGridDay')}
          >
            Dia
          </Button>
          <Button
            variant={view === 'timeGridWeek' ? 'secondary' : 'ghost'}
            size="sm"
            className={cn(
              'rounded-none border-r',
              view === 'timeGridWeek' && 'bg-muted'
            )}
            onClick={() => onViewChange('timeGridWeek')}
          >
            Semana
          </Button>
          <Button
            variant={view === 'dayGridMonth' ? 'secondary' : 'ghost'}
            size="sm"
            className={cn(
              'rounded-none',
              view === 'dayGridMonth' && 'bg-muted'
            )}
            onClick={() => onViewChange('dayGridMonth')}
          >
            Mês
          </Button>
        </div>

        {/* New Appointment button */}
        <Button onClick={onNewAppointment}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Consulta
        </Button>
      </div>
    </div>
  );
}
