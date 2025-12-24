import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getScoreLevel, getScoreLevelConfig, SCORE_LEVELS, LeadScoreLevel } from "@/types/leadScoring";
import { Info } from "lucide-react";

interface LeadScoreBadgeProps {
  score: number | null | undefined;
  factors?: {
    response_time?: number;
    optimal_hour?: number;
    urgency_keywords?: number;
    origin?: number;
    estimated_value?: number;
  };
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function LeadScoreBadge({ 
  score, 
  factors, 
  showTooltip = true,
  size = 'md'
}: LeadScoreBadgeProps) {
  if (score === null || score === undefined) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Sem score
      </Badge>
    );
  }

  const level = getScoreLevel(score);
  const config = getScoreLevelConfig(score);

  const badgeVariants: Record<LeadScoreLevel, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    high: 'default',
    medium: 'secondary',
    low: 'destructive',
  };

  const badgeColors: Record<LeadScoreLevel, string> = {
    high: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    medium: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
    low: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const badge = (
    <Badge 
      variant={badgeVariants[level]}
      className={`${badgeColors[level]} ${sizeClasses[size]} font-semibold`}
    >
      {score} - {config.label}
    </Badge>
  );

  if (!showTooltip || !factors) {
    return badge;
  }

  const tooltipContent = (
    <div className="space-y-2">
      <div className="font-semibold text-sm mb-2">Detalhamento do Score</div>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between gap-4">
          <span>Tempo de Resposta:</span>
          <span className="font-medium">{factors.response_time || 0} pts</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Horário Ótimo:</span>
          <span className="font-medium">{factors.optimal_hour || 0} pts</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Keywords Urgência:</span>
          <span className="font-medium">{factors.urgency_keywords || 0} pts</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Origem:</span>
          <span className="font-medium">{factors.origin || 0} pts</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Valor Estimado:</span>
          <span className="font-medium">{factors.estimated_value || 0} pts</span>
        </div>
      </div>
      <div className="pt-2 border-t border-border/50 mt-2">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Info className="w-3 h-3" />
          <span>Score total: {score}/100</span>
        </div>
      </div>
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

