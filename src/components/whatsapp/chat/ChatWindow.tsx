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
  Stethoscope,
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
import { ProceduresList } from './ProceduresList';
import { SmartReplyDialog } from './SmartReplyDialog';
import { useWhatsAppMessages } from '@/hooks/useWhatsAppMessages';
import { useWhatsAppConversations } from '@/hooks/useWhatsAppConversations';
import { useWhatsAppRealtime } from '@/hooks/useWhatsAppRealtime';
import { useUserProfile } from '@/hooks/useUserProfile';
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
  const [showProcedures, setShowProcedures] = useState(false);
  const [showSmartReply, setShowSmartReply] = useState(false);

  const { canScheduleForOthers, isMedico } = useUserProfile();
  const canViewProcedures = canScheduleForOthers || isMedico;

  // Realtime subscription for this specific chat
  useWhatsAppRealtime({
    conversationId: conversation.id,
    enabled: true,
  });

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

  const handleSmartReplySelect = useCallback((text: string) => {
    // Apenas preenche o input (mas como o input controla seu próprio estado,
    // precisaremos de uma forma de passar isso.
    // O Hook handleSendText envia direto. O ideal é o SmartReplyDialog
    // retornar o texto para o MessageInput.
    // Como o MessageInput tem estado local 'text', vou fazer o seguinte:
    // Vou injetar o texto via uma ref ou callback se possível,
    // mas por simplicidade, o MessageInput vai ter que expor um jeito de setar texto
    // OU ele mesmo gerencia o Dialog.
    // SIMPLIFICAÇÃO: O SmartReplyDialog passa o texto para um handler que chama handleSendText direto?
    // O usuário pode querer editar.
    // Então o MessageInput é quem deve controlar o Dialog ou receber o texto.
    // Vou refatorar levemente o MessageInput para aceitar 'initialText' ou expor 'setText'.
    // MELHOR AINDA: O MessageInput controla o Dialog internamente ou via composition.
    // Mas o Dialog está aqui fora.

    // Vou mudar a estratégia: Passar o texto para uma prop `suggestedText` no MessageInput
    // que quando muda, atualiza o estado interno.
  }, []);

  // Como não quero mudar muito o MessageInput agora, vou usar uma solução direta:
  // O Dialog vai ficar PERTO do input, talvez dentro dele? Não, melhor aqui fora.
  // Vou criar um estado `inputTextOverride` e passar para MessageInput.
  const [inputTextOverride, setInputTextOverride] = useState<string | undefined>(undefined);

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col h-full min-w-0 border-r">
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
            {canViewProcedures && (
              <Button
                variant={showProcedures ? "secondary" : "ghost"}
                size="icon"
                className={cn("hidden md:flex", showProcedures && "bg-purple-100 text-purple-600")}
                onClick={() => setShowProcedures(!showProcedures)}
                title="Procedimentos"
              >
                <Stethoscope className="h-5 w-5" />
              </Button>
            )}

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
        <div className="flex-1 flex flex-col overflow-hidden bg-muted/20">
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
          onSmartReply={canViewProcedures ? () => setShowSmartReply(true) : undefined}
          initialText={inputTextOverride}
        // Passamos o texto sugerido via key para forçar re-render se mudar?
        // Não é ideal. O correto é MessageInput observar uma prop.
        // Vou alterar MessageInput rapidamente após isso.
        />
      </div>

      {/* Sidebar de Procedimentos */}
      {showProcedures && canViewProcedures && (
        <div className="w-80 h-full border-l bg-background hidden md:block animate-in slide-in-from-right duration-300">
          <ProceduresList />
        </div>
      )}

      <SmartReplyDialog
        open={showSmartReply}
        onOpenChange={setShowSmartReply}
        onSelectReply={(text) => {
          setInputTextOverride(text);
          // Precisamos de um jeito de passar isso para o MessageInput.
          // Vou atualizar o MessageInput para lidar com isso.
        }}
        customerName={displayName}
      />
    </div>
  );
}
