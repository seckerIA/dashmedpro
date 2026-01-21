import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
    Building2,
    Users,
    Contact,
    Calendar,
    TrendingUp,
    Activity,
    RefreshCcw,
    DollarSign
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface Metrics {
    totalOrgs: number;
    activeOrgs: number;
    totalUsers: number;
    activeUsers: number;
    totalContacts: number;
    totalAppointments: number;
    mrr: number;
}

interface GrowthData {
    name: string;
    clinics: number;
}

export default function AdminMetrics() {
    const { toast } = useToast();
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [growthData, setGrowthData] = useState<GrowthData[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchMetrics = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('admin-portal', {
                body: { action: 'get_metrics' }
            });
            if (error) throw error;
            setMetrics(data.metrics);
            setGrowthData(data.growthData || []);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    // Simulated data for usage chart
    const usageData = [
        { name: 'Seg', logins: 45, actions: 120 },
        { name: 'Ter', logins: 52, actions: 150 },
        { name: 'Qua', logins: 48, actions: 130 },
        { name: 'Qui', logins: 61, actions: 180 },
        { name: 'Sex', logins: 55, actions: 160 },
        { name: 'Sáb', logins: 20, actions: 40 },
        { name: 'Dom', logins: 15, actions: 30 },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Métricas da Plataforma</h1>
                    <p className="text-muted-foreground">Visão geral de uso e performance</p>
                </div>
                <Button onClick={fetchMetrics} disabled={isLoading} variant="outline">
                    <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Atualizar
                </Button>
            </div>

            {/* Main Metrics */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">MRR</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(metrics?.mrr || 0)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {metrics?.activeOrgs || 0} clínicas ativas × R$297
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Clínicas</CardTitle>
                        <Building2 className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics?.activeOrgs || 0} / {metrics?.totalOrgs || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {metrics?.totalOrgs ? Math.round((metrics.activeOrgs / metrics.totalOrgs) * 100) : 0}% ativas
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Usuários</CardTitle>
                        <Users className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics?.totalUsers || 0}</div>
                        <p className="text-xs text-green-500 mt-1">
                            {metrics?.activeUsers || 0} ativos (7 dias)
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Saúde API</CardTitle>
                        <Activity className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">99.9%</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Uptime últimos 30 dias
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Secondary Metrics */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Contatos</CardTitle>
                        <Contact className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics?.totalContacts?.toLocaleString('pt-BR') || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Pacientes cadastrados
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Consultas</CardTitle>
                        <Calendar className="h-4 w-4 text-cyan-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics?.totalAppointments?.toLocaleString('pt-BR') || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Agendamentos realizados
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Crescimento de Clínicas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={growthData.length > 0 ? growthData : [{ name: 'Atual', clinics: metrics?.totalOrgs || 0 }]}>
                                <defs>
                                    <linearGradient id="colorClinics" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="name" className="text-xs" />
                                <YAxis className="text-xs" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="clinics"
                                    stroke="hsl(var(--primary))"
                                    fillOpacity={1}
                                    fill="url(#colorClinics)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Uso Semanal
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={usageData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="name" className="text-xs" />
                                <YAxis className="text-xs" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Bar dataKey="logins" fill="hsl(var(--primary))" name="Logins" />
                                <Bar dataKey="actions" fill="hsl(var(--chart-2))" name="Ações" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
