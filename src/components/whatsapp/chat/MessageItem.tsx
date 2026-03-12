/**
 * Item de mensagem individual no chat
 */

import { memo, useState, useRef, useCallback, useEffect } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  Image as ImageIcon,
  FileText,
  Mic,
  Video,
  MapPin,
  User,
  Download,
  Play,
  Pause,
  CornerUpLeft,
  Bot,
  Loader2,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { WhatsAppMessageWithRelations } from '@/types/whatsapp';

interface MessageItemProps {
  message: WhatsAppMessageWithRelations;
  isFirst?: boolean;
  showAvatar?: boolean;
  onReply?: (message: WhatsAppMessageWithRelations) => void;
}

export const MessageItem = memo(function MessageItem({
  message,
  isFirst,
  showAvatar,
  onReply,
}: MessageItemProps) {
  const isOutbound = message.direction === 'outbound';
  const time = message.sent_at
    ? format(new Date(message.sent_at), 'HH:mm')
    : '';

  // Check if message was sent by AI
  const isAIMessage = isOutbound && (
    (message.metadata as any)?.auto_reply === true ||
    (message.metadata as any)?.ai_generated === true
  );
  const aiConfidence = (message.metadata as any)?.confidence;

  return (
    <div
      className={cn(
        'flex gap-2 px-4 py-1 group',
        isOutbound ? 'justify-end' : 'justify-start',
        isFirst && 'pt-3'
      )}
    >
      {/* Avatar (apenas para mensagens recebidas) */}
      {!isOutbound && showAvatar && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="bg-green-500/10 text-green-600 text-xs">
            {message.phone_number?.substring(0, 2) || 'WA'}
          </AvatarFallback>
        </Avatar>
      )}
      {!isOutbound && !showAvatar && <div className="w-8 flex-shrink-0" />}

      {/* Bolha da mensagem */}
      <div
        className={cn(
          'relative max-w-[70%] rounded-2xl px-3 py-1.5',
          isOutbound
            ? isAIMessage
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-br-md shadow-sm'
              : 'bg-emerald-600 text-white rounded-br-md shadow-sm'
            : 'bg-muted rounded-bl-md'
        )}
      >
        {/* AI Badge */}
        {isAIMessage && (
          <div className="flex items-center gap-1 mb-1 text-[10px] text-white/80">
            <Bot className="h-3 w-3" />
            <span>Enviado pela IA</span>
            {aiConfidence && (
              <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-[9px] font-medium">
                {(aiConfidence * 100).toFixed(0)}%
              </span>
            )}
          </div>
        )}
        {/* Contexto de reply */}
        {message.reply_to && (
          <div
            className={cn(
              'mb-2 px-2 py-1 rounded text-xs border-l-2',
              isOutbound
                ? 'bg-emerald-700/50 border-white/30 text-white/90'
                : 'bg-background border-emerald-500 text-muted-foreground'
            )}
          >
            <p className="truncate">{message.reply_to.content}</p>
          </div>
        )}

        {/* Conteúdo da mensagem */}
        <MessageContent message={message} isOutbound={isOutbound} />

        {/* Footer: hora + status */}
        <div
          className={cn(
            'flex items-center justify-end gap-1 mt-0.5',
            isOutbound ? 'text-white/70' : 'text-muted-foreground'
          )}
        >
          <span className="text-[10px]">{time}</span>
          {isOutbound && <MessageStatusIcon status={message.status} />}
        </div>

        {/* Botão de responder (hover) */}
        <div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity',
            isOutbound ? 'left-0 -translate-x-full pr-2' : 'right-0 translate-x-full pl-2'
          )}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full bg-background shadow-sm"
                  onClick={() => onReply?.(message)}
                >
                  <CornerUpLeft className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Responder</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
});

/**
 * Conteúdo da mensagem baseado no tipo
 */
function MessageContent({
  message,
  isOutbound,
}: {
  message: WhatsAppMessageWithRelations;
  isOutbound: boolean;
}) {
  const type = message.message_type || 'text';

  switch (type) {
    case 'text':
      return (
        <p className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </p>
      );

    case 'image':
      return (
        <div className="space-y-1">
          {message.media?.[0]?.media_url ? (
            <img
              src={message.media[0].media_url}
              alt="Imagem"
              loading="lazy"
              className="rounded-lg max-w-full h-auto max-h-64 object-cover"
            />
          ) : (
            <div
              className={cn(
                'flex items-center justify-center w-48 h-32 rounded-lg',
                isOutbound ? 'bg-emerald-700/50' : 'bg-background'
              )}
            >
              <ImageIcon className="h-8 w-8 opacity-50" />
            </div>
          )}
          {message.content && message.content !== '[Imagem]' && (
            <p className="text-sm">{message.content}</p>
          )}
        </div>
      );

    case 'audio':
      return <AudioPlayer message={message} isOutbound={isOutbound} />;

    case 'video':
      return (
        <div className="space-y-1">
          <div
            className={cn(
              'relative flex items-center justify-center w-48 h-32 rounded-lg',
              isOutbound ? 'bg-emerald-700/50' : 'bg-background'
            )}
          >
            <Video className="h-8 w-8 opacity-50" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                <Play className="h-6 w-6" />
              </Button>
            </div>
          </div>
          {message.content && message.content !== '[Vídeo]' && (
            <p className="text-sm">{message.content}</p>
          )}
        </div>
      );

    case 'document':
      const fileName =
        message.media?.[0]?.file_name || message.content || 'Documento';
      return (
        <div
          className={cn(
            'flex items-center gap-3 p-2 rounded-lg min-w-[200px]',
            isOutbound ? 'bg-emerald-700/50' : 'bg-background'
          )}
        >
          <div
            className={cn(
              'p-2 rounded',
              isOutbound ? 'bg-emerald-800/50' : 'bg-muted'
            )}
          >
            <FileText className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{fileName}</p>
            {message.media?.[0]?.file_size && (
              <p className="text-[10px] opacity-70">
                {formatFileSize(message.media[0].file_size)}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8 flex-shrink-0',
              isOutbound && 'hover:bg-emerald-700/50'
            )}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      );

    case 'location':
      return (
        <div
          className={cn(
            'flex items-center gap-2 p-2 rounded-lg min-w-[180px]',
            isOutbound ? 'bg-green-600/50' : 'bg-background'
          )}
        >
          <MapPin className="h-5 w-5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm truncate">
              {message.content || 'Localização'}
            </p>
          </div>
        </div>
      );

    case 'contact':
      return (
        <div
          className={cn(
            'flex items-center gap-2 p-2 rounded-lg min-w-[180px]',
            isOutbound ? 'bg-green-600/50' : 'bg-background'
          )}
        >
          <User className="h-5 w-5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm truncate">
              {message.content || 'Contato'}
            </p>
          </div>
        </div>
      );

    case 'sticker':
      return (
        <div className="w-24 h-24 flex items-center justify-center">
          {message.media?.[0]?.media_url ? (
            <img
              src={message.media[0].media_url}
              alt="Sticker"
              loading="lazy"
              className="max-w-full max-h-full"
            />
          ) : (
            <span className="text-4xl">🎨</span>
          )}
        </div>
      );

    case 'reaction':
      return <span className="text-2xl">{message.content}</span>;

    default:
      return (
        <p className="text-sm italic opacity-70">
          [{type}] {message.content}
        </p>
      );
  }
}

/**
 * Ícone de status da mensagem
 */
function MessageStatusIcon({
  status,
}: {
  status?: string;
}) {
  switch (status) {
    case 'sent':
      return <Check className="h-3 w-3" />;
    case 'delivered':
      return <CheckCheck className="h-3 w-3" />;
    case 'read':
      return <CheckCheck className="h-3 w-3 text-blue-300" />;
    case 'failed':
      return <AlertCircle className="h-3 w-3 text-red-300" />;
    default:
      return <Clock className="h-3 w-3" />;
  }
}

/**
 * Audio player component with play/pause, progress bar, and duration
 */
function AudioPlayer({
  message,
  isOutbound,
}: {
  message: WhatsAppMessageWithRelations;
  isOutbound: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const mediaId = message.media?.[0]?.whatsapp_media_id;
  const directUrl = message.media?.[0]?.media_url;

  const loadAudio = useCallback(async () => {
    if (audioSrc) return audioSrc;

    // Try direct URL first (if stored)
    if (directUrl) {
      setAudioSrc(directUrl);
      return directUrl;
    }

    // Fallback: use media proxy Edge Function (supports whatsapp_media_id or message_id)
    const proxyId = mediaId || message.id;
    if (!proxyId) {
      setError(true);
      return null;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError(true); return null; }

      const proxyUrl = `${import.meta.env.VITE_SUPABASE_URL || ''}/functions/v1/whatsapp-media-proxy?media_id=${proxyId}`;
      const res = await fetch(proxyUrl, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      if (!res.ok) { setError(true); return null; }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioSrc(url);
      return url;
    } catch (e) {
      console.error('Error loading audio:', e);
      setError(true);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [audioSrc, directUrl, mediaId]);

  const togglePlay = useCallback(async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    let src = audioSrc;
    if (!src) {
      src = await loadAudio();
      if (!src) return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(src);
      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current!.duration);
      });
      audioRef.current.addEventListener('timeupdate', () => {
        const a = audioRef.current!;
        setCurrentTime(a.currentTime);
        setProgress(a.duration > 0 ? (a.currentTime / a.duration) * 100 : 0);
      });
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
      });
      audioRef.current.addEventListener('error', () => {
        setError(true);
        setIsPlaying(false);
      });
    }

    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (e) {
      setError(true);
    }
  }, [isPlaying, audioSrc, loadAudio]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioSrc && audioSrc.startsWith('blob:')) {
        URL.revokeObjectURL(audioSrc);
      }
    };
  }, []);

  const formatTime = (sec: number) => {
    if (!sec || !isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 min-w-[200px]">
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'h-10 w-10 rounded-full flex-shrink-0',
          isOutbound
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
            : 'bg-background hover:bg-muted'
        )}
        onClick={togglePlay}
        disabled={isLoading || error}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : error ? (
          <AlertCircle className="h-4 w-4 opacity-50" />
        ) : isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
      <div className="flex-1">
        <div
          className={cn(
            'h-1 rounded-full cursor-pointer',
            isOutbound ? 'bg-white/30' : 'bg-muted-foreground/30'
          )}
          onClick={(e) => {
            if (!audioRef.current || !duration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            audioRef.current.currentTime = pct * duration;
          }}
        >
          <div
            className={cn(
              'h-full rounded-full transition-all',
              isOutbound ? 'bg-white' : 'bg-emerald-500'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px]">
            {isPlaying || currentTime > 0 ? formatTime(currentTime) : formatTime(duration)}
          </span>
          <Mic className="h-3 w-3 opacity-50" />
        </div>
      </div>
    </div>
  );
}

/**
 * Formatar tamanho de arquivo
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
