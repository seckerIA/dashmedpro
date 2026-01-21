import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import {
    Search,
    Users,
    UserCheck,
    UserX,
    Shield,
    MoreVertical,
    RefreshCcw,
    KeyRound,
    Ban,
    CheckCircle
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface User {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    avatar_url: string | null;
    is_active: boolean | null;
    is_super_admin: boolean | null;
    created_at: string;
    organization_id: string | null;
    organizations: {
        id: string;
        name: string;
        slug: string;
    } | null;
}

export default function AdminUsers() {
    const { toast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [actionUser, setActionUser] = useState<User | null>(null);
    const [actionType, setActionType] = useState<'disable' | 'enable' | 'reset'>('disable');

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('admin-portal', {
                body: { action: 'list_users' }
            });
            if (error) throw error;
            setUsers(data.users || []);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const toggleUserStatus = async () => {
        if (!actionUser) return;
        const newStatus = actionType === 'enable';
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ is_active: newStatus })
                .eq('id', actionUser.id);

            if (error) throw error;

            await supabase.from('admin_logs').insert({
                action: newStatus ? 'user_enabled' : 'user_disabled',
                target_type: 'user',
                target_id: actionUser.id,
                details: { email: actionUser.email }
            });

            toast({ title: 'Sucesso', description: `Usuário ${newStatus ? 'ativado' : 'desativado'}` });
            setIsConfirmOpen(false);
            fetchUsers();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro', description: error.message });
        }
    };

    const resetPassword = async () => {
        if (!actionUser?.email) return;
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(actionUser.email, {
                redirectTo: `${window.location.origin}/reset-password`
            });

            if (error) throw error;

            await supabase.from('admin_logs').insert({
                action: 'password_reset_sent',
                target_type: 'user',
                target_id: actionUser.id,
                details: { email: actionUser.email }
            });

            toast({ title: 'Sucesso', description: 'Email de redefinição enviado' });
            setIsConfirmOpen(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro', description: error.message });
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch =
                user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false);

            const matchesRole = roleFilter === 'all' || user.role === roleFilter;
            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'active' && user.is_active !== false) ||
                (statusFilter === 'inactive' && user.is_active === false);

            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [users, searchTerm, roleFilter, statusFilter]);

    const roleColors: Record<string, string> = {
        admin: 'bg-red-500',
        dono: 'bg-purple-500',
        medico: 'bg-blue-500',
        secretaria: 'bg-green-500',
        vendedor: 'bg-orange-500',
        gestor_trafego: 'bg-yellow-500'
    };

    const handleAction = (user: User, type: 'disable' | 'enable' | 'reset') => {
        setActionUser(user);
        setActionType(type);
        setIsConfirmOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Gerenciamento de Usuários</h1>
                    <p className="text-muted-foreground">Visualize e gerencie todos os usuários da plataforma</p>
                </div>
                <Button onClick={fetchUsers} disabled={isLoading} variant="outline">
                    <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Atualizar
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{users.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ativos</CardTitle>
                        <UserCheck className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">
                            {users.filter(u => u.is_active !== false).length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Inativos</CardTitle>
                        <UserX className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">
                            {users.filter(u => u.is_active === false).length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
                        <Shield className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-500">
                            {users.filter(u => u.is_super_admin).length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <CardTitle>Usuários Cadastrados</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar usuários..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger className="w-36">
                                    <SelectValue placeholder="Função" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="dono">Dono</SelectItem>
                                    <SelectItem value="medico">Médico</SelectItem>
                                    <SelectItem value="secretaria">Secretária</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-32">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="active">Ativos</SelectItem>
                                    <SelectItem value="inactive">Inativos</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Usuário</TableHead>
                                <TableHead>Organização</TableHead>
                                <TableHead>Função</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Criado em</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={user.avatar_url || undefined} />
                                                <AvatarFallback>
                                                    {user.email.slice(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium flex items-center gap-2">
                                                    {user.full_name || user.email.split('@')[0]}
                                                    {user.is_super_admin && (
                                                        <Shield className="h-3 w-3 text-purple-500" />
                                                    )}
                                                </div>
                                                <div className="text-sm text-muted-foreground">{user.email}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {user.organizations?.name || (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={roleColors[user.role] || 'bg-gray-500'}>
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.is_active !== false ? 'default' : 'destructive'}>
                                            {user.is_active !== false ? 'Ativo' : 'Inativo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleAction(user, 'reset')}>
                                                    <KeyRound className="mr-2 h-4 w-4" />
                                                    Resetar Senha
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                {user.is_active !== false ? (
                                                    <DropdownMenuItem
                                                        className="text-red-600"
                                                        onClick={() => handleAction(user, 'disable')}
                                                    >
                                                        <Ban className="mr-2 h-4 w-4" />
                                                        Desativar
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem
                                                        className="text-green-600"
                                                        onClick={() => handleAction(user, 'enable')}
                                                    >
                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                        Ativar
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Confirmation Dialog */}
            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {actionType === 'reset' ? 'Resetar Senha?' :
                                actionType === 'disable' ? 'Desativar Usuário?' : 'Ativar Usuário?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {actionType === 'reset'
                                ? `Um email de redefinição será enviado para ${actionUser?.email}`
                                : actionType === 'disable'
                                    ? `O usuário ${actionUser?.email} não poderá acessar o sistema`
                                    : `O usuário ${actionUser?.email} poderá acessar o sistema novamente`
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={actionType === 'reset' ? resetPassword : toggleUserStatus}
                            className={actionType === 'disable' ? 'bg-red-600 hover:bg-red-700' : undefined}
                        >
                            Confirmar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
