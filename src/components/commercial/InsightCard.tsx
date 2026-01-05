/**
 * Individual Insight Card Component
 */

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    TrendingUp,
    TrendingDown,
    Minus,
    MessageSquare,
    Calendar,
    Users,
    Settings,
    DollarSign,
    Check,
    X,
    Sparkles
} from 'lucide-react';
import { AIInsight, INSIGHT_CATEGORY_CONFIG, INSIGHT_IMPACT_CONFIG, INSIGHT_TREND_CONFIG, InsightCategory } from '@/types/aiInsights';
import { cn } from '@/lib/utils';

interface InsightCardProps {
    insight: AIInsight;
    onApply?: () => void;
    onDismiss?: () => void;
}

const categoryIcons: Record<InsightCategory, React.ReactNode> = {
    conversion: <TrendingUp className="h-4 w-4" />,
    messages: <MessageSquare className="h-4 w-4" />,
    scheduling: <Calendar className="h-4 w-4" />,
    leads: <Users className="h-4 w-4" />,
    operational: <Settings className="h-4 w-4" />,
    financial: <DollarSign className="h-4 w-4" />,
};

const trendIcons = {
    improving: <TrendingUp className="h-4 w-4" />,
    declining: <TrendingDown className="h-4 w-4" />,
    stable: <Minus className="h-4 w-4" />,
};

export function InsightCard({ insight, onApply, onDismiss }: InsightCardProps) {
    const categoryConfig = INSIGHT_CATEGORY_CONFIG[insight.category];
    const impactConfig = INSIGHT_IMPACT_CONFIG[insight.impact];
    const trendConfig = insight.trend ? INSIGHT_TREND_CONFIG[insight.trend] : null;

    return (
        <Card className={cn(
            'border-l-4 transition-all hover:shadow-lg',
            insight.impact === 'high' && 'border-l-red-500 bg-red-500/5',
            insight.impact === 'medium' && 'border-l-yellow-500 bg-yellow-500/5',
            insight.impact === 'low' && 'border-l-blue-500 bg-blue-500/5',
            insight.is_applied && 'opacity-60'
        )}>
            <CardContent className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1">
                        <div className={cn(
                            'p-2 rounded-lg',
                            impactConfig.bgColor
                        )}>
                            <Sparkles className={cn('h-4 w-4', impactConfig.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground leading-tight">
                                {insight.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Badge variant="outline" className="text-xs gap-1">
                                    {categoryIcons[insight.category]}
                                    {categoryConfig.label}
                                </Badge>
                                <Badge
                                    variant={insight.impact === 'high' ? 'destructive' : 'secondary'}
                                    className="text-xs"
                                >
                                    {impactConfig.label}
                                </Badge>
                                {trendConfig && (
                                    <span className={cn('text-xs flex items-center gap-1', trendConfig.color)}>
                                        {trendIcons[insight.trend!]}
                                        {trendConfig.label}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    {insight.is_applied && (
                        <Badge variant="default" className="bg-green-500 text-xs">
                            <Check className="h-3 w-3 mr-1" />
                            Aplicado
                        </Badge>
                    )}
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {insight.description}
                </p>

                {/* Confidence */}
                {insight.confidence > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Confiança:</span>
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    'h-full rounded-full',
                                    insight.confidence >= 0.8 && 'bg-green-500',
                                    insight.confidence >= 0.6 && insight.confidence < 0.8 && 'bg-yellow-500',
                                    insight.confidence < 0.6 && 'bg-red-500',
                                )}
                                style={{ width: `${insight.confidence * 100}%` }}
                            />
                        </div>
                        <span className="font-medium">{(insight.confidence * 100).toFixed(0)}%</span>
                    </div>
                )}

                {/* Data Sources */}
                {insight.data_sources && insight.data_sources.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>Fontes:</span>
                        {insight.data_sources.map((source, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs py-0">
                                {source}
                            </Badge>
                        ))}
                    </div>
                )}

                {/* Actions */}
                {!insight.is_applied && insight.is_actionable && (
                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                        <Button
                            size="sm"
                            variant="default"
                            onClick={onApply}
                            className="flex-1 gap-1"
                        >
                            <Check className="h-4 w-4" />
                            Marcar como Aplicado
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={onDismiss}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
