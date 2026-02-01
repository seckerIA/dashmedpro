/**
 * Página principal do Inbox WhatsApp
 * Layout estilo Chatwoot com lista de conversas + chat + sidebar
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Settings, MessageCircle, Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WhatsAppLayout } from '@/components/whatsapp/WhatsAppLayout';
import { ConversationList } from '@/components/whatsapp/inbox/ConversationList';
import { ConversationFilters } from '@/components/whatsapp/inbox/ConversationFilters';
import { ChatWindow } from '@/components/whatsapp/chat/ChatWindow';
import { ConversationSidebar } from '@/components/whatsapp/sidebar/ConversationSidebar';
import { InboxSourceSelector } from '@/components/whatsapp/inbox/InboxSourceSelector';
import { AISettingsToggle } from '@/components/whatsapp/ai/AISettingsToggle';
import { useWhatsAppConfig } from '@/hooks/useWhatsAppConfig';
import { useWhatsAppConversations } from '@/hooks/useWhatsAppConversations';
import { useDoctorSecretaries } from '@/hooks/useDoctorSecretaries';
import { useWhatsAppRealtime } from '@/hooks/useWhatsAppRealtime';
import type {
  WhatsAppConversationWithRelations,
  WhatsAppConversationFilters,
} from '@/types/whatsapp';

export default function WhatsAppInbox() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Config check
  const { isConfigured, isActive, isLoading: isLoadingConfig } = useWhatsAppConfig();
  const { secretaryIds, isLoading: isLoadingSecretaries } = useDoctorSecretaries();

  // Filters state
  const [filters, setFilters] = useState<WhatsAppConversationFilters>({});

  // handleOwnerChange
  const handleOwnerChange = useCallback((ownerId: string | 'all' | undefined) => {
    setFilters(prev => ({ ...prev, ownerId }));
  }, []);

  // ... (conversations query remains same) ...
  const {
    conversations,
    stats,
    isLoading: isLoadingConversations,
    isLoadingStats,
    refetch,
    markAsRead,
    isMarkingAsRead,
  } = useWhatsAppConversations({ filters });

  // State
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get('conversation'));
  const selectedConversation = useMemo(() =>
    conversations.find(c => c.id === selectedId) || null
    , [conversations, selectedId]);
  const [showSidebar, setShowSidebar] = useState(false);

  // Realtime subscription (global)
  useWhatsAppRealtime({
    ignoreConversationId: selectedConversation?.id,
  });

  // Load conversation from URL
  useEffect(() => {
    if (isLoadingConversations) return;

    const conversationId = searchParams.get('conversation');
    const phone = searchParams.get('phone');

    if (conversations.length > 0) {
      let found: WhatsAppConversationWithRelations | undefined;

      if (conversationId) {
        found = conversations.find(c => c.id === conversationId);
      } else if (phone) {
        const cleanPhone = phone.replace(/\D/g, '');
        found = conversations.find(c => {
          const cPhone = (c.phone_number || '').replace(/\D/g, '');
          return cPhone.includes(cleanPhone) || cleanPhone.includes(cPhone);
        });
      }

      if (found) {
        setSelectedId(found.id);
        // Se encontramos por telefone, atualizamos a URL para o ID da conversa e removemos o phone
        if (phone || (conversationId && conversationId !== found.id)) {
          setSearchParams({ conversation: found.id }, { replace: true });
        }
      } else if (phone) {
        // Se temos telefone mas não achamos na lista atual, tentamos filtrar a pesquisa
        if (filters.search !== phone) {
          setFilters(prev => ({ ...prev, search: phone }));
        }
      }
    } else if (phone && !isLoadingConversations && filters.search !== phone) {
      // Se a lista está vazia e temos phone, tenta pesquisar
      setFilters(prev => ({ ...prev, search: phone }));
    }
  }, [searchParams, conversations, isLoadingConversations, setSearchParams, filters.search, setFilters]);

  // Handlers
  const handleSelectConversation = useCallback(
    async (conversation: WhatsAppConversationWithRelations) => {
      setSelectedId(conversation.id);
      setSearchParams({ conversation: conversation.id });

      // Marcar como lida
      if (conversation.unread_count > 0) {
        await markAsRead(conversation.id);
      }
    },
    [setSearchParams, markAsRead]
  );

  const handleFiltersChange = useCallback(
    (newFilters: WhatsAppConversationFilters) => {
      setFilters(newFilters);
    },
    []
  );

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const toggleSidebar = useCallback(() => {
    setShowSidebar(prev => !prev);
  }, []);

  // Marcar como lida automaticamente se a conversa selecionada tiver mensagens não lidas
  const lastMarkedRead = useRef<Record<string, number>>({});

  useEffect(() => {
    if (selectedConversation && selectedConversation.unread_count > 0 && !isMarkingAsRead) {
      const convId = selectedConversation.id;
      const now = Date.now();
      const lastTime = lastMarkedRead.current[convId] || 0;

      // Debounce: evita loop se o servidor demorar para refletir o "lido" (janela de 5s)
      if (now - lastTime > 5000) {
        lastMarkedRead.current[convId] = now;
        markAsRead(convId);
      }
    }
  }, [selectedConversation?.id, selectedConversation?.unread_count, markAsRead, isMarkingAsRead]);

  // Loading state
  if (isLoadingConfig || isLoadingSecretaries) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not configured - redirect to settings (Bypass if user has linked secretaries)
  const hasLinkedSecretaries = secretaryIds && secretaryIds.length > 0;

  if (!isConfigured && !hasLinkedSecretaries) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4">
        <div className="p-6 rounded-full bg-green-500/10">
          <MessageCircle className="h-16 w-16 text-green-500" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">WhatsApp não configurado</h1>
          <p className="text-muted-foreground max-w-md">
            Para começar a usar o chat do WhatsApp, você precisa configurar suas
            credenciais da API do WhatsApp Business.
          </p>
        </div>
        <Button onClick={() => navigate('/whatsapp/settings')} size="lg">
          <Settings className="h-5 w-5 mr-2" />
          Configurar WhatsApp
        </Button>
      </div>
    );
  }

  // Configured but inactive (Only check strictly if it IS configured for self, otherwise ignore for doctor view)
  if (isConfigured && !isActive) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4">
        <div className="p-6 rounded-full bg-yellow-500/10">
          <MessageCircle className="h-16 w-16 text-yellow-500" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">WhatsApp inativo</h1>
          <p className="text-muted-foreground max-w-md">
            A integração com WhatsApp está configurada mas desativada.
            Ative-a nas configurações para começar a usar.
          </p>
        </div>
        <Button onClick={() => navigate('/whatsapp/settings')} size="lg">
          <Settings className="h-5 w-5 mr-2" />
          Ir para Configurações
        </Button>
      </div>
    );
  }

  // Inbox content
  const inboxContent = (
    <div className="flex flex-col h-full">
      {/* Seletor de Secretária + Follow-Up (apenas para médicos) */}
      {hasLinkedSecretaries && (
        <div className="p-2 border-b flex items-center gap-2">
          <InboxSourceSelector
            currentOwnerId={filters.ownerId}
            onOwnerChange={handleOwnerChange}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/followup')}
            className="flex-shrink-0 gap-2"
          >
            <Zap className="h-4 w-4 text-yellow-500" />
            Follow-Up
          </Button>
        </div>
      )}

      {/* AI Toggle for Secretaries/Owners */}
      <div className="p-2 border-b">
        <AISettingsToggle />
      </div>

      {/* Filtros */}
      <ConversationFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        stats={stats}
      />

      {/* Lista de conversas */}
      <div className="flex-1 overflow-hidden">
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversation?.id}
          onSelect={handleSelectConversation}
          isLoading={isLoadingConversations}
          onRefresh={handleRefresh}
          isRefreshing={isLoadingConversations}
        />
      </div>
    </div>
  );

  // Chat content
  const chatContent = selectedConversation ? (
    <ChatWindow
      conversation={selectedConversation}
      onBack={() => {
        setSelectedId(null);
        setSearchParams({});
      }}
      onToggleSidebar={toggleSidebar}
      showBackButton={true}
    />
  ) : null;

  // Sidebar content
  const sidebarContent = selectedConversation && showSidebar ? (
    <ConversationSidebar
      conversation={selectedConversation}
      onClose={toggleSidebar}
    />
  ) : null;

  return (
    <WhatsAppLayout
      inbox={inboxContent}
      chat={chatContent}
      sidebar={sidebarContent}
      selectedConversationId={selectedId || undefined}
      showSidebar={showSidebar}
      onToggleSidebar={toggleSidebar}
    />
  );
}
