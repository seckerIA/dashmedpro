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
  googleDriveId?: string
  googleDriveUrl?: string
}

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  const uploadFile = async (file: File, bucket: string = 'financial-attachments'): Promise<UploadedFile | null> => {
    setIsUploading(true)
    
    try {
      // Validar tamanho do arquivo (10MB máximo)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        toast({
          title: "Erro",
          description: "Arquivo muito grande. Tamanho máximo: 10MB",
          variant: "destructive",
        })
        return null
      }

      // Validar tipo do arquivo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Erro",
          description: "Tipo de arquivo não permitido. Use: JPG, PNG ou PDF",
          variant: "destructive",
        })
        return null
      }

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `financial-attachments/${fileName}`

      // Upload para Supabase Storage
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

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      const uploadedFile: UploadedFile = {
        id: data.path,
        name: file.name,
        size: file.size,
        type: file.type,
        url: urlData.publicUrl,
        path: filePath,
      }

      // Upload para Google Drive via Edge Function
      try {
        const fileContent = await fileToBase64(file)
        
        const response = await fetch(`https://npcgtjrgxxrhvrptkzip.supabase.co/functions/v1/upload-to-google-drive`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            fileName: file.name,
            fileContent: fileContent,
            fileType: file.type,
            description: `Comprovante financeiro - ${new Date().toLocaleString('pt-BR')}`,
          }),
        })

        if (response.ok) {
          const googleDriveData = await response.json()
          if (googleDriveData.success) {
            uploadedFile.googleDriveId = googleDriveData.file.id
            uploadedFile.googleDriveUrl = googleDriveData.file.webViewLink
          }
        } else {
          console.error('Error uploading to Google Drive:', await response.text())
        }
      } catch (error) {
        console.error('Error uploading to Google Drive:', error)
        // Não falha o upload principal se o Google Drive falhar
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

// Função auxiliar para converter arquivo para base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      // Remove o prefixo "data:image/jpeg;base64," ou similar
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = error => reject(error)
  })
}