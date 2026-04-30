/**
 * Card de status do Follow-up automatico para uma conversa.
 * Mostra:
 *  - Se a conversa esta com follow-up ativo/pausado
 *  - Quantas tentativas ja foram feitas
 *  - Quando deve ser o proximo disparo (estimativa)
 *  - Botao de pausar/retomar
 */
import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageCircleReply, Pause, Play, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useWhatsAppAI } from '@/hooks/useWhatsAppAI';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FollowUpStatusProps {
  conversationId: string;
  conversationOwnerId: string;
  lastMessageAt?: string | null;
  lastMessageDirection?: 'inbound' | 'outbound' | null;
}

interface ConvFollowUpRow {
  followup_attempts: number;
  last_followup_at: string | null;
  followup_disabled: boolean;
  ai_autonomous_mode: boolean | null;
}

const ATTEMPT_HOURS = [3, 24, 72] as const;

export function FollowUpStatus({
  conversationId,
  conversationOwnerId,
  lastMessageAt,
  lastMessageDirection,
}: FollowUpStatusProps) {
  const qc = useQueryClient();
  const { aiConfig } = useWhatsAppAI({ targetUserId: conversationOwnerId });

  const followupGloballyEnabled = !!(aiConfig as any)?.followup_enabled;
  const maxAttempts = (aiConfig as any)?.followup_max_attempts ?? 3;

  const convQuery = useQuery({
    queryKey: ['conv-followup', conversationId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('whatsapp_conversations')
        .select('followup_attempts, last_followup_at, followup_disabled, ai_autonomous_mode')
        .eq('id', conversationId)
        .single();
      if (error) throw error;
      return data as ConvFollowUpRow;
    },
    enabled: !!conversationId,
  });

  const conv = convQuery.data;

  const toggleMutation = useMutation({
    mutationFn: async (disabled: boolean) => {
      const { error } = await (supabase as any)
        .from('whatsapp_conversations')
        .update({ followup_disabled: disabled })
        .eq('id', conversationId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conv-followup', conversationId] });
      qc.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
      toast({ title: 'Follow-up atualizado' });
    },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const nextEstimate = useMemo(() => {
    if (!conv || !lastMessageAt || lastMessageDirection !== 'outbound') return null;
    if (conv.followup_disabled) return null;
    if (conv.ai_autonomous_mode === false) return null;
    if ((conv.followup_attempts || 0) >= maxAttempts) return null;

    const nextAttemptIdx = conv.followup_attempts || 0; // 0,1,2 -> hour 3,24,72
    const hours = ATTEMPT_HOURS[nextAttemptIdx];
    if (!hours) return null;

    const targetMs = new Date(lastMessageAt).getTime() + hours * 3_600_000;
    if (targetMs <= Date.now()) return { date: new Date(), label: 'A qualquer momento' };
    return { date: new Date(targetMs), label: formatDistanceToNow(new Date(targetMs), { locale: ptBR, addSuffix: true }) };
  }, [conv, lastMessageAt, lastMessageDirection, maxAttempts]);

  // Nao mostra nada se feature nao esta ativa globalmente
  if (!followupGloballyEnabled) return null;
  if (!conv) return null;

  const attemptsDone = conv.followup_attempts || 0;
  const exhausted = attemptsDone >= maxAttempts;
  const paused = conv.followup_disabled;

  return (
    <div className={cn(
      'rounded-xl border p-3 space-y-3 transition-colors',
      paused ? 'bg-muted/30 border-border' : exhausted ? 'bg-amber-500/5 border-amber-500/30' : 'bg-blue-500/5 border-blue-500/20'
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <MessageCircleReply className={cn(
            'h-4 w-4 flex-shrink-0',
            paused ? 'text-muted-foreground' : 'text-blue-500'
          )} />
          <div className="min-w-0">
            <p className="text-xs font-bold leading-tight">
              {paused ? 'Follow-up Pausado' : exhausted ? 'Follow-up Esgotado' : 'Follow-up Ativo'}
            </p>
            <p className="text-[10px] text-muted-foreground leading-tight">
              {attemptsDone}/{maxAttempts} tentativas usadas
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-[11px] flex-shrink-0"
          onClick={() => toggleMutation.mutate(!paused)}
          disabled={toggleMutation.isPending}
        >
          {paused ? <Play className="h-3 w-3 mr-1" /> : <Pause className="h-3 w-3 mr-1" />}
          {paused ? 'Retomar' : 'Pausar'}
        </Button>
      </div>

      {!paused && !exhausted && nextEstimate && (
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground border-t border-border/40 pt-2">
          <Clock className="h-3 w-3 flex-shrink-0" />
          <span>
            Próximo disparo: <b className="text-foreground">{nextEstimate.label}</b>
          </span>
        </div>
      )}

      {exhausted && (
        <div className="flex items-center gap-2 text-[11px] text-amber-700 dark:text-amber-300 border-t border-amber-500/20 pt-2">
          <AlertTriangle className="h-3 w-3 flex-shrink-0" />
          <span>Conversa transferida para atendimento humano.</span>
        </div>
      )}

      {conv.last_followup_at && (
        <p className="text-[10px] text-muted-foreground">
          Última tentativa: {formatDistanceToNow(new Date(conv.last_followup_at), { locale: ptBR, addSuffix: true })}
        </p>
      )}
    </div>
  );
}
