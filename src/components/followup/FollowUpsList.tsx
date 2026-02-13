import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, X, User, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { FollowUpScheduledWithRelations } from '@/types/followUp';
import { STATUS_CONFIG, CHANNEL_CONFIG, TRIGGER_TYPE_LABELS } from '@/types/followUp';
import { useAutomatedFollowUps } from '@/hooks/useAutomatedFollowUps';

interface FollowUpsListProps {
  followups: FollowUpScheduledWithRelations[];
}

export function FollowUpsList({ followups }: FollowUpsListProps) {
  const { cancelScheduled } = useAutomatedFollowUps();

  const handleCancel = async (id: string) => {
    if (confirm('Deseja realmente cancelar este follow-up?')) {
      await cancelScheduled(id);
    }
  };

  if (followups.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhum follow-up agendado</h3>
        <p className="text-muted-foreground">
          Follow-ups serão criados automaticamente após consultas concluídas
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {followups.map((followup: any) => {
        const statusConfig = STATUS_CONFIG[followup.status];
        const channelConfig = CHANNEL_CONFIG[followup.channel];

        return (
          <Card key={followup.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={statusConfig.color}>
                    {statusConfig.label}
                  </Badge>
                  <Badge variant="secondary">
                    <MessageCircle className="h-3 w-3 mr-1" />
                    {channelConfig.label}
                  </Badge>
                  {followup.template && (
                    <span className="text-sm text-muted-foreground">
                      {TRIGGER_TYPE_LABELS[followup.template.trigger_type]}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{followup.contact?.full_name}</span>
                  <span className="text-sm text-muted-foreground">
                    {followup.contact?.phone}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Agendado para: {format(new Date(followup.scheduled_for), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>

                {followup.sent_at && (
                  <div className="text-sm text-muted-foreground">
                    Enviado em: {format(new Date(followup.sent_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                )}

                {followup.message_sent && (
                  <div className="mt-2 p-3 bg-muted/50 rounded-md text-sm">
                    {followup.message_sent}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {followup.status === 'pending' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCancel(followup.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
