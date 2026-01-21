import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
    FileText,
    Search,
    RefreshCcw,
    Building2,
    User,
    Settings,
    Filter
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface LogEntry {
    id: string;
    action: string;
    target_type: string | null;
    target_id: string | null;
    performed_by: string | null;
    details: Record<string, any> | null;
    created_at: string;
}

export default function AdminLogs() {
    const { toast } = useToast();
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionFilter, setActionFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            let query = supabase
                .from('admin_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            const { data, error } = await query;
            if (error) throw error;
            setLogs(data || []);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const getActionColor = (action: string): string => {
        if (action.includes('deleted') || action.includes('suspended')) return 'bg-red-500';
        if (action.includes('created') || action.includes('activated') || action.includes('enabled')) return 'bg-green-500';
        if (action.includes('updated') || action.includes('changed')) return 'bg-blue-500';
        return 'bg-gray-500';
    };

    const getTargetIcon = (type: string | null) => {
        switch (type) {
            case 'organization': return <Building2 className="h-4 w-4" />;
            case 'user': return <User className="h-4 w-4" />;
            case 'system': return <Settings className="h-4 w-4" />;
            default: return <FileText className="h-4 w-4" />;
        }
    };

    const formatAction = (action: string): string => {
        const actionMap: Record<string, string> = {
            'org_created': 'Organização criada',
            'org_deleted': 'Organização excluída',
            'org_suspended': 'Organização suspensa',
            'org_activated': 'Organização ativada',
            'org_plan_changed': 'Plano alterado',
            'user_enabled': 'Usuário ativado',
            'user_disabled': 'Usuário desativado',
            'password_reset_sent': 'Reset de senha enviado',
            'asaas_configured': 'Asaas configurado'
        };
        return actionMap[action] || action;
    };

    const uniqueActions = [...new Set(logs.map(l => l.action))];
    const uniqueTypes = [...new Set(logs.map(l => l.target_type).filter(Boolean))];

    const filteredLogs = logs.filter(log => {
        const matchesSearch =
            log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase());
        const matchesAction = actionFilter === 'all' || log.action === actionFilter;
        const matchesType = typeFilter === 'all' || log.target_type === typeFilter;
        return matchesSearch && matchesAction && matchesType;
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Logs de Auditoria</h1>
                    <p className="text-muted-foreground">Histórico de ações administrativas</p>
                </div>
                <Button onClick={fetchLogs} disabled={isLoading} variant="outline">
                    <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Atualizar
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Logs</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{logs.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Hoje</CardTitle>
                        <FileText className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-500">
                            {logs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Organizações</CardTitle>
                        <Building2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">
                            {logs.filter(l => l.target_type === 'organization').length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Usuários</CardTitle>
                        <User className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-500">
                            {logs.filter(l => l.target_type === 'user').length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filtros
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            <Select value={actionFilter} onValueChange={setActionFilter}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Ação" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas ações</SelectItem>
                                    {uniqueActions.map(action => (
                                        <SelectItem key={action} value={action}>
                                            {formatAction(action)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-36">
                                    <SelectValue placeholder="Tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos tipos</SelectItem>
                                    {uniqueTypes.map(type => (
                                        <SelectItem key={type} value={type!}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Ação</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Detalhes</TableHead>
                                <TableHead>Data/Hora</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                        Nenhum log encontrado
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredLogs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell>
                                            <Badge className={getActionColor(log.action)}>
                                                {formatAction(log.action)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getTargetIcon(log.target_type)}
                                                <span className="capitalize">{log.target_type || '-'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate">
                                            {log.details ? (
                                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                                    {JSON.stringify(log.details)}
                                                </code>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {new Date(log.created_at).toLocaleString('pt-BR')}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
