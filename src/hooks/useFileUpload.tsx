import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'

export interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  path: string
}

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  const uploadFile = async (file: File, bucket: string = 'medical-files'): Promise<UploadedFile | null> => {
    setIsUploading(true)

    try {
      // Validar tamanho do arquivo (50MB máximo para medical-files)
      const maxSize = 50 * 1024 * 1024 // 50MB
      if (file.size > maxSize) {
        toast({
          title: "Erro",
          description: "Arquivo muito grande. Tamanho máximo: 50MB",
          variant: "destructive",
        })
        return null
      }

      // Validar tipo do arquivo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp', 'image/heic', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Erro",
          description: "Tipo de arquivo não permitido. Use: JPG, PNG, GIF, WebP, HEIC ou PDF",
          variant: "destructive",
        })
        return null
      }

      // Obter usuário autenticado para criar pasta isolada
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para fazer upload de arquivos",
          variant: "destructive",
        })
        return null
      }

      // Organizar arquivos em: {user_id}/{ano}/{mes}/{arquivo}
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const fileExt = file.name.split('.').pop()
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${user.id}/${year}/${month}/${uniqueName}`

      // Upload para Supabase Storage (multi-tenant com RLS)
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file)

      if (error) {
        console.error('Error uploading to Supabase:', error)
        toast({
          title: "Erro",
          description: "Erro ao fazer upload do arquivo",
          variant: "destructive",
        })
        return null
      }

      // Obter URL assinada (para arquivos privados)
      const { data: signedUrlData } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, 60 * 60 * 24 * 7) // 7 dias

      const uploadedFile: UploadedFile = {
        id: data.path,
        name: file.name,
        size: file.size,
        type: file.type,
        url: signedUrlData?.signedUrl || '',
        path: filePath,
      }

      setUploadedFiles(prev => [...prev, uploadedFile])

      toast({
        title: "Sucesso",
        description: "Arquivo enviado com sucesso!",
      })

      return uploadedFile
    } catch (error) {
      console.error('Error in uploadFile:', error)
      toast({
        title: "Erro",
        description: "Erro ao fazer upload do arquivo",
        variant: "destructive",
      })
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId))
  }

  const clearFiles = () => {
    setUploadedFiles([])
  }

  const uploadTaskImage = async (file: File, userId: string): Promise<string | null> => {
    try {
      // Validar tamanho do arquivo (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'Arquivo muito grande',
          description: 'A imagem deve ter no máximo 5MB.',
        });
        return null;
      }

      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        toast({
          variant: 'destructive',
          title: 'Tipo de arquivo inválido',
          description: 'Por favor, selecione uma imagem.',
        });
        return null;
      }

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      // Upload para Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('task-images')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('task-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        variant: 'destructive',
        title: 'Erro no upload',
        description: 'Não foi possível fazer upload da imagem.',
      });
      return null;
    }
  };

  const deleteTaskImage = async (imageUrl: string): Promise<boolean> => {
    try {
      // Extrair o caminho do arquivo da URL
      const urlParts = imageUrl.split('/task-images/');
      if (urlParts.length < 2) return false;

      const filePath = urlParts[1];

      const { error } = await supabase.storage
        .from('task-images')
        .remove([filePath]);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
      return false;
    }
  };

  return {
    uploadFile,
    removeFile,
    clearFiles,
    isUploading,
    uploadedFiles,
    uploadTaskImage,
    deleteTaskImage,
  }
}
