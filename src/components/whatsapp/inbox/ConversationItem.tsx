/**
 * Item de conversa na lista do inbox
 */

import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Check,
  CheckCheck,
  Clock,
  Image,
  Mic,
  Video,
  FileText,
  MapPin,
  User,
  AlertCircle,
  VolumeX,
} from 'lucide-react';
import type {
  WhatsAppConversationWithRelations,
  WhatsAppMessageType,
  WhatsAppMessageDirection,
} from '@/types/whatsapp';
import { CONVERSATION_STATUS_CONFIG, PRIORITY_CONFIG } from '@/types/whatsapp';

interface ConversationItemProps {
  conversation: WhatsAppConversationWithRelations;
  isSelected?: boolean;
  onClick?: () => void;
}

export function ConversationItem({
  conversation,
  isSelected,
  onClick,
}: ConversationItemProps) {
  const {
    contact_name,
    phone_number,
    contact_profile_picture,
    last_message_at,
    last_message_preview,
    last_message_direction,
    unread_count,
    status,
    priority,
    is_muted,
    labels,
    contact,
    lead_status,
    lead_status_color,
  } = conversation;

  const displayName = contact_name || (contact as any)?.name || (contact as any)?.full_name || phone_number;
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const timeAgo = last_message_at
    ? formatDistanceToNow(new Date(last_message_at), {
      addSuffix: true,
      locale: ptBR,
    })
    : '';

  const statusConfig = CONVERSATION_STATUS_CONFIG[status];
  const priorityConfig = PRIORITY_CONFIG[priority];

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 p-3 text-left transition-colors',
        'hover:bg-muted/50',
        isSelected && 'bg-muted',
        unread_count > 0 && !isSelected && 'bg-green-500/5'
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <Avatar className="h-12 w-12">
          <AvatarImage src={contact_profile_picture || (contact as any)?.avatar_url || undefined} />
          <AvatarFallback className="bg-green-500/10 text-green-600">
            {initials}
          </AvatarFallback>
        </Avatar>
        {/* Indicador de status da conversa */}
        {status !== 'open' && (
          <div
            className={cn(
              'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background',
              status === 'resolved' && 'bg-blue-500',
              status === 'pending' && 'bg-yellow-500',
              status === 'spam' && 'bg-red-500'
            )}
          />
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        {/* Linha 1: Nome + Hora */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              'font-medium truncate',
              unread_count > 0 && 'text-foreground',
              unread_count === 0 && 'text-muted-foreground'
            )}
          >
            {displayName}
          </span>
          <span className="text-xs text-muted-foreground flex-shrink-0 flex items-center gap-1">
            {is_muted && <VolumeX className="h-3 w-3" />}
            {timeAgo}
          </span>
        </div>

        {/* Linha 2: Preview da mensagem */}
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <div className="flex items-center gap-1 min-w-0 flex-1">
            {/* Indicador de direção (enviada/recebida) */}
            {last_message_direction === 'outbound' && (
              <MessageStatusIcon status="read" className="flex-shrink-0" />
            )}
            {/* Ícone de tipo de mensagem */}
            <MessageTypeIcon preview={last_message_preview || ''} />
            {/* Preview */}
            <span
              className={cn(
                'text-sm truncate',
                unread_count > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'
              )}
            >
              {last_message_preview || 'Sem mensagens'}
            </span>
          </div>

          {/* Badge de não lidas e Lead Status */}
          <div className="flex flex-col items-end gap-1.5">
            {unread_count > 0 && (
              <Badge
                variant="default"
                className="bg-green-500 hover:bg-green-500 text-white h-5 min-w-5 flex items-center justify-center px-1.5"
              >
                {unread_count > 99 ? '99+' : unread_count}
              </Badge>
            )}
            {lead_status && (
              <Badge
                variant="secondary"
                className={cn(
                  "text-[9px] h-4 px-1.5 uppercase tracking-tighter font-bold border-none text-white",
                  lead_status_color
                )}
              >
                {lead_status}
              </Badge>
            )}
          </div>
        </div>

        {/* Linha 3: Labels */}
        {labels && labels.length > 0 && (
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            {labels.slice(0, 3).map(label => (
              <span
                key={label.id}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium"
                style={{
                  backgroundColor: `${label.color}20`,
                  color: label.color,
                }}
              >
                {label.name}
              </span>
            ))}
            {labels.length > 3 && (
              <span className="text-[10px] text-muted-foreground">
                +{labels.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

/**
 * Ícone de status da mensagem (enviada/entregue/lida)
 */
function MessageStatusIcon({
  status,
  className,
}: {
  status: 'sent' | 'delivered' | 'read' | 'failed';
  className?: string;
}) {
  switch (status) {
    case 'sent':
      return <Check className={cn('h-3 w-3 text-muted-foreground', className)} />;
    case 'delivered':
      return <CheckCheck className={cn('h-3 w-3 text-muted-foreground', className)} />;
    case 'read':
      return <CheckCheck className={cn('h-3 w-3 text-blue-500', className)} />;
    case 'failed':
      return <AlertCircle className={cn('h-3 w-3 text-red-500', className)} />;
    default:
      return <Clock className={cn('h-3 w-3 text-muted-foreground', className)} />;
  }
}

/**
 * Ícone baseado no tipo de mensagem (detectado pelo preview)
 */
function MessageTypeIcon({ preview }: { preview: string }) {
  if (preview.startsWith('[Imagem]') || preview.startsWith('[Image]')) {
    return <Image className="h-3 w-3 text-muted-foreground flex-shrink-0" />;
  }
  if (preview.startsWith('[Áudio]') || preview.startsWith('[Audio]')) {
    return <Mic className="h-3 w-3 text-muted-foreground flex-shrink-0" />;
  }
  if (preview.startsWith('[Vídeo]') || preview.startsWith('[Video]')) {
    return <Video className="h-3 w-3 text-muted-foreground flex-shrink-0" />;
  }
  if (preview.startsWith('[Documento]') || preview.startsWith('[Document]')) {
    return <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />;
  }
  if (preview.startsWith('[Localização]') || preview.startsWith('[Location]')) {
    return <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />;
  }
  if (preview.startsWith('[Contato]') || preview.startsWith('[Contact]')) {
    return <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />;
  }
  return null;
}
