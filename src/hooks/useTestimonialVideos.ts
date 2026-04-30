import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export interface TestimonialVideo {
  id: string;
  user_id: string;
  organization_id: string | null;
  storage_path: string;
  caption: string | null;
  display_order: number;
  is_active: boolean;
  duration_seconds: number | null;
  mime_type: string | null;
  created_at: string;
  updated_at: string;
}

const BUCKET = 'whatsapp-media';
const FOLDER = 'testimonials';

export function getPublicUrl(storage_path: string): string {
  if (!storage_path) return '';
  let bucket = BUCKET;
  let path = storage_path;
  if (storage_path.includes('/')) {
    const first = storage_path.indexOf('/');
    const maybe = storage_path.substring(0, first);
    if (maybe === 'whatsapp-media' || maybe === 'whatsapp-testimonials') {
      bucket = maybe;
      path = storage_path.substring(first + 1);
    }
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export function useTestimonialVideos(targetUserId?: string) {
  const queryClient = useQueryClient();

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ['testimonial-videos', targetUserId],
    queryFn: async () => {
      const userId = targetUserId || (await supabase.auth.getUser()).data.user?.id;
      if (!userId) return [];
      const { data, error } = await (supabase as any)
        .from('whatsapp_testimonial_videos')
        .select('*')
        .eq('user_id', userId)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return (data || []) as TestimonialVideo[];
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, caption }: { file: File; caption?: string }) => {
      const userId = targetUserId || (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('Não autenticado');

      const ts = Date.now();
      const ext = file.name.split('.').pop() || 'mp4';
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 60);
      const filePath = `${FOLDER}/${userId}/${ts}_${safeName}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, {
          contentType: file.type || 'video/mp4',
          upsert: false,
        });
      if (upErr) throw upErr;

      // Pega organização do médico
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('organization_id')
        .eq('id', userId)
        .single();

      // Próximo display_order
      const { data: existing } = await (supabase as any)
        .from('whatsapp_testimonial_videos')
        .select('display_order')
        .eq('user_id', userId)
        .order('display_order', { ascending: false })
        .limit(1);
      const nextOrder = ((existing as any)?.[0]?.display_order ?? -1) + 1;

      const { data: row, error: insErr } = await (supabase as any)
        .from('whatsapp_testimonial_videos')
        .insert({
          user_id: userId,
          organization_id: profile?.organization_id ?? null,
          storage_path: filePath,
          caption: caption || null,
          display_order: nextOrder,
          is_active: true,
          mime_type: file.type || 'video/mp4',
        })
        .select()
        .single();
      if (insErr) throw insErr;
      return row as TestimonialVideo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonial-videos'] });
      toast({ title: 'Vídeo adicionado', description: 'Disponível para envio automático.' });
    },
    onError: (err: any) => {
      toast({ title: 'Erro ao subir vídeo', description: err.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TestimonialVideo> & { id: string }) => {
      const { error } = await (supabase as any)
        .from('whatsapp_testimonial_videos')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonial-videos'] });
    },
    onError: (err: any) => {
      toast({ title: 'Erro ao atualizar', description: err.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (video: TestimonialVideo) => {
      // Tenta apagar o arquivo do storage (não bloqueia se falhar)
      let storageBucket = BUCKET;
      let storagePath = video.storage_path;
      if (video.storage_path.includes('/')) {
        const first = video.storage_path.indexOf('/');
        const maybe = video.storage_path.substring(0, first);
        if (maybe === 'whatsapp-media' || maybe === 'whatsapp-testimonials') {
          storageBucket = maybe;
          storagePath = video.storage_path.substring(first + 1);
        }
      }
      try {
        await supabase.storage.from(storageBucket).remove([storagePath]);
      } catch (_e) {
        // ignora erro de storage; remove a linha da tabela mesmo assim
      }
      const { error } = await (supabase as any)
        .from('whatsapp_testimonial_videos')
        .delete()
        .eq('id', video.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonial-videos'] });
      toast({ title: 'Vídeo removido' });
    },
    onError: (err: any) => {
      toast({ title: 'Erro ao remover', description: err.message, variant: 'destructive' });
    },
  });

  return {
    videos,
    isLoading,
    uploadVideo: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    updateVideo: updateMutation.mutateAsync,
    deleteVideo: deleteMutation.mutateAsync,
  };
}
