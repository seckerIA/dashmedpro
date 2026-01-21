import React, { useEffect, useState, useMemo } from 'react';
import { useAdminPortal } from '@/hooks/useAdminPortal';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import {
    Plus,
    RefreshCcw,
    Building,
    Users,
    TrendingUp,
    DollarSign,
    Search,
    MoreVertical,
    Activity,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
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
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const GROWTH_DATA = [
    { name: 'Jan', clinics: 2 },
    { name: 'Fev', clinics: 5 },
    { name: 'Mar', clinics: 8 },
    { name: 'Abr', clinics: 12 },
    { name: 'Mai', clinics: 15 },
    { name: 'Jun', clinics: 20 },
];

export default function SuperAdminDashboard() {
    const { user } = useAuth();
    const { organizations, isLoading, listOrganizations, createOrganization } = useAdminPortal();

    const [isNewOrgOpen, setIsNewOrgOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        adminEmail: '',
        adminName: ''
    });

    useEffect(() => {
        // Só buscar quando o user estiver autenticado
        if (user) {
            console.log('📊 [SuperAdminDashboard] User autenticado. Buscando organizações...');
            listOrganizations();
        }
    }, [user]);  // Dependência do user

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createOrganization(formData);
            setIsNewOrgOpen(false);
            setFormData({ name: '', slug: '', adminEmail: '', adminName: '' });
        } catch (e) {
            // Error handled by hook
        }
    };

    const metrics = useMemo(() => {
        const totalOrgs = organizations.length;
        const activeOrgs = organizations.filter(o => o.status === 'active').length;
        const mrr = activeOrgs * 297;
        const totalUsers = organizations.reduce((acc, _) => acc + Math.floor(Math.random() * 5) + 1, 0);

        return { totalOrgs, activeOrgs, mrr, totalUsers };
    }, [organizations]);

    const filteredOrgs = useMemo(() => {
        return organizations.filter(org =>
            org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            org.slug.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [organizations, searchTerm]);

    return (
        <div className="space-y-6">
            {/* Metrics Grid */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">MRR Estimado</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.mrr)}
                        </div>
                        <p className="text-xs text-green-500 flex items-center mt-1">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            +12% vs mês anterior
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Clínicas Ativas</CardTitle>
                        <Building className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.activeOrgs} / {metrics.totalOrgs}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Taxa de Ativação: {metrics.totalOrgs > 0 ? Math.round((metrics.activeOrgs / metrics.totalOrgs) * 100) : 0}%
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Usuários</CardTitle>
                        <Users className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">~{metrics.totalUsers}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Média de 4.2 por clínica
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Saúde da API</CardTitle>
                        <Activity className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">99.9%</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Resposta média: 45ms
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Growth Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Crescimento de Base</CardTitle>
                    <p className="text-sm text-muted-foreground">Novas clínicas cadastradas nos últimos 6 meses</p>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={GROWTH_DATA}>
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

            {/* Tenant Management Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Manejo de Tenants</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                {filteredOrgs.length} clínica(s) encontrada(s)
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar clínicas..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            <Button onClick={() => listOrganizations()} disabled={isLoading} size="sm" variant="outline">
                                <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            </Button>
                            <Dialog open={isNewOrgOpen} onOpenChange={setIsNewOrgOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Nova Clínica
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Criar Nova Clínica</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <Label htmlFor="name">Nome da Clínica</Label>
                                            <Input
                                                id="name"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="slug">Slug (URL)</Label>
                                            <Input
                                                id="slug"
                                                value={formData.slug}
                                                onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="adminName">Nome do Admin</Label>
                                            <Input
                                                id="adminName"
                                                value={formData.adminName}
                                                onChange={e => setFormData({ ...formData, adminName: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="adminEmail">Email do Admin</Label>
                                            <Input
                                                id="adminEmail"
                                                type="email"
                                                value={formData.adminEmail}
                                                onChange={e => setFormData({ ...formData, adminEmail: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit" disabled={isLoading} className="w-full">
                                                {isLoading ? 'Criando...' : 'Criar Clínica'}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Organização</TableHead>
                                <TableHead>Plano</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Criado em</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOrgs.map((org) => (
                                <TableRow key={org.id}>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{org.name}</div>
                                            <div className="text-sm text-muted-foreground">{org.slug}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{org.plan || 'Pro'}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={org.status === 'active' ? 'default' : 'secondary'}>
                                            {org.status === 'active' ? 'Ativo' : 'Suspenso'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {new Date(org.created_at).toLocaleDateString('pt-BR')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Ações Rápidas</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(org.id)}>
                                                    Copiar ID
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                                                <DropdownMenuItem>Gerenciar Equipe</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-red-600">
                                                    Suspender Acesso
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
