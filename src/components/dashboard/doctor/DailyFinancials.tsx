
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, AlertCircle, ArrowRight } from "lucide-react";
import { SkeletonShimmer } from "@/components/ui/skeleton-shimmer";
import { AnimatedCurrency, AnimatedNumber } from "@/components/ui/animated-number";
import { useNavigate } from "react-router-dom";
import { useMedicalAppointments } from "@/hooks/useMedicalAppointments";
import { useAuth } from "@/hooks/useAuth";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, subDays } from "date-fns";
import { useMemo } from "react";

export function DailyFinancials() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const today = useMemo(() => new Date(), []);
    const yesterday = useMemo(() => subDays(today, 1), [today]);

    // Today's appointments
    const { appointments: todayAppointments, isLoading: loadingToday } = useMedicalAppointments({
        startDate: startOfDay(today),
        endDate: endOfDay(today),
        doctorIds: user?.id ? [user.id] : undefined
    });

    // Yesterday's appointments (for comparison)
    const { appointments: yesterdayAppointments, isLoading: loadingYesterday } = useMedicalAppointments({
        startDate: startOfDay(yesterday),
        endDate: endOfDay(yesterday),
        doctorIds: user?.id ? [user.id] : undefined
    });

    // This week's appointments
    const { appointments: weekAppointments, isLoading: loadingWeek } = useMedicalAppointments({
        startDate: startOfWeek(today, { weekStartsOn: 1 }),
        endDate: endOfWeek(today, { weekStartsOn: 1 }),
        doctorIds: user?.id ? [user.id] : undefined
    });

    const isLoading = loadingToday || loadingYesterday || loadingWeek;

    // Calculate today's revenue from paid appointments (regardless of completion status)
    const todayRevenue = useMemo(() => {
        if (!todayAppointments) return 0;
        return todayAppointments
            .filter(apt => apt.payment_status === 'paid')
            .reduce((sum, apt) => sum + (apt.estimated_value || 0), 0);
    }, [todayAppointments]);

    // Calculate yesterday's revenue for comparison
    const yesterdayRevenue = useMemo(() => {
        if (!yesterdayAppointments) return 0;
        return yesterdayAppointments
            .filter(apt => apt.payment_status === 'paid')
            .reduce((sum, apt) => sum + (apt.estimated_value || 0), 0);
    }, [yesterdayAppointments]);

    // Calculate week's total revenue
    const weekRevenue = useMemo(() => {
        if (!weekAppointments) return 0;
        return weekAppointments
            .filter(apt => apt.payment_status === 'paid')
            .reduce((sum, apt) => sum + (apt.estimated_value || 0), 0);
    }, [weekAppointments]);

    // Count pending signals (sinal not paid)
    const pendingSignals = useMemo(() => {
        if (!todayAppointments) return 0;
        return todayAppointments.filter(apt =>
            apt.sinal_amount && apt.sinal_amount > 0 && !apt.sinal_paid
        ).length;
    }, [todayAppointments]);

    // Calculate percentage change
    const percentChange = useMemo(() => {
        if (yesterdayRevenue === 0) return todayRevenue > 0 ? 100 : 0;
        return ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;
    }, [todayRevenue, yesterdayRevenue]);

    // Calculate week progress (what percentage of appointments completed)
    const weekProgress = useMemo(() => {
        if (!weekAppointments || weekAppointments.length === 0) return 0;
        const completed = weekAppointments.filter(apt => apt.status === 'completed').length;
        return Math.round((completed / weekAppointments.length) * 100);
    }, [weekAppointments]);

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
                            {percentChange !== 0 && (
                                <Badge
                                    variant="outline"
                                    className={`${percentChange >= 0
                                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                        : 'bg-red-500/10 text-red-600 border-red-500/20'
                                    } text-[10px] h-5 px-1.5 gap-0.5`}
                                >
                                    <TrendingUp className={`w-2.5 h-2.5 ${percentChange < 0 ? 'rotate-180' : ''}`} />
                                    {percentChange >= 0 ? '+' : ''}{percentChange.toFixed(0)}%
                                </Badge>
                            )}
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
                                    <AnimatedNumber value={pendingSignals} duration={0.8} />
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {pendingSignals === 0 ? 'tudo em dia' : 'aguardando liberacao'}
                                </span>
                            </div>
                        </div>
                        <div className={`${pendingSignals > 0 ? 'bg-orange-500/10 text-orange-600' : 'bg-emerald-500/10 text-emerald-600'} p-2 rounded-lg`}>
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
                        <div
                            className="bg-blue-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${weekProgress}%` }}
                        />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 text-right">
                        {weekProgress}% concluído
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
