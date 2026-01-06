import { useState, useCallback, useEffect, useRef } from 'react';
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
  Sparkles,
  RefreshCw,
  Bot,
  ArrowUpCircle,
  Paperclip as PaperclipIcon,
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
import { MessageInput, type MessageInputHandle } from './MessageInput';
import { ProceduresList } from './ProceduresList';
import { useWhatsAppMessages } from '@/hooks/useWhatsAppMessages';
import { useWhatsAppConversations } from '@/hooks/useWhatsAppConversations';
import { useWhatsAppRealtime } from '@/hooks/useWhatsAppRealtime';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useWhatsAppAI } from '@/hooks/useWhatsAppAI';
import { CONVERSATION_STATUS_CONFIG } from '@/types/whatsapp';
import { AISuggestionsPanel, ConversationInsights, LeadScoreBadge, AISettingsDialog } from '@/components/whatsapp/ai';
import type {
  WhatsAppConversationWithRelations,
  WhatsAppMessageWithRelations,
  WhatsAppConversationStatus,
} from '@/types/whatsapp';
import { CallButton } from '@/components/voip/CallButton';

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
  const messageInputRef = useRef<MessageInputHandle>(null);
  const [isDraggingGlobal, setIsDraggingGlobal] = useState(false);
  const dragCounter = useRef(0);

  const { canScheduleForOthers, isMedico } = useUserProfile();
  const canViewProcedures = canScheduleForOthers || isMedico;

  // AI Analysis - Passamos o user_id da conversa explicitamente para garantir
  // que a configuração do dono (médico) seja buscada corretamente
  const {
    analysis,
    suggestions,
    isLoadingAnalysis,
    isAnalyzing,
    analyzeConversation,
    markSuggestionUsed,
    aiConfig,
  } = useWhatsAppAI({
    conversationId: conversation.id,
    targetUserId: conversation.user_id // <-- Passa o dono da conversa diretamente
  });

  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [isAIProcessing, setIsAIProcessing] = useState(false);

  // Messages
  const {
    messages,
    isLoading: isLoadingMessages,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    sendText,
    sendMedia,
    isSending,
  } = useWhatsAppMessages({ conversationId: conversation.id });

  // ======================================================
  // Lógica de detecção do indicador "IA pensando"
  // Ativa quando: mensagem inbound recente + auto_reply ativo
  // Desativa quando: mensagem outbound chega OU timeout de 25s
  // ======================================================
  const [aiProcessingStartTime, setAiProcessingStartTime] = useState<string | null>(null);

  useEffect(() => {
    // Verificar se auto-reply está ativado
    if (!aiConfig?.auto_reply_enabled) {
      setIsAIProcessing(false);
      setAiProcessingStartTime(null);
      return;
    }

    // Pegar a última mensagem (mais recente)
    if (!messages || messages.length === 0) {
      setIsAIProcessing(false);
      return;
    }

    // Ordenar para garantir que pegamos a mais recente
    const sortedMsgs = [...messages].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const latestMsg = sortedMsgs[0];

    // Se a última mensagem é OUTBOUND (resposta nossa/IA), parar indicador
    if (latestMsg.direction === 'outbound') {
      setIsAIProcessing(false);
      setAiProcessingStartTime(null);
      return;
    }

    // Se a última mensagem é INBOUND (do paciente), verificar tempo
    const msgTime = new Date(latestMsg.created_at).getTime();
    const now = Date.now();
    const secondsSinceMessage = (now - msgTime) / 1000;

    // Mostrar indicador por até 25 segundos após mensagem do paciente
    // (15s debounce + ~10s para GPT processar)
    const INDICATOR_TIMEOUT_SECONDS = 25;

    if (secondsSinceMessage < INDICATOR_TIMEOUT_SECONDS) {
      setIsAIProcessing(true);
      if (!aiProcessingStartTime) {
        setAiProcessingStartTime(latestMsg.created_at);
      }
    } else {
      setIsAIProcessing(false);
      setAiProcessingStartTime(null);
    }

    // Timer para atualizar o estado a cada segundo
    const interval = setInterval(() => {
      const nowInner = Date.now();
      const secSinceMsg = (nowInner - msgTime) / 1000;

      if (secSinceMsg >= INDICATOR_TIMEOUT_SECONDS) {
        setIsAIProcessing(false);
        setAiProcessingStartTime(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [messages, aiConfig?.auto_reply_enabled]);

  // Conversation actions
  const {
    changeStatus,
    isChangingStatus,
    toggleMute,
    isTogglingMute,
  } = useWhatsAppConversations();

  const displayName =
    conversation.contact_name ||
    (conversation.contact as any)?.full_name ||
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

  const handleSendMedia = useCallback(
    async (file: File, caption?: string) => {
      // Simplificado: idealmente enviaria para storage e pegaria URL
      // Por agora, assumimos que o hook cuida disso ou apenas simula
      console.log('Sending media from ChatWindow drop:', file.name);
      // Aqui integraria com o upload real
    },
    []
  );

  const handleReply = useCallback((message: WhatsAppMessageWithRelations) => {
    setReplyTo(message);
    messageInputRef.current?.focus();
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

  // Estado para passar texto sugerido para o input
  const [inputTextOverride, setInputTextOverride] = useState<string | undefined>(undefined);

  // Handler para usar sugestão da IA
  const handleAISuggestionSelect = useCallback(
    async (suggestion: { id: string; content: string }) => {
      setInputTextOverride(suggestion.content);
      await markSuggestionUsed(suggestion.id, false);
      messageInputRef.current?.focus();
    },
    [markSuggestionUsed]
  );

  // Handler para analisar conversa
  const handleAnalyzeConversation = useCallback(
    () => analyzeConversation(false),
    [analyzeConversation]
  );

  // Drag and Drop Global
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    setIsDraggingGlobal(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDraggingGlobal(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingGlobal(false);
    dragCounter.current = 0;

    const text = e.dataTransfer.getData('text/plain');
    if (text) {
      messageInputRef.current?.appendText(text);
      return;
    }

    // Arquivos
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      // Poderia passar para o MessageInput via ref ou prop
      // Por agora apenas debug
      console.log('Drop de arquivo detectado:', file.name);
    }
  }, []);

  return (
    <div className="flex h-full overflow-hidden">
      <div
        className="flex-1 flex flex-col h-full min-w-0 border-r relative"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Global Drop Overlay */}
        {isDraggingGlobal && (
          <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-background/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="p-8 rounded-3xl border-4 border-dashed border-primary bg-background/80 shadow-2xl flex flex-col items-center gap-4 scale-110 transition-transform">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <ArrowUpCircle className="h-10 w-10 text-primary animate-bounce" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-foreground">Solte para enviar</h3>
                <p className="text-muted-foreground text-sm">Documentos, imagens ou procedimentos</p>
              </div>
            </div>
          </div>
        )}

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
                  (conversation.contact as any)?.avatar_url ||
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
            {/* AI Analysis Badge */}
            {analysis && (
              <LeadScoreBadge
                status={analysis.lead_status}
                probability={analysis.conversion_probability}
                size="sm"
                showProbability
                className="hidden md:flex mr-2"
              />
            )}

            {/* AI Config Button */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex text-muted-foreground hover:text-primary"
              onClick={() => setShowAISettings(true)}
              title="Configurar IA"
            >
              <Bot className="h-5 w-5" />
            </Button>

            {/* AI Action Button */}
            <Button
              variant={showAIPanel ? "secondary" : "ghost"}
              size="icon"
              className={cn(
                "hidden md:flex",
                showAIPanel && "bg-primary/10 text-primary border-primary/20",
                isAnalyzing && "animate-pulse font-bold"
              )}
              onClick={() => {
                setShowAIPanel(!showAIPanel);
                setShowProcedures(false);
              }}
              title="Análise IA"
            >
              {isAnalyzing ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
            </Button>

            {canViewProcedures && (
              <Button
                variant={showProcedures ? "secondary" : "ghost"}
                size="icon"
                className={cn("hidden md:flex", showProcedures && "bg-emerald-50 text-emerald-600 border-emerald-200")}
                onClick={() => {
                  setShowProcedures(!showProcedures);
                  setShowAIPanel(false);
                }}
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

            <CallButton
              phoneNumber={conversation.phone_number}
              contactName={displayName}
              contactId={conversation.contact_id || undefined}
              conversationId={conversation.id}
              className="hidden md:flex"
            />

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
            key={conversation.id}
            messages={messages}
            isLoading={isLoadingMessages}
            isFetchingMore={isFetchingNextPage}
            hasMore={hasNextPage}
            onLoadMore={fetchNextPage}
            onReply={handleReply}
            aiProcessing={isAIProcessing}
            aiProcessingStartedAt={aiProcessingStartTime}
          />
        </div>

        {/* AI Typing Indicator (bottom bar) */}
        {isAIProcessing && (
          <div className="px-4 py-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-t border-purple-500/20 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="relative">
              <Bot className="h-5 w-5 text-purple-500" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-purple-500 rounded-full animate-ping" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium text-foreground">
                IA processando resposta
              </span>
              <span className="text-xs text-muted-foreground ml-2">
                Analisando contexto da conversa...
              </span>
            </div>
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {/* AI Suggestions Inline (above input) */}
        {suggestions.length > 0 && (
          <div className="px-4 py-2 border-t bg-background/80">
            <AISuggestionsPanel
              suggestions={suggestions}
              isLoading={isAnalyzing}
              onSelectSuggestion={handleAISuggestionSelect}
              onRegenerateSuggestions={() => analyzeConversation(true)}
              compact
            />
          </div>
        )}

        {/* Input */}
        <MessageInput
          ref={messageInputRef}
          onSendText={handleSendText}
          replyTo={replyTo}
          onCancelReply={handleCancelReply}
          isSending={isSending}
          initialText={inputTextOverride}
        />
      </div>

      {/* Sidebar de AI */}
      {showAIPanel && (
        <div className="w-[350px] h-full border-l bg-background hidden md:block animate-in slide-in-from-right duration-300 overflow-y-auto shadow-2xl">
          <div className="p-4 space-y-4">
            <ConversationInsights
              analysis={analysis}
              isLoading={isLoadingAnalysis}
              isAnalyzing={isAnalyzing}
              onAnalyze={handleAnalyzeConversation}
              aiConfig={aiConfig}
            />
            {suggestions.length > 0 && (
              <AISuggestionsPanel
                suggestions={suggestions}
                isLoading={isAnalyzing}
                onSelectSuggestion={handleAISuggestionSelect}
                onRegenerateSuggestions={() => analyzeConversation(true)}
              />
            )}
          </div>
        </div>
      )}

      {/* Sidebar de Procedimentos */}
      {showProcedures && canViewProcedures && (
        <div className="w-80 h-full border-l bg-background hidden md:block animate-in slide-in-from-right duration-300">
          <ProceduresList />
        </div>
      )}

      {/* Dialogs */}
      <AISettingsDialog
        open={showAISettings}
        onOpenChange={setShowAISettings}
        targetUserId={conversation.user_id}
      />
    </div>
  );
}
