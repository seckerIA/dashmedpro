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
        <CardHeader>
          <CardTitle className="text-foreground">Próximas Calls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-gradient-to-br from-card to-card/50 border-border shadow-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-foreground flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Próximas Calls
          </CardTitle>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => setShowForm(true)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcomingCalls.length === 0 ? (
            <div className="text-center py-8">
              <Phone className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground mb-4">
                Nenhuma call agendada
              </p>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
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
                      flex items-center gap-3 p-3 rounded-lg transition-all
                      ${isSoon 
                        ? 'bg-primary/10 border-2 border-primary/30' 
                        : 'bg-muted/20 hover:bg-muted/30'
                      }
                    `}
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">
                          {call.title}
                        </p>
                        {isSoon && (
                          <Badge 
                            variant="secondary" 
                            className="bg-primary/20 text-primary text-[10px] px-1.5 py-0"
                          >
                            Em breve
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {call.contact?.full_name || 'Sem contato'}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3" />
                          {getDateLabel(call.scheduled_at)}
                        </span>
                        <span className="text-xs font-medium">
                          {format(parseISO(call.scheduled_at), 'HH:mm')}
                        </span>
                      </div>
                    </div>

                    <Clock className="w-4 h-4 text-muted-foreground" />
                  </div>
                );
              })}

              <Link to="/calendar">
                <Button 
                  variant="ghost" 
                  className="w-full justify-between mt-2"
                >
                  <span>Ver Calendário Completo</span>
                  <ArrowRight className="w-4 h-4" />
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

