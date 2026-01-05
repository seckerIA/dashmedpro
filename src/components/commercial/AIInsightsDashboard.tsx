/**
 * AI Insights Dashboard Component
 * Main component for the Intelligence tab
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAIInsights } from '@/hooks/useAIInsights';
import { InsightCard } from './InsightCard';
import {
    Brain,
    Loader2,
    Sparkles,
    TrendingUp,
    MessageSquare,
    Calendar,
    Users,
    Settings,
    DollarSign,
    AlertCircle,
    Zap,
    Clock
} from 'lucide-react';
import { INSIGHT_CATEGORY_CONFIG, InsightCategory } from '@/types/aiInsights';
import { AnimatedWrapper } from '@/components/shared/AnimatedWrapper';

const categoryIcons: Record<InsightCategory, React.ReactNode> = {
    conversion: <TrendingUp className="h-4 w-4" />,
    messages: <MessageSquare className="h-4 w-4" />,
    scheduling: <Calendar className="h-4 w-4" />,
    leads: <Users className="h-4 w-4" />,
    operational: <Settings className="h-4 w-4" />,
    financial: <DollarSign className="h-4 w-4" />,
};

export function AIInsightsDashboard() {
    const {
        insights,
        isInsightsLoading,
        runAnalysis,
        isAnalyzing,
        insightsByCategory,
        highImpactCount,
        markAsApplied,
        dismissInsight,
        lastAnalysisTime,
    } = useAIInsights();

    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const filteredInsights = selectedCategory === 'all'
        ? insights.filter(i => i.is_actionable)
        : insights.filter(i => i.category === selectedCategory && i.is_actionable);

    const appliedCount = insights.filter(i => i.is_applied).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Brain className="h-6 w-6 text-primary" />
                        Inteligência de Dados
                    </h2>
                    <p className="text-muted-foreground">
                        Análise inteligente do seu CRM com recomendações acionáveis
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {lastAnalysisTime && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Última análise: {new Date(lastAnalysisTime).toLocaleString('pt-BR')}
                        </div>
                    )}
                    <Button
                        onClick={() => runAnalysis.mutate()}
                        disabled={isAnalyzing}
                        size="lg"
                        className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Analisando...
                            </>
                        ) : (
                            <>
                                <Zap className="h-5 w-5" />
                                Analisar com IA
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            {insights.length > 0 && (
                <AnimatedWrapper animationType="fadeIn">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
                            <CardContent className="p-4 text-center">
                                <Sparkles className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                                <div className="text-3xl font-bold text-purple-600">{insights.length}</div>
                                <div className="text-sm text-muted-foreground">Insights</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20">
                            <CardContent className="p-4 text-center">
                                <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
                                <div className="text-3xl font-bold text-red-600">{highImpactCount}</div>
                                <div className="text-sm text-muted-foreground">Alto Impacto</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                            <CardContent className="p-4 text-center">
                                <TrendingUp className="h-6 w-6 text-green-500 mx-auto mb-2" />
                                <div className="text-3xl font-bold text-green-600">{appliedCount}</div>
                                <div className="text-sm text-muted-foreground">Aplicados</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                            <CardContent className="p-4 text-center">
                                <Brain className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                                <div className="text-3xl font-bold text-blue-600">
                                    {Object.keys(insightsByCategory).length}
                                </div>
                                <div className="text-sm text-muted-foreground">Categorias</div>
                            </CardContent>
                        </Card>
                    </div>
                </AnimatedWrapper>
            )}

            {/* Category Filter */}
            {insights.length > 0 && (
                <AnimatedWrapper animationType="slideUp" delay={0.1}>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant={selectedCategory === 'all' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedCategory('all')}
                        >
                            Todos ({insights.filter(i => i.is_actionable).length})
                        </Button>
                        {Object.entries(INSIGHT_CATEGORY_CONFIG).map(([key, config]) => {
                            const count = insightsByCategory[key] || 0;
                            if (count === 0) return null;
                            return (
                                <Button
                                    key={key}
                                    variant={selectedCategory === key ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setSelectedCategory(key)}
                                    className="gap-1"
                                >
                                    {categoryIcons[key as InsightCategory]}
                                    {config.label} ({count})
                                </Button>
                            );
                        })}
                    </div>
                </AnimatedWrapper>
            )}

            {/* Insights Grid */}
            {isInsightsLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : insights.length === 0 ? (
                <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
                    <CardContent className="p-12 text-center">
                        <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-6">
                            <Brain className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">Descubra Insights do seu CRM</h3>
                        <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                            A Inteligência Artificial vai analisar seus leads, agendamentos, conversas e vendas
                            para identificar padrões e oportunidades de melhoria.
                        </p>
                        <div className="flex flex-wrap justify-center gap-3 mb-6">
                            <Badge variant="outline" className="gap-1 py-1">
                                <TrendingUp className="h-3 w-3" /> Melhores horários
                            </Badge>
                            <Badge variant="outline" className="gap-1 py-1">
                                <MessageSquare className="h-3 w-3" /> Frases eficazes
                            </Badge>
                            <Badge variant="outline" className="gap-1 py-1">
                                <Calendar className="h-3 w-3" /> Padrões de no-show
                            </Badge>
                            <Badge variant="outline" className="gap-1 py-1">
                                <Users className="h-3 w-3" /> Leads prioritários
                            </Badge>
                        </div>
                        <Button
                            size="lg"
                            onClick={() => runAnalysis.mutate()}
                            disabled={isAnalyzing}
                            className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        >
                            {isAnalyzing ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Analisando dados...
                                </>
                            ) : (
                                <>
                                    <Zap className="h-5 w-5" />
                                    Iniciar Análise com IA
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredInsights.map((insight, index) => (
                        <AnimatedWrapper
                            key={insight.id}
                            animationType="slideUp"
                            delay={0.1 + index * 0.05}
                        >
                            <InsightCard
                                insight={insight}
                                onApply={() => markAsApplied.mutate(insight.id)}
                                onDismiss={() => dismissInsight.mutate(insight.id)}
                            />
                        </AnimatedWrapper>
                    ))}
                </div>
            )}
        </div>
    );
}
