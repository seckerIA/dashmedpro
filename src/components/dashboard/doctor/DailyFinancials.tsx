
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, TrendingDown, ArrowRight, CreditCard, AlertCircle } from "lucide-react";
import { useFinancialMetrics } from "@/hooks/useFinancialMetrics"; // Assuming this exists or use a generic hook
import { formatCurrency } from "@/lib/currency"; // Assuming utility exists
import { SkeletonShimmer } from "@/components/ui/skeleton-shimmer";
import { AnimatedCurrency, AnimatedNumber } from "@/components/ui/animated-number";
import { useNavigate } from "react-router-dom";

export function DailyFinancials() {
    const navigate = useNavigate();
    // For now, using mock data or simple hooks. 
    // In a real scenario, useFinancialMetrics would be used.
    const isLoading = false;
    const todayRevenue = 1250.00;
    const weekRevenue = 8400.00;
    const pendingPayments = 2;

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="p-5">
                        <div className="space-y-3">
                            <SkeletonShimmer className="h-3 w-24" />
                            <SkeletonShimmer className="h-8 w-32" />
                            <SkeletonShimmer className="h-2 w-16" />
                        </div>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Today's Revenue */}
            <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                    <DollarSign className="w-16 h-16 text-emerald-500" />
                </div>
                <CardContent className="p-5">
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-emerald-600/80 uppercase tracking-wider">Faturamento Hoje</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-foreground">
                                <AnimatedCurrency value={todayRevenue} duration={1.2} />
                            </span>
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] h-5 px-1.5 gap-0.5">
                                <TrendingUp className="w-2.5 h-2.5" /> +12%
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">vs. ontem</p>
                    </div>
                </CardContent>
            </Card>

            {/* Signals / Pending */}
            <Card
                className="bg-card border-border shadow-sm cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigate('/financeiro?tab=sinais')}
            >
                <CardContent className="p-5 flex flex-col justify-between h-full">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sinais Pendentes</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-foreground">
                                    <AnimatedNumber value={pendingPayments} duration={0.8} />
                                </span>
                                <span className="text-xs text-muted-foreground">aguardando liberacao</span>
                            </div>
                        </div>
                        <div className="bg-orange-500/10 p-2 rounded-lg text-orange-600">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" className="w-full justify-between text-xs mt-2 h-7 px-0 hover:bg-transparent hover:text-primary">
                        Ver pendências <ArrowRight className="w-3 h-3" />
                    </Button>
                </CardContent>
            </Card>

            {/* Weekly Projection */}
            <Card
                className="bg-card border-border shadow-sm hidden md:block cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigate('/financeiro?tab=dashboard')}
            >
                <CardContent className="p-5 flex flex-col justify-between h-full">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Acumulado Semana</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-foreground">
                                    <AnimatedCurrency value={weekRevenue} duration={1.5} delay={0.3} />
                                </span>
                            </div>
                        </div>
                        <div className="bg-blue-500/10 p-2 rounded-lg text-blue-600">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="w-full bg-secondary/50 h-1.5 rounded-full mt-auto overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full w-[70%]" />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 text-right">70% da meta semanal</p>
                </CardContent>
            </Card>
        </div>
    );
}
