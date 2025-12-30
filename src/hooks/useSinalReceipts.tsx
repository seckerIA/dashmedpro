import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

export function useSinalReceipts() {
  const [isUploading, setIsUploading] = useState(false);

  const uploadReceipt = async (file: File, appointmentId: string): Promise<string | null> => {
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${appointmentId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('sinal-receipts')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Para buckets privados, usar createSignedUrl ou getPublicUrl dependendo da configuração
      const { data: { publicUrl } } = supabase.storage
        .from('sinal-receipts')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload do comprovante:', error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const getSignedUrl = async (filePath: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from('sinal-receipts')
        .createSignedUrl(filePath, 3600); // 1 hora de validade

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Erro ao obter URL assinada:', error);
      return null;
    }
  };

  const deleteReceipt = async (filePath: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from('sinal-receipts')
        .remove([filePath]);
      return !error;
    } catch {
      return false;
    }
  };

  const extractFilePathFromUrl = (url: string): string | null => {
    try {
      // Extrair o caminho do arquivo da URL do Supabase Storage
      const match = url.match(/sinal-receipts\/(.+)$/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  };

  return {
    uploadReceipt,
    deleteReceipt,
    getSignedUrl,
    extractFilePathFromUrl,
    isUploading
  };
}
