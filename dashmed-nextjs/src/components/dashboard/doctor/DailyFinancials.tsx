'use client';

import { useMedicalAppointments } from '@/hooks/useMedicalAppointments';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, TrendingUp, Wallet } from 'lucide-react';
import { startOfDay, endOfDay } from 'date-fns';

export function DailyFinancials() {
    const today = new Date();

    // We fetch today's appointments to calculate what was realized/received TODAY
    const { appointments, isLoading } = useMedicalAppointments({
        startDate: startOfDay(today),
        endDate: endOfDay(today),
        status: 'all'
    });

    // Calculate metrics
    const metrics = appointments.reduce((acc, appt) => {
        // Sinal (Signal/Deposit)
        if (appt.sinal_paid && appt.sinal_amount) {
            acc.signals += appt.sinal_amount;
        }

        // Appointment Value (if paid)
        // We assume if status is 'completed' or payment_status is 'paid', the value was received.
        // To be more precise, we should look at financial_transactions, but falling back to estimated_value/amount is a good proxy for the dashboard.
        if (appt.payment_status === 'paid' || (appt.status === 'completed' && appt.payment_status !== 'pending')) {
            // If there's a specific transaction amount, use it. Otherwise use estimated - sinal (if paid).
            // Simplified logic for dashboard:
            const val = appt.financial_transaction?.amount || appt.estimated_value || 0;
            // Subtract signal if it was already counted and included in the total value?
            // Usually estimated_value is total. If signal is paid, remainder is (total - signal).
            // We'll sum distinct buckets for clarity.

            // For this display: "Consultations" = Total value of completed/paid appts minus signals.
            // "Signals" = Total value of signals.
            // This avoids double counting if we want to show "Total Inflow".

            const signalVal = appt.sinal_paid ? (appt.sinal_amount || 0) : 0;
            const consultationPart = Math.max(0, val - signalVal);

            acc.consultations += consultationPart;
        }

        return acc;
    }, { signals: 0, consultations: 0 });

    const total = metrics.signals + metrics.consultations;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(val);
    };

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 gap-4 animate-pulse">
                <div className="h-24 bg-muted rounded-xl"></div>
                <div className="h-24 bg-muted rounded-xl"></div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Total Today */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100 dark:from-green-950/30 dark:to-emerald-950/10 dark:border-green-900/50">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between space-y-0 pb-2">
                        <p className="text-sm font-medium text-green-700 dark:text-green-400">Total Hoje</p>
                        <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex items-baseline space-x-1">
                        <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                            {formatCurrency(total)}
                        </div>
                    </div>
                    <p className="text-xs text-green-600/80 dark:text-green-400/70 mt-1">
                        Previsão de caixa do dia
                    </p>
                </CardContent>
            </Card>

            {/* Sinais / Adiantamentos */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 dark:from-blue-950/30 dark:to-indigo-950/10 dark:border-blue-900/50">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between space-y-0 pb-2">
                        <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Sinais Recebidos</p>
                        <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {formatCurrency(metrics.signals)}
                    </div>
                    <p className="text-xs text-blue-600/80 dark:text-blue-400/70 mt-1">
                        Adiantamentos confirmados
                    </p>
                </CardContent>
            </Card>

            {/* Consultations */}
            <Card className="hidden lg:block bg-gradient-to-br from-purple-50 to-violet-50 border-purple-100 dark:from-purple-950/30 dark:to-violet-950/10 dark:border-purple-900/50">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between space-y-0 pb-2">
                        <p className="text-sm font-medium text-purple-700 dark:text-purple-400">Consultas</p>
                        <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        {formatCurrency(metrics.consultations)}
                    </div>
                    <p className="text-xs text-purple-600/80 dark:text-purple-400/70 mt-1">
                        Restante dos atendimentos
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
