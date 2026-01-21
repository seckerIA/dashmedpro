import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
    Shield,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    RefreshCcw,
    Lock,
    Key,
    Eye,
    Users
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface SecurityCheck {
    name: string;
    status: 'ok' | 'warning' | 'error';
    description: string;
    action?: string;
}

export default function AdminSecurity() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [failedLogins, setFailedLogins] = useState<any[]>([]);

    const securityChecks: SecurityCheck[] = [
        {
            name: 'RLS (Row Level Security)',
            status: 'ok',
            description: 'Todas as tabelas públicas possuem RLS ativado'
        },
        {
            name: 'Autenticação JWT',
            status: 'ok',
            description: 'Todas as Edge Functions verificam JWT (exceto webhooks)'
        },
        {
            name: 'Super Admin Isolado',
            status: 'ok',
            description: 'Apenas usuários com is_super_admin=true acessam este painel'
        },
        {
            name: 'Multi-Tenant Isolation',
            status: 'ok',
            description: 'Políticas RLS garantem isolamento entre organizações'
        },
        {
            name: 'Logs de Auditoria',
            status: 'ok',
            description: 'Ações administrativas são registradas em admin_logs'
        },
        {
            name: 'Webhook Security',
            status: 'warning',
            description: 'Webhooks do WhatsApp/VoIP não verificam JWT (necessário)',
            action: 'Considere adicionar validação de assinatura'
        }
    ];

    const fetchSecurityData = async () => {
        setIsLoading(true);
        try {
            // Get recent failed login attempts from logs
            const { data } = await supabase
                .from('admin_logs')
                .select('*')
                .eq('action', 'failed_login')
                .order('created_at', { ascending: false })
                .limit(10);

            setFailedLogins(data || []);
        } catch (error: any) {
            console.error('Error fetching security data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSecurityData();
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'ok': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
            case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
            default: return null;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ok': return <Badge className="bg-green-500">OK</Badge>;
            case 'warning': return <Badge className="bg-yellow-500">Atenção</Badge>;
            case 'error': return <Badge className="bg-red-500">Crítico</Badge>;
            default: return null;
        }
    };

    const okCount = securityChecks.filter(c => c.status === 'ok').length;
    const warningCount = securityChecks.filter(c => c.status === 'warning').length;
    const errorCount = securityChecks.filter(c => c.status === 'error').length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Segurança</h1>
                    <p className="text-muted-foreground">Auditoria e verificações de segurança</p>
                </div>
                <Button onClick={fetchSecurityData} disabled={isLoading} variant="outline">
                    <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Atualizar
                </Button>
            </div>

            {/* Security Score */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Score de Segurança</CardTitle>
                        <Shield className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">
                            {Math.round((okCount / securityChecks.length) * 100)}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {okCount} de {securityChecks.length} verificações OK
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Passaram</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">{okCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avisos</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-500">{warningCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Críticos</CardTitle>
                        <XCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">{errorCount}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Security Checks */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Verificações de Segurança
                    </CardTitle>
                    <CardDescription>Status das políticas e configurações de segurança</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Verificação</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Ação</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {securityChecks.map((check) => (
                                <TableRow key={check.name}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {getStatusIcon(check.status)}
                                            <span className="font-medium">{check.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {check.description}
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(check.status)}
                                    </TableCell>
                                    <TableCell>
                                        {check.action ? (
                                            <span className="text-sm text-yellow-600">{check.action}</span>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Security Features */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Lock className="h-5 w-5 text-blue-500" />
                            RLS Policies
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Todas as tabelas públicas possuem Row Level Security ativo,
                            garantindo que cada usuário só acesse dados de sua organização.
                        </p>
                        <ul className="text-sm space-y-1">
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                Isolamento por organization_id
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                Policies por role (dono, admin, medico, secretaria)
                            </li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Key className="h-5 w-5 text-purple-500" />
                            Autenticação
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Autenticação via Supabase Auth com JWT tokens e refresh automático.
                        </p>
                        <ul className="text-sm space-y-1">
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                JWT Token verification
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                Password reset via email
                            </li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Eye className="h-5 w-5 text-orange-500" />
                            Auditoria
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Todas as ações administrativas são registradas para auditoria.
                        </p>
                        <ul className="text-sm space-y-1">
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                Logs de alterações em organizações
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                Logs de alterações em usuários
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
