import { useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Upload, Trash2, GripVertical, Loader2, Film, Info } from 'lucide-react';
import { useTestimonialVideos, getPublicUrl, type TestimonialVideo } from '@/hooks/useTestimonialVideos';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

interface TestimonialVideosManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUserId?: string;
}

const MAX_VIDEOS = 3;
const MAX_SIZE_MB = 25;

export function TestimonialVideosManager({ open, onOpenChange, targetUserId }: TestimonialVideosManagerProps) {
  const { videos, isLoading, uploadVideo, isUploading, updateVideo, deleteVideo } = useTestimonialVideos(targetUserId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingCaption, setPendingCaption] = useState('');

  const activeCount = videos.filter(v => v.is_active).length;
  const canAddMore = activeCount < MAX_VIDEOS;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      toast({ title: 'Formato inválido', description: 'Selecione um arquivo de vídeo (MP4 recomendado).', variant: 'destructive' });
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast({ title: 'Arquivo muito grande', description: `Máximo ${MAX_SIZE_MB}MB. Comprima o vídeo antes de subir.`, variant: 'destructive' });
      return;
    }
    await uploadVideo({ file, caption: pendingCaption.trim() || undefined });
    setPendingCaption('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleToggleActive = async (video: TestimonialVideo) => {
    if (!video.is_active && activeCount >= MAX_VIDEOS) {
      toast({ title: 'Limite atingido', description: `Máximo ${MAX_VIDEOS} vídeos ativos. Desative outro antes.`, variant: 'destructive' });
      return;
    }
    await updateVideo({ id: video.id, is_active: !video.is_active });
  };

  const handleDelete = async (video: TestimonialVideo) => {
    if (!confirm('Remover este vídeo? A ação é permanente.')) return;
    await deleteVideo(video);
  };

  const handleReorder = async (video: TestimonialVideo, direction: 'up' | 'down') => {
    const sorted = [...videos].sort((a, b) => a.display_order - b.display_order);
    const idx = sorted.findIndex(v => v.id === video.id);
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sorted.length - 1) return;
    const target = direction === 'up' ? sorted[idx - 1] : sorted[idx + 1];
    await Promise.all([
      updateVideo({ id: video.id, display_order: target.display_order }),
      updateVideo({ id: target.id, display_order: video.display_order }),
    ]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Film className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>Vídeos de depoimento</DialogTitle>
          </div>
          <DialogDescription>
            Até {MAX_VIDEOS} vídeos curtos enviados automaticamente pelo agente após gerar valor — antes de qualquer menção a preço.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Info banner */}
          <div className="flex gap-3 p-3 rounded-lg border border-blue-500/20 bg-blue-500/5">
            <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">Quando o agente envia?</p>
              <p>Após o paciente verbalizar dor/sintoma e o agente apresentar os diferenciais do médico — antes de falar de valor. Os vídeos seguem a ordem definida abaixo (arraste para reordenar).</p>
            </div>
          </div>

          {/* Upload */}
          <div className={cn(
            "p-4 rounded-xl border transition-all",
            canAddMore ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30 opacity-60"
          )}>
            <div className="space-y-3">
              <Label className="text-sm font-bold">
                Adicionar novo vídeo {!canAddMore && <span className="text-[11px] font-normal text-muted-foreground">(limite de {MAX_VIDEOS} ativos atingido)</span>}
              </Label>
              <div className="space-y-2">
                <Input
                  placeholder="Legenda opcional (ex: 'Maria, 58 anos, artrose no joelho — após 3 sessões')"
                  value={pendingCaption}
                  onChange={(e) => setPendingCaption(e.target.value)}
                  disabled={!canAddMore || isUploading}
                  className="h-9 text-sm"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm"
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={!canAddMore || isUploading}
                />
                <Button
                  variant="outline"
                  className="w-full h-10 gap-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!canAddMore || isUploading}
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {isUploading ? 'Subindo...' : 'Escolher vídeo (MP4 até 25MB)'}
                </Button>
              </div>
            </div>
          </div>

          {/* Lista */}
          <div className="space-y-2">
            <Label className="text-sm font-bold">Vídeos cadastrados ({videos.length})</Label>
            {isLoading ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                Carregando...
              </div>
            ) : videos.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg">
                Nenhum vídeo cadastrado ainda. Adicione até {MAX_VIDEOS} para o agente usar.
              </div>
            ) : (
              <div className="space-y-2">
                {[...videos]
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((video, idx, arr) => (
                    <div
                      key={video.id}
                      className={cn(
                        "p-3 rounded-lg border transition-all",
                        video.is_active ? "border-emerald-500/30 bg-emerald-500/5" : "border-border bg-muted/30 opacity-70"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col gap-1 pt-1">
                          <button
                            type="button"
                            onClick={() => handleReorder(video, 'up')}
                            disabled={idx === 0}
                            className="text-muted-foreground hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Mover para cima"
                          >
                            <GripVertical className="h-4 w-4 rotate-90" />
                          </button>
                          <span className="text-[10px] font-bold text-center text-muted-foreground">#{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleReorder(video, 'down')}
                            disabled={idx === arr.length - 1}
                            className="text-muted-foreground hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Mover para baixo"
                          >
                            <GripVertical className="h-4 w-4 -rotate-90" />
                          </button>
                        </div>

                        <div className="flex-shrink-0 w-32">
                          <video
                            src={getPublicUrl(video.storage_path)}
                            controls
                            preload="metadata"
                            className="w-full h-20 object-cover rounded-md bg-black"
                          />
                        </div>

                        <div className="flex-1 min-w-0 space-y-1.5">
                          <Input
                            value={video.caption || ''}
                            placeholder="Sem legenda"
                            onBlur={(e) => {
                              if (e.target.value !== (video.caption || '')) {
                                updateVideo({ id: video.id, caption: e.target.value || null });
                              }
                            }}
                            onChange={(e) => {
                              // controlled update via blur
                              const target = e.target as HTMLInputElement;
                              target.value = e.target.value;
                            }}
                            defaultValue={video.caption || ''}
                            className="h-8 text-xs"
                          />
                          <p className="text-[10px] text-muted-foreground truncate">
                            {video.storage_path.split('/').pop()}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground">
                              {video.is_active ? 'Ativo' : 'Inativo'}
                            </span>
                            <Switch
                              checked={video.is_active}
                              onCheckedChange={() => handleToggleActive(video)}
                            />
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(video)}
                            title="Remover"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
