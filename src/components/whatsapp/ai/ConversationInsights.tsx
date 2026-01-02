/**
 * ConversationInsights
 * Card com insights da IA sobre a conversa atual
 */

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Sparkles,
  TrendingUp,
  Target,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  UserPlus,
  Calendar,
  Loader2,
} from 'lucide-react';
import { LeadScoreBadge } from './LeadScoreBadge';
import type { ConversationAnalysis, LeadStatus } from '@/types/whatsappAI';
import { URGENCY_CONFIG, SENTIMENT_CONFIG } from '@/types/whatsappAI';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ConversationInsightsProps {
  analysis: ConversationAnalysis | null;
  isLoading?: boolean;
  isAnalyzing?: boolean;
  onAnalyze?: () => void;
  onConvertToDeal?: () => void;
  onUpdateStatus?: (status: LeadStatus) => void;
  className?: string;
  compact?: boolean;
}

export function ConversationInsights({
  analysis,
  isLoading,
  isAnalyzing,
  onAnalyze,
  onConvertToDeal,
  onUpdateStatus,
  className,
  compact = false,
}: ConversationInsightsProps) {
  // Se não tem análise e não está carregando, mostrar prompt para analisar
  if (!analysis && !isLoading) {
    return (
      <Card className={cn('border-dashed', className)}>
        <CardContent className="flex items-center justify-center py-6">
          <div className="text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              Analise esta conversa com IA
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={onAnalyze}
              disabled={isAnalyzing}
              className="gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Analisar Conversa
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardHeader className="pb-2">
          <div className="h-4 w-32 bg-muted rounded" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-6 w-24 bg-muted rounded-full" />
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-4 w-3/4 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!analysis) return null;

  const urgencyConfig = URGENCY_CONFIG[analysis.detected_urgency];
  const sentimentConfig = SENTIMENT_CONFIG[analysis.sentiment];
  const lastAnalyzed = analysis.last_analyzed_at
    ? formatDistanceToNow(new Date(analysis.last_analyzed_at), {
        addSuffix: true,
        locale: ptBR,
      })
    : null;

  // Versão compacta
  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg',
          'bg-gradient-to-r from-purple-500/5 to-transparent',
          'border border-purple-500/20',
          className
        )}
      >
        <LeadScoreBadge
          status={analysis.lead_status}
          probability={analysis.conversion_probability}
          showProbability
          size="sm"
        />

        {analysis.detected_intent && (
          <span className="text-xs text-muted-foreground truncate">
            {analysis.detected_intent}
          </span>
        )}

        <div className="flex items-center gap-1 ml-auto">
          {!analysis.deal_created && analysis.lead_status !== 'perdido' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={onConvertToDeal}
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Converter para Pipeline</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onAnalyze}
                  disabled={isAnalyzing}
                >
                  <RefreshCw
                    className={cn('h-3.5 w-3.5', isAnalyzing && 'animate-spin')}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reanalisar</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    );
  }

  // Versão completa
  return (
    <Card
      className={cn(
        'bg-gradient-to-br from-purple-500/5 via-background to-purple-500/5',
        'border-purple-500/20',
        className
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <CardTitle className="text-sm font-medium">
              Análise da Conversa
            </CardTitle>
          </div>
          {lastAnalyzed && (
            <CardDescription className="text-xs">
              Atualizado {lastAnalyzed}
            </CardDescription>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status e Probabilidade */}
        <div className="flex items-center justify-between">
          <LeadScoreBadge
            status={analysis.lead_status}
            showLabel
            onClick={onUpdateStatus ? () => {} : undefined}
          />

          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-lg font-bold">
              {analysis.conversion_probability}%
            </span>
            <span className="text-xs text-muted-foreground">de conversão</span>
          </div>
        </div>

        {/* Intenção detectada */}
        {analysis.detected_intent && (
          <div className="flex items-start gap-2">
            <Target className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Intenção</p>
              <p className="text-sm font-medium">{analysis.detected_intent}</p>
            </div>
          </div>
        )}

        {/* Procedimento detectado */}
        {analysis.detected_procedure && (
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Procedimento</p>
              <p className="text-sm font-medium">{analysis.detected_procedure}</p>
            </div>
          </div>
        )}

        {/* Badges de urgência e sentimento */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={cn('text-xs', urgencyConfig.color)}>
            Urgência: {urgencyConfig.label}
          </Badge>
          <Badge variant="outline" className="text-xs gap-1">
            {sentimentConfig.emoji} {sentimentConfig.label}
          </Badge>
        </div>

        {/* Próxima ação sugerida */}
        {analysis.suggested_next_action && (
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <ArrowRight className="h-3 w-3" />
              Próxima ação recomendada
            </div>
            <p className="text-sm">{analysis.suggested_next_action}</p>
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center gap-2 pt-2 border-t">
          {!analysis.deal_created && analysis.lead_status !== 'perdido' && (
            <Button
              variant="default"
              size="sm"
              onClick={onConvertToDeal}
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Converter para Pipeline
            </Button>
          )}

          {analysis.deal_created && (
            <Badge variant="secondary" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Já no Pipeline
            </Badge>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className="gap-2 ml-auto"
          >
            <RefreshCw
              className={cn('h-4 w-4', isAnalyzing && 'animate-spin')}
            />
            {isAnalyzing ? 'Analisando...' : 'Reanalisar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Mini versão para lista de conversas
 */
interface ConversationInsightsMiniProps {
  analysis: ConversationAnalysis | null;
}

export function ConversationInsightsMini({
  analysis,
}: ConversationInsightsMiniProps) {
  if (!analysis) return null;

  return (
    <div className="flex items-center gap-1">
      <LeadScoreBadge status={analysis.lead_status} size="sm" showLabel={false} />
      {analysis.conversion_probability >= 70 && (
        <span className="text-xs font-medium text-orange-500">
          {analysis.conversion_probability}%
        </span>
      )}
    </div>
  );
}

export default ConversationInsights;
