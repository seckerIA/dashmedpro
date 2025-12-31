/**
 * Página principal do Inbox WhatsApp
 * Layout estilo Chatwoot com lista de conversas + chat + sidebar
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Settings, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WhatsAppLayout } from '@/components/whatsapp/WhatsAppLayout';
import { ConversationList } from '@/components/whatsapp/inbox/ConversationList';
import { ConversationFilters } from '@/components/whatsapp/inbox/ConversationFilters';
import { ChatWindow } from '@/components/whatsapp/chat/ChatWindow';
import { ConversationSidebar } from '@/components/whatsapp/sidebar/ConversationSidebar';
import { useWhatsAppConfig } from '@/hooks/useWhatsAppConfig';
import { useWhatsAppConversations } from '@/hooks/useWhatsAppConversations';
import type {
  WhatsAppConversationWithRelations,
  WhatsAppConversationFilters,
} from '@/types/whatsapp';

export default function WhatsAppInbox() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Config check
  const { isConfigured, isActive, isLoading: isLoadingConfig } = useWhatsAppConfig();

  // State
  const [selectedConversation, setSelectedConversation] =
    useState<WhatsAppConversationWithRelations | null>(null);
  const [filters, setFilters] = useState<WhatsAppConversationFilters>({});
  const [showSidebar, setShowSidebar] = useState(false);

  // Conversations query
  const {
    conversations,
    stats,
    isLoading: isLoadingConversations,
    isLoadingStats,
    refetch,
    markAsRead,
  } = useWhatsAppConversations({ filters });

  // Load conversation from URL
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    if (conversationId && conversations.length > 0) {
      const found = conversations.find(c => c.id === conversationId);
      if (found) {
        setSelectedConversation(found);
      }
    }
  }, [searchParams, conversations]);

  // Handlers
  const handleSelectConversation = useCallback(
    async (conversation: WhatsAppConversationWithRelations) => {
      setSelectedConversation(conversation);
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

  // Loading state
  if (isLoadingConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not configured - redirect to settings
  if (!isConfigured) {
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

  // Configured but inactive
  if (!isActive) {
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
        setSelectedConversation(null);
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
      selectedConversation={selectedConversation}
      showSidebar={showSidebar}
      onToggleSidebar={toggleSidebar}
      onBackToList={() => {
        setSelectedConversation(null);
        setSearchParams({});
      }}
    />
  );
}
