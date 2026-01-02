/**
 * HotLeadsCard
 * Card do dashboard mostrando leads quentes do WhatsApp
 */

import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Flame,
  MessageSquare,
  Clock,
  TrendingUp,
  ArrowRight,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useFollowUpAlerts } from '@/hooks/useFollowUpAlerts';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { HotLead } from '@/types/whatsappAI';

interface HotLeadsCardProps {
  className?: string;
  maxItems?: number;
}

export function HotLeadsCard({ className, maxItems = 5 }: HotLeadsCardProps) {
  const navigate = useNavigate();
  const {
    hotLeads,
    pendingFollowups,
    isLoadingHotLeads,
    isLoadingFollowups,
    refetch,
  } = useFollowUpAlerts({ enableNotifications: false });

  const isLoading = isLoadingHotLeads || isLoadingFollowups;
  const displayLeads = hotLeads.slice(0, maxItems);
  const hasMoreLeads = hotLeads.length > maxItems;

  const handleOpenConversation = (conversationId: string) => {
    navigate(`/whatsapp?conversation=${conversationId}`);
  };

  const handleViewAll = () => {
    navigate('/whatsapp');
  };

  return (
    <Card
      className={cn(
        'bg-gradient-to-br from-orange-500/5 via-background to-red-500/5',
        'border-orange-500/20',
        className
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-orange-500/10">
              <Flame className="h-4 w-4 text-orange-500" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Leads Quentes
              </CardTitle>
              <CardDescription className="text-xs">
                {hotLeads.length} lead{hotLeads.length !== 1 ? 's' : ''} com alta
                chance de conversão
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw
              className={cn('h-4 w-4', isLoading && 'animate-spin')}
            />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {isLoading ? (
          // Loading state
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
              >
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : displayLeads.length === 0 ? (
          // Empty state
          <div className="text-center py-8">
            <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground mb-1">
              Nenhum lead quente no momento
            </p>
            <p className="text-xs text-muted-foreground">
              Os leads com alta probabilidade de conversão aparecerão aqui
            </p>
          </div>
        ) : (
          // Lista de leads
          <div className="space-y-2">
            {displayLeads.map((lead) => (
              <HotLeadItem
                key={lead.conversation_id}
                lead={lead}
                onOpen={() => handleOpenConversation(lead.conversation_id)}
              />
            ))}
          </div>
        )}

        {/* Pendências de follow-up */}
        {pendingFollowups.length > 0 && (
          <div className="pt-3 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Clock className="h-3 w-3" />
              <span>
                {pendingFollowups.length} conversa
                {pendingFollowups.length !== 1 ? 's' : ''} aguardando resposta
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        {(displayLeads.length > 0 || hasMoreLeads) && (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={handleViewAll}
          >
            <MessageSquare className="h-4 w-4" />
            {hasMoreLeads
              ? `Ver todos os ${hotLeads.length} leads`
              : 'Abrir WhatsApp'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface HotLeadItemProps {
  lead: HotLead;
  onOpen: () => void;
}

function HotLeadItem({ lead, onOpen }: HotLeadItemProps) {
  const timeAgo = lead.last_message_at
    ? formatDistanceToNow(new Date(lead.last_message_at), {
        addSuffix: true,
        locale: ptBR,
      })
    : null;

  return (
    <div
      className={cn(
        'group flex items-center gap-3 p-3 rounded-lg',
        'bg-background/50 hover:bg-background',
        'border border-transparent hover:border-orange-500/30',
        'cursor-pointer transition-all'
      )}
      onClick={onOpen}
    >
      {/* Avatar / Iniciais */}
      <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-orange-500/20">
        <span className="text-sm font-bold text-orange-600">
          {(lead.contact_name || lead.phone_number)
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">
            {lead.contact_name || lead.phone_number}
          </span>
          {lead.conversion_probability >= 80 && (
            <Flame className="h-3 w-3 text-orange-500 flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {lead.detected_intent ? (
            <span className="truncate">{lead.detected_intent}</span>
          ) : (
            <span className="truncate">{lead.phone_number}</span>
          )}
          {timeAgo && (
            <>
              <span>•</span>
              <span className="flex-shrink-0">{timeAgo}</span>
            </>
          )}
        </div>
      </div>

      {/* Probabilidade */}
      <Badge
        className={cn(
          'flex-shrink-0 font-bold',
          lead.conversion_probability >= 80
            ? 'bg-orange-500/20 text-orange-600 border-orange-500/30'
            : 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30'
        )}
      >
        <TrendingUp className="h-3 w-3 mr-1" />
        {lead.conversion_probability}%
      </Badge>

      {/* Botão responder (aparece no hover) */}
      <Button
        variant="ghost"
        size="sm"
        className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
        }}
      >
        <MessageSquare className="h-4 w-4" />
      </Button>
    </div>
  );
}

/**
 * Versão compacta para sidebar ou outros locais
 */
interface HotLeadsCompactProps {
  className?: string;
}

export function HotLeadsCompact({ className }: HotLeadsCompactProps) {
  const navigate = useNavigate();
  const { hotLeads, hotLeadsCount } = useFollowUpAlerts({
    enableNotifications: false,
  });

  if (hotLeadsCount === 0) return null;

  return (
    <button
      onClick={() => navigate('/whatsapp')}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg w-full',
        'bg-orange-500/10 hover:bg-orange-500/20',
        'border border-orange-500/20 hover:border-orange-500/40',
        'transition-colors text-left',
        className
      )}
    >
      <Flame className="h-4 w-4 text-orange-500" />
      <span className="text-sm font-medium text-orange-600">
        {hotLeadsCount} lead{hotLeadsCount !== 1 ? 's' : ''} quente
        {hotLeadsCount !== 1 ? 's' : ''}
      </span>
      <ArrowRight className="h-4 w-4 text-orange-500 ml-auto" />
    </button>
  );
}

export default HotLeadsCard;
