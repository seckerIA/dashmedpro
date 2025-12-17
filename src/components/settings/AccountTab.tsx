import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Info, Download, Trash2, Calendar, User, Shield, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AccountTabProps {
  profile: any;
  user: any;
}

const AccountTab = ({ profile, user }: AccountTabProps) => {
  const { toast } = useToast();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Não disponível';
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const handleExportData = async () => {
    toast({
      title: 'Funcionalidade em desenvolvimento',
      description: 'A exportação de dados estará disponível em breve.',
    });
  };

  const handleDeleteAccount = async () => {
    if (!user?.id) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Usuário não autenticado.',
      });
      return;
    }

    setIsDeleting(true);

    try {
      // Note: In production, you might want to soft-delete or mark as inactive
      // instead of hard-deleting. This is a placeholder for the deletion logic.
      
      toast({
        variant: 'destructive',
        title: 'Funcionalidade em desenvolvimento',
        description: 'A exclusão de conta requer confirmação adicional. Entre em contato com o suporte.',
      });

      // In a real implementation, you would:
      // 1. Call an admin function or API endpoint to delete the account
      // 2. Sign out the user
      // 3. Redirect to login
      
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir conta',
        description: error.message || 'Ocorreu um erro ao tentar excluir sua conta.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      admin: 'Administrador',
      dono: 'Dono',
      vendedor: 'Vendedor',
      gestor_trafego: 'Gestor de Tráfego',
    };
    return roles[role] || role;
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-500/20 text-green-500 border-green-500/50">
        <Activity className="w-3 h-3 mr-1" />
        Ativo
      </Badge>
    ) : (
      <Badge variant="destructive">
        Inativo
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Informações da Conta
          </CardTitle>
          <CardDescription>
            Detalhes sobre sua conta e estatísticas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User ID */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="w-4 h-4" />
              ID do Usuário
            </Label>
            <Input
              value={user?.id || 'Não disponível'}
              disabled
              className="bg-muted cursor-not-allowed font-mono text-xs"
            />
          </div>

          {/* Account Status */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Status da Conta
            </Label>
            <div>
              {getStatusBadge(profile?.is_active !== false)}
            </div>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label>Cargo</Label>
            <Input
              value={profile?.role ? getRoleLabel(profile.role) : 'Não definido'}
              disabled
              className="bg-muted cursor-not-allowed"
            />
          </div>

          {/* Created At */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Data de Criação
            </Label>
            <Input
              value={formatDate(profile?.created_at)}
              disabled
              className="bg-muted cursor-not-allowed"
            />
          </div>

          {/* Updated At */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Última Atualização
            </Label>
            <Input
              value={formatDate(profile?.updated_at)}
              disabled
              className="bg-muted cursor-not-allowed"
            />
          </div>
        </CardContent>
      </Card>

      {/* Statistics (Optional - can be expanded later) */}
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas</CardTitle>
          <CardDescription>
            Resumo da sua atividade na plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-primary">-</div>
              <div className="text-sm text-muted-foreground">Contatos Criados</div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-primary">-</div>
              <div className="text-sm text-muted-foreground">Deals Criados</div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-primary">-</div>
              <div className="text-sm text-muted-foreground">Último Login</div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Estatísticas detalhadas estarão disponíveis em breve
          </p>
        </CardContent>
      </Card>

      {/* Dangerous Actions */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Ações Perigosas</CardTitle>
          <CardDescription>
            Ações que não podem ser desfeitas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Export Data */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-medium">
                <Download className="w-4 h-4" />
                Exportar Meus Dados
              </div>
              <p className="text-sm text-muted-foreground">
                Baixe uma cópia de todos os seus dados
              </p>
            </div>
            <Button variant="outline" onClick={handleExportData}>
              Exportar
            </Button>
          </div>

          {/* Delete Account */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/50 bg-destructive/5">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-medium text-destructive">
                <Trash2 className="w-4 h-4" />
                Excluir Conta
              </div>
              <p className="text-sm text-muted-foreground">
                Excluir permanentemente sua conta e todos os dados associados
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                  {isDeleting ? 'Excluindo...' : 'Excluir Conta'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente sua
                    conta e removerá todos os seus dados de nossos servidores. Se você
                    tiver certeza, entre em contato com o suporte para prosseguir.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? 'Excluindo...' : 'Sim, excluir conta'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountTab;







