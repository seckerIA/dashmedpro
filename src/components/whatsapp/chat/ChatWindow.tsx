/**
 * Janela principal do chat WhatsApp
 */

import { useState, useCallback } from 'react';
import {
  MoreVertical,
  Phone,
  Video,
  Search,
  CheckCircle2,
  Clock,
  AlertOctagon,
  Tag,
  UserPlus,
  VolumeX,
  Volume2,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useWhatsAppMessages } from '@/hooks/useWhatsAppMessages';
import { useWhatsAppConversations } from '@/hooks/useWhatsAppConversations';
import { CONVERSATION_STATUS_CONFIG } from '@/types/whatsapp';
import type {
  WhatsAppConversationWithRelations,
  WhatsAppMessageWithRelations,
  WhatsAppConversationStatus,
} from '@/types/whatsapp';

interface ChatWindowProps {
  conversation: WhatsAppConversationWithRelations;
  onBack?: () => void;
  onToggleSidebar?: () => void;
  showBackButton?: boolean;
}

export function ChatWindow({
  conversation,
  onBack,
  onToggleSidebar,
  showBackButton,
}: ChatWindowProps) {
  const [replyTo, setReplyTo] = useState<WhatsAppMessageWithRelations | null>(
    null
  );

  // Messages
  const {
    messages,
    isLoading: isLoadingMessages,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    sendText,
    isSending,
  } = useWhatsAppMessages({ conversationId: conversation.id });

  // Conversation actions
  const {
    changeStatus,
    isChangingStatus,
    toggleMute,
    isTogglingMute,
  } = useWhatsAppConversations();

  const displayName =
    conversation.contact_name ||
    conversation.contact?.name ||
    conversation.phone_number;
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const statusConfig = CONVERSATION_STATUS_CONFIG[conversation.status];

  // Handlers
  const handleSendText = useCallback(
    async (text: string) => {
      await sendText({
        conversation_id: conversation.id,
        content: text,
        reply_to_message_id: replyTo?.id,
      });
      setReplyTo(null);
    },
    [sendText, replyTo, conversation.id]
  );

  const handleReply = useCallback((message: WhatsAppMessageWithRelations) => {
    setReplyTo(message);
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyTo(null);
  }, []);

  const handleStatusChange = useCallback(
    async (status: WhatsAppConversationStatus) => {
      await changeStatus({
        conversationId: conversation.id,
        status,
      });
    },
    [changeStatus, conversation.id]
  );

  const handleToggleMute = useCallback(async () => {
    await toggleMute({
      conversationId: conversation.id,
      mute: !conversation.is_muted,
    });
  }, [toggleMute, conversation.id, conversation.is_muted]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
        <div className="flex items-center gap-3 min-w-0">
          {/* Back button (mobile) */}
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0 -ml-2 md:hidden"
              onClick={onBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}

          {/* Avatar */}
          <Avatar
            className="h-10 w-10 flex-shrink-0 cursor-pointer"
            onClick={onToggleSidebar}
          >
            <AvatarImage
              src={
                conversation.contact_profile_picture ||
                conversation.contact?.avatar_url ||
                undefined
              }
            />
            <AvatarFallback className="bg-green-500/10 text-green-600">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div
            className="min-w-0 cursor-pointer"
            onClick={onToggleSidebar}
          >
            <div className="flex items-center gap-2">
              <h2 className="font-medium truncate">{displayName}</h2>
              {conversation.is_muted && (
                <VolumeX className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground truncate">
                {conversation.phone_number}
              </span>
              {statusConfig && (
                <Badge
                  variant="secondary"
                  className={cn('h-5 text-[10px]', statusConfig.color)}
                >
                  {statusConfig.label}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex"
            onClick={onToggleSidebar}
          >
            <Search className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {/* Status changes */}
              <DropdownMenuItem
                onClick={() => handleStatusChange('open')}
                disabled={conversation.status === 'open' || isChangingStatus}
              >
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                Marcar como aberta
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusChange('pending')}
                disabled={conversation.status === 'pending' || isChangingStatus}
              >
                <Clock className="h-4 w-4 mr-2 text-yellow-500" />
                Marcar como pendente
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusChange('resolved')}
                disabled={conversation.status === 'resolved' || isChangingStatus}
              >
                <CheckCircle2 className="h-4 w-4 mr-2 text-blue-500" />
                Marcar como resolvida
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusChange('spam')}
                disabled={conversation.status === 'spam' || isChangingStatus}
              >
                <AlertOctagon className="h-4 w-4 mr-2 text-red-500" />
                Marcar como spam
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Other actions */}
              <DropdownMenuItem
                onClick={handleToggleMute}
                disabled={isTogglingMute}
              >
                {conversation.is_muted ? (
                  <>
                    <Volume2 className="h-4 w-4 mr-2" />
                    Ativar notificações
                  </>
                ) : (
                  <>
                    <VolumeX className="h-4 w-4 mr-2" />
                    Silenciar
                  </>
                )}
              </DropdownMenuItem>

              <DropdownMenuItem onClick={onToggleSidebar}>
                <Tag className="h-4 w-4 mr-2" />
                Ver detalhes
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden bg-muted/20">
        <MessageList
          messages={messages}
          isLoading={isLoadingMessages}
          isFetchingMore={isFetchingNextPage}
          hasMore={hasNextPage}
          onLoadMore={fetchNextPage}
          onReply={handleReply}
        />
      </div>

      {/* Input */}
      <MessageInput
        onSendText={handleSendText}
        replyTo={replyTo}
        onCancelReply={handleCancelReply}
        isSending={isSending}
      />
    </div>
  );
}
