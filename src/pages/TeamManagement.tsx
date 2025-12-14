import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, Users, Eye, EyeOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

import { DataTable } from '@/components/datatable/DataTable';
import { getColumns, Profile } from '@/components/datatable/DataColumns';

const TeamManagement = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'vendedor' as Profile['role']
  });
  const { toast } = useToast();

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, is_active, avatar_url, created_at, updated_at, invited_by')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setProfiles(data || []);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar equipe',
        description: 'Não foi possível carregar os membros da equipe.',
      });
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingProfile) {
        // Atualizar usuário existente
        await handleUpdateUser();
      } else {
        // Criar novo usuário
        const { data, error } = await supabase.functions.invoke('create-team-user', {
          body: formData
        });

        if (error) {
          throw error;
        }

        toast({
          title: 'Usuário criado com sucesso!',
          description: `${formData.full_name || formData.email} foi adicionado à equipe.`,
        });
      }

      setFormData({ email: '', password: '', full_name: '', role: 'vendedor' });
      setEditingProfile(null);
      setDialogOpen(false);
      fetchProfiles();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: editingProfile ? 'Erro ao atualizar usuário' : 'Erro ao criar usuário',
        description: error.message || (editingProfile ? 'Não foi possível atualizar o usuário.' : 'Não foi possível criar o usuário.'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingProfile) return;

    try {
      // Chama edge function para atualizar usuário
      const updateData: any = {
        userId: editingProfile.id,
        full_name: formData.full_name || null,
        role: formData.role
      };

      // Adiciona senha apenas se foi fornecida
      if (formData.password && formData.password.trim() !== '') {
        updateData.password = formData.password;
      }

      const { data, error } = await supabase.functions.invoke('update-team-user', {
        body: updateData
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Usuário atualizado com sucesso!',
        description: `Os dados de ${formData.full_name || formData.email} foram atualizados.`,
      });
    } catch (error: any) {
      throw error;
    }
  };

  const handleEdit = (profile: Profile) => {
    setEditingProfile(profile);
    setFormData({
      email: profile.email,
      password: '', // Não preencher senha por segurança
      full_name: profile.full_name || '',
      role: (profile.role || 'vendedor') as Profile['role']
    });
    setDialogOpen(true);
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentActive })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      toast({
        title: currentActive ? 'Usuário desativado' : 'Usuário ativado',
        description: 'Status atualizado com sucesso.',
      });

      fetchProfiles();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar status',
        description: 'Não foi possível atualizar o status do usuário.',
      });
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      setLoading(true);
      
      // Chama edge function para excluir usuário
      const { data, error } = await supabase.functions.invoke('delete-team-user', {
        body: { userId }
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Usuário excluído com sucesso!',
        description: 'O usuário foi removido permanentemente da equipe.',
      });

      fetchProfiles();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir usuário',
        description: error.message || 'Não foi possível excluir o usuário.',
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: 'Administrador',
      dono: 'Dono',
      vendedor: 'Vendedor',
      gestor_trafego: 'Gestor de Tráfego'
    };
    return labels[role as keyof typeof labels] || role;
  };

  const getRoleColor = (role: string) => {
    const colors = {
      admin: 'destructive',
      dono: 'default',
      vendedor: 'secondary',
      gestor_trafego: 'outline'
    };
    return colors[role as keyof typeof colors] || 'secondary';
  };

  const columns = getColumns(handleToggleActive, handleDelete, handleEdit);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Equipe</h1>
          <p className="text-muted-foreground">
            Gerencie os membros da sua equipe e suas permissões
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingProfile(null);
            setFormData({ email: '', password: '', full_name: '', role: 'vendedor' });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Adicionar Membro
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleCreateUser}>
              <DialogHeader>
                <DialogTitle>{editingProfile ? 'Editar Membro' : 'Adicionar Novo Membro'}</DialogTitle>
                <DialogDescription>
                  {editingProfile 
                    ? 'Atualize os dados do membro da equipe.' 
                    : 'Preencha os dados para criar um novo usuário na equipe.'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Nome do usuário"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                    required
                    disabled={!!editingProfile}
                  />
                  {editingProfile && (
                    <p className="text-xs text-muted-foreground">O email não pode ser alterado.</p>
                  )}
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="password">Senha {editingProfile ? '(deixe em branco para não alterar)' : '*'}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={editingProfile ? "Deixe em branco para manter a senha atual" : "Senha temporária"}
                      required={!editingProfile}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="role">Função *</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value) => setFormData({ ...formData, role: value as Profile['role'] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma função" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="dono">Dono</SelectItem>
                      <SelectItem value="vendedor">Vendedor</SelectItem>
                      <SelectItem value="gestor_trafego">Gestor de Tráfego</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setDialogOpen(false);
                    setEditingProfile(null);
                    setFormData({ email: '', password: '', full_name: '', role: 'vendedor' });
                  }}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading 
                    ? (editingProfile ? 'Atualizando...' : 'Criando...') 
                    : (editingProfile ? 'Atualizar Usuário' : 'Criar Usuário')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Membros da Equipe ({profiles.length})
          </CardTitle>
          <CardDescription>
            Lista de todos os membros da equipe e suas funções
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={profiles} />
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamManagement;