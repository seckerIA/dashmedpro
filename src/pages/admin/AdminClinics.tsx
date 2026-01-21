import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
    Search,
    Building2,
    Users,
    Calendar,
    Contact,
    MoreVertical,
    Eye,
    Pause,
    Play,
    Trash2,
    RefreshCcw,
    Loader2
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Organization {
    id: string;
    name: string;
    slug: string;
    status: string;
    plan: string;
    created_at: string;
}

interface OrgDetails {
    organization: Organization;
    members: any[];
    stats: {
        contacts: number;
        deals: number;
        appointments: number;
        members: number;
    };
}

export default function AdminClinics() {
    const { toast } = useToast();
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrg, setSelectedOrg] = useState<OrgDetails | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [orgToDelete, setOrgToDelete] = useState<Organization | null>(null);
    const [isEditPlanOpen, setIsEditPlanOpen] = useState(false);
    const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
    const [newPlan, setNewPlan] = useState('');

    const fetchOrganizations = async () => {
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

    const fetchOrgDetails = async (orgId: string) => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('admin-portal', {
                body: { action: 'get_details', organizationId: orgId }
            });
            if (error) throw error;
            setSelectedOrg(data);
            setIsDetailsOpen(true);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const toggleOrgStatus = async (org: Organization) => {
        const newStatus = org.status === 'active' ? 'suspended' : 'active';
        try {
            const { error } = await supabase
                .from('organizations')
                .update({ status: newStatus })
                .eq('id', org.id);

            if (error) throw error;

            // Log action
            await supabase.from('admin_logs').insert({
                action: newStatus === 'active' ? 'org_activated' : 'org_suspended',
                target_type: 'organization',
                target_id: org.id,
                details: { org_name: org.name }
            });

            toast({ title: 'Sucesso', description: `Clínica ${newStatus === 'active' ? 'ativada' : 'suspensa'}` });
            fetchOrganizations();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro', description: error.message });
        }
    };

    const updateOrgPlan = async () => {
        if (!editingOrg || !newPlan) return;
        try {
            const { error } = await supabase
                .from('organizations')
                .update({ plan: newPlan })
                .eq('id', editingOrg.id);

            if (error) throw error;

            await supabase.from('admin_logs').insert({
                action: 'org_plan_changed',
                target_type: 'organization',
                target_id: editingOrg.id,
                details: { org_name: editingOrg.name, old_plan: editingOrg.plan, new_plan: newPlan }
            });

            toast({ title: 'Sucesso', description: `Plano atualizado para ${newPlan}` });
            setIsEditPlanOpen(false);
            fetchOrganizations();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro', description: error.message });
        }
    };

    const deleteOrganization = async () => {
        if (!orgToDelete) return;
        try {
            // Note: In production, you'd want to cascade delete or archive
            const { error } = await supabase
                .from('organizations')
                .delete()
                .eq('id', orgToDelete.id);

            if (error) throw error;

            await supabase.from('admin_logs').insert({
                action: 'org_deleted',
                target_type: 'organization',
                target_id: orgToDelete.id,
                details: { org_name: orgToDelete.name }
            });

            toast({ title: 'Sucesso', description: 'Clínica excluída' });
            setIsDeleteDialogOpen(false);
            setOrgToDelete(null);
            fetchOrganizations();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro', description: error.message });
        }
    };

    useEffect(() => {
        fetchOrganizations();
    }, []);

    const filteredOrgs = useMemo(() => {
        return organizations.filter(org =>
            org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            org.slug.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [organizations, searchTerm]);

    const planColors: Record<string, string> = {
        free: 'bg-gray-500',
        pro: 'bg-blue-500',
        enterprise: 'bg-purple-500'
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Gerenciamento de Clínicas</h1>
                    <p className="text-muted-foreground">Visualize e gerencie todas as organizações da plataforma</p>
                </div>
                <Button onClick={fetchOrganizations} disabled={isLoading} variant="outline">
                    <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Atualizar
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Clínicas</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{organizations.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ativas</CardTitle>
                        <Play className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">
                            {organizations.filter(o => o.status === 'active').length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Suspensas</CardTitle>
                        <Pause className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-500">
                            {organizations.filter(o => o.status !== 'active').length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Enterprise</CardTitle>
                        <Building2 className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-500">
                            {organizations.filter(o => o.plan === 'enterprise').length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Clínicas Cadastradas</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar clínicas..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
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
                                        <Badge className={planColors[org.plan] || 'bg-gray-500'}>
                                            {org.plan?.toUpperCase() || 'PRO'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={org.status === 'active' ? 'default' : 'secondary'}>
                                            {org.status === 'active' ? 'Ativo' : 'Suspenso'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
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
                                                <DropdownMenuItem onClick={() => fetchOrgDetails(org.id)}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    Ver Detalhes
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => {
                                                    setEditingOrg(org);
                                                    setNewPlan(org.plan);
                                                    setIsEditPlanOpen(true);
                                                }}>
                                                    <Building2 className="mr-2 h-4 w-4" />
                                                    Alterar Plano
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => toggleOrgStatus(org)}>
                                                    {org.status === 'active' ? (
                                                        <><Pause className="mr-2 h-4 w-4" /> Suspender</>
                                                    ) : (
                                                        <><Play className="mr-2 h-4 w-4" /> Ativar</>
                                                    )}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => {
                                                        setOrgToDelete(org);
                                                        setIsDeleteDialogOpen(true);
                                                    }}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Excluir
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

            {/* Details Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{selectedOrg?.organization.name}</DialogTitle>
                        <DialogDescription>Detalhes e estatísticas da organização</DialogDescription>
                    </DialogHeader>
                    {selectedOrg && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-4 gap-4">
                                <Card>
                                    <CardContent className="pt-4">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-blue-500" />
                                            <span className="text-sm text-muted-foreground">Membros</span>
                                        </div>
                                        <p className="text-2xl font-bold">{selectedOrg.stats.members}</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-4">
                                        <div className="flex items-center gap-2">
                                            <Contact className="h-4 w-4 text-green-500" />
                                            <span className="text-sm text-muted-foreground">Contatos</span>
                                        </div>
                                        <p className="text-2xl font-bold">{selectedOrg.stats.contacts}</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-4">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-purple-500" />
                                            <span className="text-sm text-muted-foreground">Consultas</span>
                                        </div>
                                        <p className="text-2xl font-bold">{selectedOrg.stats.appointments}</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-4">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-orange-500" />
                                            <span className="text-sm text-muted-foreground">Deals</span>
                                        </div>
                                        <p className="text-2xl font-bold">{selectedOrg.stats.deals}</p>
                                    </CardContent>
                                </Card>
                            </div>

                            <div>
                                <h4 className="font-medium mb-2">Membros da Equipe</h4>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nome</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Função</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedOrg.members.map((member: any) => (
                                            <TableRow key={member.id}>
                                                <TableCell>{member.profiles?.full_name || '-'}</TableCell>
                                                <TableCell>{member.profiles?.email || '-'}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{member.role}</Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Plan Dialog */}
            <Dialog open={isEditPlanOpen} onOpenChange={setIsEditPlanOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Alterar Plano</DialogTitle>
                        <DialogDescription>
                            Selecione o novo plano para {editingOrg?.name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Plano</Label>
                            <Select value={newPlan} onValueChange={setNewPlan}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="free">Free</SelectItem>
                                    <SelectItem value="pro">Pro</SelectItem>
                                    <SelectItem value="enterprise">Enterprise</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditPlanOpen(false)}>Cancelar</Button>
                        <Button onClick={updateOrgPlan}>Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Clínica?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação é irreversível. Todos os dados de "{orgToDelete?.name}" serão perdidos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={deleteOrganization} className="bg-red-600 hover:bg-red-700">
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
