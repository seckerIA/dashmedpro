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
  // Filtrar deals que precisam de follow-up (marcados manualmente)
  const markedFollowUpDeals = deals.filter(deal => deal.needs_follow_up);
  
  // Filtrar follow-ups pendentes
  const pendingFollowUps = followUps.filter(fu => fu.status === 'pendente');
  
  // Criar um mapa de follow-ups por deal_id
  const followUpsByDealId = new Map<string, FollowUp>();
  pendingFollowUps.forEach(fu => {
    followUpsByDealId.set(fu.deal_id, fu);
  });
  
  // Combinar deals com follow-ups: deals marcados + deals com follow-up agendado
  const dealsWithFollowUpIds = new Set([
    ...markedFollowUpDeals.map(d => d.id),
    ...pendingFollowUps.map(fu => fu.deal_id)
  ]);
  
  const followUpDeals = deals.filter(deal => dealsWithFollowUpIds.has(deal.id));
  
  // Calcular quantos estão atrasados
  const overdueCount = followUpDeals.filter(deal => {
    const followUp = followUpsByDealId.get(deal.id);
    if (followUp) {
      const scheduledDateTime = parseISO(`${followUp.scheduled_date}T${followUp.scheduled_time}`);
      return isBefore(scheduledDateTime, new Date());
    }
    // Se não tem follow-up agendado, usar lógica antiga
    if (!deal.contact?.last_contact_at) return true;
    const daysSinceLastContact = 
      (new Date().getTime() - new Date(deal.contact.last_contact_at).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceLastContact >= 3;
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
              
              // Calcular se estão atrasados
              let aOverdue = false;
              let bOverdue = false;
              let aIsToday = false;
              let bIsToday = false;
              
              if (aFollowUp) {
                const aDateTime = parseISO(`${aFollowUp.scheduled_date}T${aFollowUp.scheduled_time}`);
                aOverdue = isBefore(aDateTime, new Date());
                aIsToday = isToday(aDateTime);
              } else if (!a.contact?.last_contact_at) {
                aOverdue = true;
              } else {
                const daysSinceLastContact = (new Date().getTime() - new Date(a.contact.last_contact_at).getTime()) / (1000 * 60 * 60 * 24);
                aOverdue = daysSinceLastContact >= 3;
              }
              
              if (bFollowUp) {
                const bDateTime = parseISO(`${bFollowUp.scheduled_date}T${bFollowUp.scheduled_time}`);
                bOverdue = isBefore(bDateTime, new Date());
                bIsToday = isToday(bDateTime);
              } else if (!b.contact?.last_contact_at) {
                bOverdue = true;
              } else {
                const daysSinceLastContact = (new Date().getTime() - new Date(b.contact.last_contact_at).getTime()) / (1000 * 60 * 60 * 24);
                bOverdue = daysSinceLastContact >= 3;
              }
              
              // Ordenação: atrasados > hoje > futuros
              if (aOverdue && !bOverdue) return -1;
              if (!aOverdue && bOverdue) return 1;
              if (aIsToday && !bIsToday) return -1;
              if (!aIsToday && bIsToday) return 1;
              
              // Se ambos têm follow-up agendado, ordenar por data/hora
              if (aFollowUp && bFollowUp) {
                const aDateTime = parseISO(`${aFollowUp.scheduled_date}T${aFollowUp.scheduled_time}`);
                const bDateTime = parseISO(`${bFollowUp.scheduled_date}T${bFollowUp.scheduled_time}`);
                return aDateTime.getTime() - bDateTime.getTime();
              }
              
              return 0;
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
                <p className="text-xs mt-1">Marque um contato para acompanhá-lo aqui.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
