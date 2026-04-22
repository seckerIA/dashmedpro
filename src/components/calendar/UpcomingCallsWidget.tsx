import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useSalesCalls } from '@/hooks/useSalesCalls';
import { format, parseISO, isToday, isTomorrow, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Phone, Clock, Calendar as CalendarIcon, Plus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { SalesCallForm } from './SalesCallForm';

export function UpcomingCallsWidget() {
  const [showForm, setShowForm] = useState(false);
  const { calls, isLoading } = useSalesCalls({ status: 'scheduled' });

  // Pegar próximas 5 calls agendadas
  const upcomingCalls = calls
    .filter(call => {
      const callDate = new Date(call.scheduled_at);
      return callDate >= new Date();
    })
    .slice(0, 5);

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Hoje';
    if (isTomorrow(date)) return 'Amanhã';
    return format(date, "dd 'de' MMM", { locale: ptBR });
  };

  const isCallSoon = (dateStr: string) => {
    const callDate = parseISO(dateStr);
    const minutesUntilCall = differenceInMinutes(callDate, new Date());
    return minutesUntilCall > 0 && minutesUntilCall <= 60;
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-card to-card/50 border-border shadow-card">
        <CardHeader className="p-3 sm:p-4 lg:p-6">
          <CardTitle className="text-sm sm:text-base lg:text-lg text-foreground">Próximas Calls</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <div className="text-center py-6 sm:py-8">
            <p className="text-xs sm:text-sm text-muted-foreground">Carregando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-gradient-to-br from-card to-card/50 border-border shadow-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 lg:p-6 pb-2 sm:pb-3">
          <CardTitle className="text-sm sm:text-base lg:text-lg text-foreground flex items-center gap-1 sm:gap-2">
            <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
            Próximas Calls
          </CardTitle>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => setShowForm(true)}
            className="h-7 w-7 sm:h-8 sm:w-8 p-0"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6 space-y-2 sm:space-y-3">
          {upcomingCalls.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <Phone className="w-8 h-8 sm:w-12 sm:h-12 mx-auto text-muted-foreground mb-2 sm:mb-3 opacity-50" />
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                Nenhuma call agendada
              </p>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowForm(true)}
                className="text-xs sm:text-sm"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Agendar Call
              </Button>
            </div>
          ) : (
            <>
              {upcomingCalls.map((call) => {
                const initials = call.contact?.full_name
                  ?.split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2) || '??';
                const isSoon = isCallSoon(call.scheduled_at);

                return (
                  <div
                    key={call.id}
                    className={`
                      flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-all
                      ${isSoon 
                        ? 'bg-primary/10 border-2 border-primary/30' 
                        : 'bg-muted/20 hover:bg-muted/30'
                      }
                    `}
                  >
                    <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                      <AvatarFallback className="bg-primary/20 text-primary text-xs sm:text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                          {call.title}
                        </p>
                        {isSoon && (
                          <Badge 
                            variant="secondary" 
                            className="bg-primary/20 text-primary text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0"
                          >
                            Em breve
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                        {call.contact?.full_name || 'Sem contato'}
                      </p>
                      <div className="flex items-center gap-2 sm:gap-3 mt-0.5 sm:mt-1">
                        <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-0.5 sm:gap-1">
                          <CalendarIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          {getDateLabel(call.scheduled_at)}
                        </span>
                        <span className="text-[10px] sm:text-xs font-medium">
                          {format(parseISO(call.scheduled_at), 'HH:mm')}
                        </span>
                      </div>
                    </div>

                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                  </div>
                );
              })}

              <Link to="/calendar">
                <Button 
                  variant="ghost" 
                  className="w-full justify-between mt-1 sm:mt-2 text-xs sm:text-sm"
                >
                  <span>Ver Agenda Completa</span>
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>

      <SalesCallForm 
        open={showForm}
        onOpenChange={setShowForm}
      />
    </>
  );
}

