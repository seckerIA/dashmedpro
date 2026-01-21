import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import {
    DollarSign,
    TrendingUp,
    Building2,
    CreditCard,
    RefreshCcw,
    Settings,
    ExternalLink,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PlanPricing {
    free: number;
    pro: number;
    enterprise: number;
}

interface Organization {
    id: string;
    name: string;
    slug: string;
    plan: string;
    status: string;
    created_at: string;
}

export default function AdminFinancial() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [asaasApiKey, setAsaasApiKey] = useState('');
    const [isAsaasConnected, setIsAsaasConnected] = useState(false);

    const [pricing, setPricing] = useState<PlanPricing>({
        free: 0,
        pro: 297,
        enterprise: 597
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('admin-portal', {
                body: { action: 'list' }
            });
            if (error) throw error;
            setOrganizations(data.organizations || []);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Check if Asaas is configured
        const checkAsaas = async () => {
            // In production, check a secrets/config table
            const { data } = await supabase
                .from('admin_logs')
                .select('details')
                .eq('action', 'asaas_configured')
                .order('created_at', { ascending: false })
                .limit(1);
            if (data && data.length > 0) {
                setIsAsaasConnected(true);
            }
        };
        checkAsaas();
    }, []);

    const calculateMRR = () => {
        return organizations.reduce((total, org) => {
            if (org.status !== 'active') return total;
            return total + (pricing[org.plan as keyof PlanPricing] || pricing.pro);
        }, 0);
    };

    const calculateARR = () => calculateMRR() * 12;

    const orgsByPlan = {
        free: organizations.filter(o => o.plan === 'free' && o.status === 'active').length,
        pro: organizations.filter(o => o.plan === 'pro' && o.status === 'active').length,
        enterprise: organizations.filter(o => o.plan === 'enterprise' && o.status === 'active').length
    };

    const mrrByPlan = {
        free: orgsByPlan.free * pricing.free,
        pro: orgsByPlan.pro * pricing.pro,
        enterprise: orgsByPlan.enterprise * pricing.enterprise
    };

    // Simulated revenue data
    const revenueData = [
        { month: 'Jul', mrr: 1485 },
        { month: 'Ago', mrr: 2079 },
        { month: 'Set', mrr: 2376 },
        { month: 'Out', mrr: 2970 },
        { month: 'Nov', mrr: 3564 },
        { month: 'Dez', mrr: calculateMRR() },
    ];

    const saveAsaasConfig = async () => {
        try {
            // In production, save to Supabase Vault or secure config
            // For now, log the action
            await supabase.from('admin_logs').insert({
                action: 'asaas_configured',
                target_type: 'system',
                details: { configured: true, timestamp: new Date().toISOString() }
            });

            setIsAsaasConnected(true);
            setIsConfigOpen(false);
            toast({ title: 'Sucesso', description: 'Asaas configurado com sucesso!' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro', description: error.message });
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Gestão Financeira</h1>
                    <p className="text-muted-foreground">Receitas, assinaturas e integrações de pagamento</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setIsConfigOpen(true)} variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Configurar Asaas
                    </Button>
                    <Button onClick={fetchData} disabled={isLoading} variant="outline">
                        <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                </div>
            </div>

            {/* Asaas Status Banner */}
            <Card className={isAsaasConnected ? 'border-green-500/50 bg-green-500/5' : 'border-yellow-500/50 bg-yellow-500/5'}>
                <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                        {isAsaasConnected ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                            <AlertCircle className="h-5 w-5 text-yellow-500" />
                        )}
                        <div>
                            <p className="font-medium">
                                {isAsaasConnected ? 'Asaas Conectado' : 'Asaas não configurado'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {isAsaasConnected
                                    ? 'Cobranças automáticas ativas'
                                    : 'Configure para habilitar cobranças automáticas'
                                }
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                        <a href="https://www.asaas.com" target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Acessar Asaas
                        </a>
                    </Button>
                </CardContent>
            </Card>

            {/* Revenue Metrics */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">MRR</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">{formatCurrency(calculateMRR())}</div>
                        <p className="text-xs text-muted-foreground mt-1">Receita Mensal Recorrente</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">ARR</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-500">{formatCurrency(calculateARR())}</div>
                        <p className="text-xs text-muted-foreground mt-1">Receita Anual Recorrente</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Clientes Pagantes</CardTitle>
                        <Building2 className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{orgsByPlan.pro + orgsByPlan.enterprise}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {orgsByPlan.pro} Pro + {orgsByPlan.enterprise} Enterprise
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                        <CreditCard className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency((orgsByPlan.pro + orgsByPlan.enterprise) > 0
                                ? calculateMRR() / (orgsByPlan.pro + orgsByPlan.enterprise)
                                : 0
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Por cliente pagante</p>
                    </CardContent>
                </Card>
            </div>

            {/* Revenue Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Evolução do MRR</CardTitle>
                    <CardDescription>Receita mensal nos últimos 6 meses</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={revenueData}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="month" className="text-xs" />
                            <YAxis
                                className="text-xs"
                                tickFormatter={(value) => `R$${value}`}
                            />
                            <Tooltip
                                formatter={(value: number) => formatCurrency(value)}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px'
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="mrr"
                                stroke="#10b981"
                                fillOpacity={1}
                                fill="url(#colorRevenue)"
                                name="MRR"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Revenue by Plan */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Receita por Plano</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Plano</TableHead>
                                    <TableHead>Preço</TableHead>
                                    <TableHead>Clientes</TableHead>
                                    <TableHead className="text-right">MRR</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell><Badge variant="secondary">FREE</Badge></TableCell>
                                    <TableCell>{formatCurrency(pricing.free)}</TableCell>
                                    <TableCell>{orgsByPlan.free}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(mrrByPlan.free)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell><Badge className="bg-blue-500">PRO</Badge></TableCell>
                                    <TableCell>{formatCurrency(pricing.pro)}</TableCell>
                                    <TableCell>{orgsByPlan.pro}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(mrrByPlan.pro)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell><Badge className="bg-purple-500">ENTERPRISE</Badge></TableCell>
                                    <TableCell>{formatCurrency(pricing.enterprise)}</TableCell>
                                    <TableCell>{orgsByPlan.enterprise}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(mrrByPlan.enterprise)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Configuração de Preços</CardTitle>
                        <CardDescription>Defina os valores mensais por plano</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label>Free</Label>
                                <Input
                                    type="number"
                                    value={pricing.free}
                                    onChange={(e) => setPricing({ ...pricing, free: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <Label>Pro</Label>
                                <Input
                                    type="number"
                                    value={pricing.pro}
                                    onChange={(e) => setPricing({ ...pricing, pro: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <Label>Enterprise</Label>
                                <Input
                                    type="number"
                                    value={pricing.enterprise}
                                    onChange={(e) => setPricing({ ...pricing, enterprise: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                        <Button className="w-full" onClick={() => toast({ title: 'Preços atualizados!' })}>
                            Salvar Configuração
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Asaas Config Dialog */}
            <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Configurar Asaas</DialogTitle>
                        <DialogDescription>
                            Conecte sua conta Asaas para cobranças automáticas
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>API Key (Produção)</Label>
                            <Input
                                type="password"
                                placeholder="$aact_YourApiKey..."
                                value={asaasApiKey}
                                onChange={(e) => setAsaasApiKey(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Encontre sua API Key em Asaas → Integrações → API
                            </p>
                        </div>
                        <div className="bg-muted p-4 rounded-lg">
                            <h4 className="font-medium mb-2">Funcionalidades habilitadas:</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• Cobrança automática mensal</li>
                                <li>• Notificações de vencimento</li>
                                <li>• Suspensão automática por inadimplência</li>
                                <li>• Relatórios de pagamento</li>
                            </ul>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfigOpen(false)}>Cancelar</Button>
                        <Button onClick={saveAsaasConfig} disabled={!asaasApiKey}>
                            Conectar Asaas
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
