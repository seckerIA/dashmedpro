import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, Users, Eye, EyeOff, Stethoscope } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useSecretaryDoctorLinks } from '@/hooks/useSecretaryDoctors';

import { DataTable } from '@/components/datatable/DataTable';
import { getColumns, Profile } from '@/components/datatable/DataColumns';

const TeamManagement = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [doctors, setDoctors] = useState<Array<{ id: string; full_name: string; email: string }>>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [selectedDoctorIds, setSelectedDoctorIds] = useState<string[]>([]); // Para multiplos medicos
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'vendedor' as Profile['role'],
    doctor_id: '' as string | undefined,
    consultation_value: '' as string | undefined
  });
  const { toast } = useToast();
  const { updateSecretaryLinks, getLinksForSecretary } = useSecretaryDoctorLinks();

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, is_active, avatar_url, created_at, updated_at, invited_by, doctor_id, consultation_value')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setProfiles((data || []) as unknown as Profile[]);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar equipe',
        description: 'Não foi possível carregar os membros da equipe.',
      });
    }
  };

  const fetchDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('role', ['medico', 'dono'])
        .eq('is_active', true)
        .order('full_name', { ascending: true });

      if (error) {
        throw error;
      }

      setDoctors(data || []);
    } catch (error) {
      console.error('Erro ao carregar médicos:', error);
    } finally {
      setLoadingDoctors(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
    fetchDoctors();
  }, []);

  // Buscar médicos quando role mudar para secretaria
  useEffect(() => {
    if (formData.role === 'secretaria') {
      fetchDoctors();
    }
  }, [formData.role]);

  // Carregar medicos vinculados ao editar secretaria
  useEffect(() => {
    if (editingProfile && editingProfile.role === 'secretaria') {
      const links = getLinksForSecretary(editingProfile.id);
      const doctorIds = links.map(l => l.doctor_id);
      setSelectedDoctorIds(doctorIds);
    }
  }, [editingProfile, getLinksForSecretary]);

  // Alternar selecao de medico
  const toggleDoctorSelection = (doctorId: string) => {
    setSelectedDoctorIds(prev => {
      if (prev.includes(doctorId)) {
        return prev.filter(id => id !== doctorId);
      } else {
        return [...prev, doctorId];
      }
    });
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingProfile) {
        // Atualizar usuario existente
        await handleUpdateUser();
      } else {
        // Criar novo usuario
        const createData: any = { ...formData };

        // Validacao para secretaria - precisa ter pelo menos um medico
        if (formData.role === 'secretaria') {
          if (selectedDoctorIds.length === 0) {
            toast({
              variant: 'destructive',
              title: 'Medico obrigatorio',
              description: 'Uma secretaria deve ser vinculada a pelo menos um medico.',
            });
            setLoading(false);
            return;
          }
          // Usar o primeiro medico como doctor_id principal (compatibilidade)
          createData.doctor_id = selectedDoctorIds[0];
        } else {
          // Remover doctor_id se nao for secretaria
          delete createData.doctor_id;
        }

        // Validacao para medico/dono - consultation_value obrigatorio
        if (formData.role === 'medico' || formData.role === 'dono') {
          if (!formData.consultation_value || formData.consultation_value.trim() === '') {
            toast({
              variant: 'destructive',
              title: 'Valor da consulta obrigatorio',
              description: 'Medicos e donos devem ter um valor de consulta cadastrado.',
            });
            setLoading(false);
            return;
          }
          // Converter valor para numero (aceita virgula ou ponto)
          const consultationValue = parseFloat(formData.consultation_value.replace(',', '.'));
          if (isNaN(consultationValue) || consultationValue <= 0) {
            toast({
              variant: 'destructive',
              title: 'Valor invalido',
              description: 'O valor da consulta deve ser um numero maior que zero.',
            });
            setLoading(false);
            return;
          }
          createData.consultation_value = consultationValue;
        } else {
          // Remover consultation_value se nao for medico/dono
          delete createData.consultation_value;
        }

        const { data, error } = await supabase.functions.invoke('create-team-user', {
          body: createData
        });

        if (error) {
          throw error;
        }

        // Se for secretaria, criar vinculos com medicos na tabela secretary_doctor_links
        if (formData.role === 'secretaria' && data?.user?.id && selectedDoctorIds.length > 0) {
          try {
            await updateSecretaryLinks(data.user.id, selectedDoctorIds);
          } catch (linkError) {
            console.error('Erro ao criar vinculos de secretaria:', linkError);
            // Nao falhar a criacao do usuario se os vinculos falharem
          }
        }

        toast({
          title: 'Usuario criado com sucesso!',
          description: `${formData.full_name || formData.email} foi adicionado a equipe.`,
        });
      }

      setFormData({ email: '', password: '', full_name: '', role: 'vendedor', doctor_id: '', consultation_value: '' });
      setSelectedDoctorIds([]);
      setEditingProfile(null);
      setDialogOpen(false);
      fetchProfiles();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: editingProfile ? 'Erro ao atualizar usuario' : 'Erro ao criar usuario',
        description: error.message || (editingProfile ? 'Nao foi possivel atualizar o usuario.' : 'Nao foi possivel criar o usuario.'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingProfile) return;

    try {
      // Chama edge function para atualizar usuario
      const updateData: any = {
        userId: editingProfile.id,
        full_name: formData.full_name || null,
        role: formData.role
      };

      // Adiciona senha apenas se foi fornecida
      if (formData.password && formData.password.trim() !== '') {
        updateData.password = formData.password;
      }

      // Se for secretaria, validar e incluir doctor_id
      if (formData.role === 'secretaria') {
        if (selectedDoctorIds.length === 0) {
          toast({
            variant: 'destructive',
            title: 'Medico obrigatorio',
            description: 'Uma secretaria deve ser vinculada a pelo menos um medico.',
          });
          throw new Error('Medico obrigatorio para secretaria');
        }
        // Usar o primeiro medico como doctor_id principal (compatibilidade)
        updateData.doctor_id = selectedDoctorIds[0];
      } else {
        // Remover doctor_id se nao for mais secretaria
        updateData.doctor_id = null;
      }

      // Se for medico/dono, incluir/atualizar consultation_value
      if (formData.role === 'medico' || formData.role === 'dono') {
        if (!formData.consultation_value || formData.consultation_value.trim() === '') {
          toast({
            variant: 'destructive',
            title: 'Valor da consulta obrigatorio',
            description: 'Medicos e donos devem ter um valor de consulta cadastrado.',
          });
          throw new Error('Valor da consulta obrigatorio para medico/dono');
        }
        // Converter valor para numero (aceita virgula ou ponto)
        const consultationValue = parseFloat(formData.consultation_value.replace(',', '.'));
        if (isNaN(consultationValue) || consultationValue <= 0) {
          toast({
            variant: 'destructive',
            title: 'Valor invalido',
            description: 'O valor da consulta deve ser um numero maior que zero.',
          });
          throw new Error('Valor da consulta invalido');
        }
        updateData.consultation_value = consultationValue;
      } else {
        // Remover consultation_value se nao for mais medico/dono
        updateData.consultation_value = null;
      }

      const { data, error } = await supabase.functions.invoke('update-team-user', {
        body: updateData
      });

      if (error) {
        throw error;
      }

      // Se for secretaria, atualizar vinculos com medicos
      if (formData.role === 'secretaria') {
        try {
          await updateSecretaryLinks(editingProfile.id, selectedDoctorIds);
        } catch (linkError) {
          console.error('Erro ao atualizar vinculos de secretaria:', linkError);
          // Nao falhar a atualizacao se os vinculos falharem
        }
      }

      toast({
        title: 'Usuario atualizado com sucesso!',
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
      password: '', // Nao preencher senha por seguranca
      full_name: profile.full_name || '',
      role: (profile.role || 'vendedor') as Profile['role'],
      doctor_id: (profile as any).doctor_id || '',
      consultation_value: (profile as any).consultation_value ? (profile as any).consultation_value.toString().replace('.', ',') : ''
    });
    // Limpar selecao de medicos - sera recarregada pelo useEffect
    setSelectedDoctorIds([]);
    setDialogOpen(true);
    // Buscar medicos se for secretaria
    if (profile.role === 'secretaria') {
      fetchDoctors();
    }
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
            setFormData({ email: '', password: '', full_name: '', role: 'vendedor', doctor_id: '', consultation_value: '' });
            setSelectedDoctorIds([]);
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
                    onValueChange={(value) => {
                      const newRole = value as Profile['role'];
                      setFormData({ 
                        ...formData, 
                        role: newRole,
                        // Limpar doctor_id se não for secretária
                        doctor_id: newRole === 'secretaria' ? formData.doctor_id : ''
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma função" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="dono">Dono</SelectItem>
                      <SelectItem value="medico">Médico</SelectItem>
                      <SelectItem value="secretaria">Secretária</SelectItem>
                      <SelectItem value="vendedor">Vendedor</SelectItem>
                      <SelectItem value="gestor_trafego">Gestor de Tráfego</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Campo de selecao de medicos - apenas para secretaria (multipla selecao) */}
                {formData.role === 'secretaria' && (
                  <div className="grid gap-2">
                    <Label className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" />
                      Medicos Vinculados *
                    </Label>
                    {loadingDoctors ? (
                      <div className="p-4 text-sm text-muted-foreground border rounded-md">
                        Carregando medicos...
                      </div>
                    ) : doctors.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground border rounded-md">
                        Nenhum medico cadastrado
                      </div>
                    ) : (
                      <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                        {doctors.map((doctor) => (
                          <div
                            key={doctor.id}
                            className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                          >
                            <Checkbox
                              id={`doctor-${doctor.id}`}
                              checked={selectedDoctorIds.includes(doctor.id)}
                              onCheckedChange={() => toggleDoctorSelection(doctor.id)}
                            />
                            <label
                              htmlFor={`doctor-${doctor.id}`}
                              className="text-sm font-medium cursor-pointer flex-1"
                            >
                              {doctor.full_name || doctor.email}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedDoctorIds.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {selectedDoctorIds.map(id => {
                          const doctor = doctors.find(d => d.id === id);
                          return doctor ? (
                            <Badge key={id} variant="secondary" className="text-xs">
                              {doctor.full_name || doctor.email}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Selecione um ou mais medicos. A secretaria tera acesso aos dados de todos os medicos selecionados.
                    </p>
                  </div>
                )}

                {/* Campo de valor da consulta - apenas para médico ou dono */}
                {(formData.role === 'medico' || formData.role === 'dono') && (
                  <div className="grid gap-2">
                    <Label htmlFor="consultation_value">Valor da Consulta (R$) *</Label>
                    <Input
                      id="consultation_value"
                      type="text"
                      value={formData.consultation_value || ''}
                      onChange={(e) => {
                        // Permitir apenas números e vírgula/ponto
                        const value = e.target.value.replace(/[^\d,.-]/g, '');
                        setFormData({ ...formData, consultation_value: value });
                      }}
                      placeholder="Ex: 150,00"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      O procedimento "CONSULTA" será criado automaticamente com este valor.
                    </p>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    setEditingProfile(null);
                    setFormData({ email: '', password: '', full_name: '', role: 'vendedor', doctor_id: '', consultation_value: '' });
                    setSelectedDoctorIds([]);
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