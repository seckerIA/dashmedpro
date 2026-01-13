import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Camera, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { cacheDelete, CacheKeys } from '@/lib/cache';

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  onUploadComplete: (url: string | null) => void;
}

const AvatarUpload = ({ currentAvatarUrl, onUploadComplete }: AvatarUploadProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Arquivo inválido',
        description: 'Por favor, selecione uma imagem.',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'Arquivo muito grande',
        description: 'A imagem deve ter no máximo 5MB.',
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    uploadAvatar(file);
  };

  const uploadAvatar = async (file: File) => {
    if (!user?.id) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Usuário não autenticado.',
      });
      return;
    }

    setUploading(true);

    try {
      // Get file extension
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        // Log the full error for debugging
        console.error('Upload error details:', uploadError);

        // If bucket doesn't exist, provide helpful error message
        if (uploadError.message?.includes('Bucket not found') ||
          uploadError.message?.includes('not found') ||
          uploadError.message?.includes('does not exist')) {
          throw new Error('Bucket de avatares não encontrado. Entre em contato com o suporte.');
        }

        // Handle permission errors
        if (uploadError.message?.includes('permission') || uploadError.message?.includes('policy')) {
          throw new Error('Você não tem permissão para fazer upload. Verifique suas permissões.');
        }

        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      if (data?.publicUrl) {
        // Update profile in DB immediately for better UX
        const { error: dbError } = await supabase
          .from('profiles')
          .update({ avatar_url: data.publicUrl } as never)
          .eq('id', user.id);

        if (dbError) {
          console.warn('Could not update profile in DB, but image was uploaded:', dbError);
        }

        // Invalidate Redis cache
        await cacheDelete(CacheKeys.userProfile(user.id));

        // Invalidate profile query to update global state (header avatar, etc)
        queryClient.invalidateQueries({ queryKey: ['user-profile', user.id] });

        onUploadComplete(data.publicUrl);

        toast({
          title: 'Avatar atualizado!',
          description: 'Sua foto de perfil foi atualizada com sucesso.',
        });
        setPreview(null);
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao fazer upload',
        description: error.message || 'Não foi possível fazer upload da imagem.',
      });
      setPreview(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user?.id || !currentAvatarUrl) return;

    setUploading(true);
    try {
      // Extract file name from URL
      const fileName = currentAvatarUrl.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('avatars')
          .remove([`${user.id}/${fileName}`]);
      }

      // Update profile in DB immediately
      await supabase
        .from('profiles')
        .update({ avatar_url: null } as never)
        .eq('id', user.id);

      // Invalidate Redis cache
      await cacheDelete(CacheKeys.userProfile(user.id));

      // Invalidate profile query
      queryClient.invalidateQueries({ queryKey: ['user-profile', user.id] });

      // CRITICAL FIX: Pass null instead of empty string
      onUploadComplete(null as any);

      toast({
        title: 'Avatar removido',
        description: 'Sua foto de perfil foi removida.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao remover avatar',
        description: error.message || 'Não foi possível remover a imagem.',
      });
    } finally {
      setUploading(false);
    }
  };

  const getInitials = () => {
    // Try to get initials from user email or name
    const email = user?.email || '';
    return email.substring(0, 2).toUpperCase();
  };

  const displayUrl = preview || currentAvatarUrl;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className="w-24 h-24 border-4 border-primary/20">
          <AvatarImage
            src={displayUrl || undefined}
            alt="Avatar"
            className="object-cover object-center"
          />
          <AvatarFallback className="text-2xl bg-primary/10 text-primary">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Camera className="w-4 h-4 mr-2" />
          {uploading ? 'Enviando...' : 'Alterar Foto'}
        </Button>
        {currentAvatarUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemoveAvatar}
            disabled={uploading}
            className="text-destructive hover:text-destructive"
          >
            <X className="w-4 h-4 mr-2" />
            Remover
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center max-w-xs">
        Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 5MB
      </p>
    </div>
  );
};

export default AvatarUpload;

