import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import AvatarUpload from './AvatarUpload';
import { Loader2, Save } from 'lucide-react';
import { cacheDelete, CacheKeys } from '@/lib/cache';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileTabProps {
  profile: any;
  user: User | null;
}

const ProfileTab = ({ profile, user }: ProfileTabProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          avatar_url: avatarUrl,
        } as never)
        .eq('id', user.id);

      if (error) throw error;

      // Invalidate Redis cache
      await cacheDelete(CacheKeys.userProfile(user.id));

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', user?.id] });
      toast({
        title: 'Perfil atualizado!',
        description: 'Suas informações foram salvas com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar perfil',
        description: error.message || 'Ocorreu um erro ao salvar suas informações.',
      });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
          <CardDescription>
            Atualize seu nome e foto de perfil
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-4 mb-6 pb-6 border-b">
              <AvatarUpload
                currentAvatarUrl={avatarUrl || profile?.avatar_url}
                onUploadComplete={(url) => setAvatarUrl(url)}
              />
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome Completo</Label>
              <Input
                id="full_name"
                {...register('full_name')}
                placeholder="Seu nome completo"
                className={errors.full_name ? 'border-destructive' : ''}
              />
              {errors.full_name && (
                <p className="text-sm text-destructive">{errors.full_name.message}</p>
              )}
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || profile?.email || ''}
                disabled
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                O email não pode ser alterado aqui. Entre em contato com o suporte se precisar alterá-lo.
              </p>
            </div>

            {/* Role (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="role">Cargo</Label>
              <Input
                id="role"
                value={profile?.role ? getRoleLabel(profile.role) : 'Não definido'}
                disabled
                className="bg-muted cursor-not-allowed"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={isSubmitting || updateProfileMutation.isPending}
                className="min-w-[150px]"
              >
                {isSubmitting || updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileTab;

