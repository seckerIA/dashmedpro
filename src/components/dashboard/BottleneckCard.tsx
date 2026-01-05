import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Minus,
  AlertCircle,
  Lightbulb,
  ExternalLink,
  Users,
  DollarSign,
  Settings,
  MessageCircle,
  RotateCcw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export interface Bottleneck {
  id: string;
  title: string;
  severity: "high" | "medium" | "low";
  category?: "conversion" | "financial" | "operational" | "engagement" | "retention";
  metric: string;
  currentValue: number | string;
  threshold: number | string;
  previousValue?: number | string;
  trend?: "improving" | "declining" | "stable";
  suggestion: string;
  impact: string;
  actionUrl?: string;
  priority?: number;
}

interface BottleneckCardProps {
  bottleneck: Bottleneck;
  onActionClick?: () => void;
  compact?: boolean;
}

const severityConfig = {
  high: {
    color: "destructive",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    icon: AlertTriangle,
    label: "Crítico",
  },
  medium: {
    color: "default",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
    icon: AlertCircle,
    label: "Atenção",
  },
  low: {
    color: "secondary",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    icon: TrendingDown,
    label: "Moderado",
  },
};

const categoryConfig = {
  conversion: { icon: Users, label: "Conversão", color: "text-purple-600" },
  financial: { icon: DollarSign, label: "Financeiro", color: "text-green-600" },
  operational: { icon: Settings, label: "Operacional", color: "text-blue-600" },
  engagement: { icon: MessageCircle, label: "Engajamento", color: "text-orange-600" },
  retention: { icon: RotateCcw, label: "Retenção", color: "text-cyan-600" },
};

const trendConfig = {
  improving: { icon: TrendingUp, color: "text-green-600", label: "Melhorando" },
  declining: { icon: TrendingDown, color: "text-red-600", label: "Piorando" },
  stable: { icon: Minus, color: "text-muted-foreground", label: "Estável" },
};

export function BottleneckCard({ bottleneck, onActionClick, compact = false }: BottleneckCardProps) {
  const navigate = useNavigate();
  const config = severityConfig[bottleneck.severity];
  const Icon = config.icon;
  const categoryInfo = bottleneck.category ? categoryConfig[bottleneck.category] : null;
  const trendInfo = bottleneck.trend ? trendConfig[bottleneck.trend] : null;
  const TrendIcon = trendInfo?.icon;

  const handleActionClick = () => {
    if (onActionClick) {
      onActionClick();
    } else if (bottleneck.actionUrl) {
      navigate(bottleneck.actionUrl);
    }
  };

  if (compact) {
    return (
      <div className={cn(
        "p-3 rounded-lg border-2 transition-all hover:shadow-md cursor-pointer",
        config.bgColor,
        config.borderColor
      )}
        onClick={handleActionClick}
      >
        <div className="flex items-start gap-3">
          <div className={cn(
            "p-1.5 rounded",
            bottleneck.severity === "high" && "bg-red-500/20",
            bottleneck.severity === "medium" && "bg-yellow-500/20",
            bottleneck.severity === "low" && "bg-blue-500/20"
          )}>
            <Icon className={cn(
              "h-4 w-4",
              bottleneck.severity === "high" && "text-red-600",
              bottleneck.severity === "medium" && "text-yellow-600",
              bottleneck.severity === "low" && "text-blue-600"
            )} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-foreground truncate">{bottleneck.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold text-foreground">{bottleneck.currentValue}</span>
              {trendInfo && TrendIcon && (
                <TrendIcon className={cn("h-3 w-3", trendInfo.color)} />
              )}
            </div>
          </div>
          <Badge
            variant={config.color as any}
            className="text-xs flex-shrink-0"
          >
            {config.label}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn(
      "border-2 transition-all hover:shadow-lg",
      config.bgColor,
      config.borderColor
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className={cn(
              "p-2 rounded-lg",
              bottleneck.severity === "high" && "bg-red-500/20",
              bottleneck.severity === "medium" && "bg-yellow-500/20",
              bottleneck.severity === "low" && "bg-blue-500/20"
            )}>
              <Icon className={cn(
                "h-5 w-5",
                bottleneck.severity === "high" && "text-red-600 dark:text-red-400",
                bottleneck.severity === "medium" && "text-yellow-600 dark:text-yellow-400",
                bottleneck.severity === "low" && "text-blue-600 dark:text-blue-400"
              )} />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold text-foreground mb-1">
                {bottleneck.title}
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant={config.color as any}
                  className="text-xs"
                >
                  {config.label}
                </Badge>
                {categoryInfo && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <categoryInfo.icon className={cn("h-3 w-3", categoryInfo.color)} />
                    {categoryInfo.label}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Métricas */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{bottleneck.metric}:</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground">
                {bottleneck.currentValue}
              </span>
              {trendInfo && TrendIcon && (
                <div className="flex items-center gap-1">
                  <TrendIcon className={cn("h-4 w-4", trendInfo.color)} />
                  <span className={cn("text-xs", trendInfo.color)}>{trendInfo.label}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Meta:</span>
            <span className="font-medium text-muted-foreground">
              {bottleneck.threshold}
            </span>
          </div>

          {bottleneck.previousValue && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Mês anterior:</span>
              <span className="text-muted-foreground">
                {bottleneck.previousValue}
              </span>
            </div>
          )}
        </div>

        {/* Impacto */}
        {bottleneck.impact && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground mb-1">Impacto:</p>
            <p className="text-sm text-foreground">{bottleneck.impact}</p>
          </div>
        )}

        {/* Sugestão */}
        {bottleneck.suggestion && (
          <div className="pt-2 border-t border-border">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Sugestão:</p>
                <p className="text-sm text-foreground">{bottleneck.suggestion}</p>
              </div>
            </div>
          </div>
        )}

        {/* Ação */}
        {bottleneck.actionUrl && (
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={handleActionClick}
            >
              <ExternalLink className="h-4 w-4" />
              Ver Detalhes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Summary component for bottleneck overview
interface BottleneckSummaryProps {
  summary: {
    critical: number;
    attention: number;
    minor: number;
    healthScore: number;
  };
}

export function BottleneckSummary({ summary }: BottleneckSummaryProps) {
  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getHealthLabel = (score: number) => {
    if (score >= 80) return "Excelente";
    if (score >= 60) return "Bom";
    if (score >= 40) return "Atenção";
    return "Crítico";
  };

  return (
    <div className="grid grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg border border-border">
      <div className="text-center">
        <p className={cn("text-3xl font-bold", getHealthColor(summary.healthScore))}>
          {summary.healthScore}
        </p>
        <p className="text-xs text-muted-foreground">Score de Saúde</p>
        <Badge variant="outline" className={cn("mt-1 text-xs", getHealthColor(summary.healthScore))}>
          {getHealthLabel(summary.healthScore)}
        </Badge>
      </div>
      <div className="text-center">
        <p className="text-3xl font-bold text-red-600">{summary.critical}</p>
        <p className="text-xs text-muted-foreground">Críticos</p>
      </div>
      <div className="text-center">
        <p className="text-3xl font-bold text-yellow-600">{summary.attention}</p>
        <p className="text-xs text-muted-foreground">Atenção</p>
      </div>
      <div className="text-center">
        <p className="text-3xl font-bold text-blue-600">{summary.minor}</p>
        <p className="text-xs text-muted-foreground">Moderados</p>
      </div>
    </div>
  );
}
