import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FollowUpCard } from "./FollowUpCard";
import { CRMDealWithContact } from "@/types/crm";
import { FollowUp } from "@/types/followUp";
import { Clock, AlertTriangle } from "lucide-react";
import { parseISO, isBefore, isToday } from "date-fns";

interface FollowUpSectionProps {
  deals: CRMDealWithContact[];
  followUps?: FollowUp[]; // Follow-ups agendados
  onDealClick?: (deal: CRMDealWithContact) => void;
  onCompleteFollowUp?: (followUpId: string) => void;
  onEditFollowUp?: (followUp: FollowUp) => void;
}

export function FollowUpSection({
  deals,
  followUps = [],
  onDealClick,
  onCompleteFollowUp,
  onEditFollowUp,
}: FollowUpSectionProps) {
  // Filtrar follow-ups pendentes (não concluídos)
  const pendingFollowUps = followUps.filter(fu => !fu.completed);

  // Criar um mapa de follow-ups por deal_id
  const followUpsByDealId = new Map<string, FollowUp>();
  pendingFollowUps.forEach(fu => {
    followUpsByDealId.set(fu.deal_id, fu);
  });

  // Filtrar apenas deals que têm follow-up agendado e pendente
  const followUpDeals = deals.filter(deal => followUpsByDealId.has(deal.id));

  // Calcular quantos estão atrasados
  const overdueCount = followUpDeals.filter(deal => {
    const followUp = followUpsByDealId.get(deal.id);
    if (followUp) {
      const scheduledDateTime = new Date(followUp.scheduled_date);
      return isBefore(scheduledDateTime, new Date());
    }
    return false;
  }).length;

  return (
    <Card
      className="flex-shrink-0 w-80 bg-gradient-to-br from-card to-card/50 border border-border shadow-card"
    >
      <CardHeader className="pb-3 bg-gradient-to-r from-transparent to-orange-500/5 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-orange-500/10 border border-border/50 shadow-sm">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Follow-ups
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5 font-medium">
                Clientes para acompanhar
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Badge
              variant="secondary"
              className="text-sm bg-orange-500/10 text-orange-600 border-0 font-semibold px-3 py-1.5 rounded-lg"
            >
              {followUpDeals.length}
            </Badge>
            {overdueCount > 0 && (
              <Badge
                variant="destructive"
                className="text-xs px-2 py-1"
              >
                <AlertTriangle className="w-3 h-3 mr-1" />
                {overdueCount} {overdueCount > 1 ? 'atrasados' : 'atrasado'}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 pt-0">
        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className="space-y-2 pr-2">
            {followUpDeals.sort((a, b) => {
              const aFollowUp = followUpsByDealId.get(a.id);
              const bFollowUp = followUpsByDealId.get(b.id);

              if (!aFollowUp || !bFollowUp) return 0; // Should not happen given logic above

              const aDateTime = new Date(aFollowUp.scheduled_date);
              const bDateTime = new Date(bFollowUp.scheduled_date);

              const aOverdue = isBefore(aDateTime, new Date());
              const bOverdue = isBefore(bDateTime, new Date());
              const aIsToday = isToday(aDateTime);
              const bIsToday = isToday(bDateTime);

              // Ordenação: atrasados > hoje > futuros
              if (aOverdue && !bOverdue) return -1;
              if (!aOverdue && bOverdue) return 1;
              if (aIsToday && !bIsToday) return -1;
              if (!aIsToday && bIsToday) return 1;

              // Ordenar por data (mais recente primeiro? ou cronológico? Cronológico faz mais sentido para agenda)
              return aDateTime.getTime() - bDateTime.getTime();
            }).map((deal) => {
              const followUp = followUpsByDealId.get(deal.id);
              return (
                <FollowUpCard
                  key={deal.id}
                  deal={deal}
                  followUp={followUp}
                  onClick={() => onDealClick?.(deal)}
                  onCompleteFollowUp={onCompleteFollowUp}
                  onEditFollowUp={onEditFollowUp}
                />
              );
            })}

            {followUpDeals.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                <p>Nenhum follow-up pendente</p>
                <p className="text-xs mt-1">Agende um follow-up nos cards do pipeline.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
