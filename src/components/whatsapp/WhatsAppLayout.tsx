/**
 * Layout principal do WhatsApp Chat
 * Layout de 3 colunas: Inbox | Chat | Sidebar
 */

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';

interface WhatsAppLayoutProps {
  inbox: React.ReactNode;
  chat: React.ReactNode;
  sidebar?: React.ReactNode;
  showSidebar?: boolean;
  onToggleSidebar?: () => void;
  selectedConversationId?: string | null;
}

export function WhatsAppLayout({
  inbox,
  chat,
  sidebar,
  showSidebar = false,
  onToggleSidebar,
  selectedConversationId,
}: WhatsAppLayoutProps) {
  return (
    <div className="h-[calc(100dvh-64px)] flex overflow-hidden bg-background relative">
      {/* Coluna 1: Inbox/Lista de conversas */}
      <div
        className={cn(
          'w-full md:w-80 lg:w-96 border-r flex-shrink-0 flex flex-col',
          // Hide inbox on mobile/tablet when a chat is selected
          // Show again at lg (1024px+) where there's room for both panes
          selectedConversationId && 'hidden lg:flex'
        )}
      >
        {inbox}
      </div>

      {/* Coluna 2: Chat */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0',
          // Mobile: esconder quando nenhum chat selecionado
          !selectedConversationId && 'hidden md:flex'
        )}
      >
        {chat}
      </div>

      {/* Coluna 3: Sidebar (info do contato, notas, labels) */}
      {sidebar && showSidebar && (
        <div className="hidden lg:flex w-80 border-l flex-shrink-0 flex-col">
          {sidebar}
        </div>
      )}

      {/* Botão toggle sidebar (visível apenas em telas grandes) */}
      {sidebar && onToggleSidebar && (
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:flex absolute right-4 top-4 z-10"
          onClick={onToggleSidebar}
        >
          {showSidebar ? (
            <PanelRightClose className="h-4 w-4" />
          ) : (
            <PanelRightOpen className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  );
}

/**
 * Placeholder para quando nenhuma conversa está selecionada
 */
export function EmptyChatPlaceholder() {
  return (
    <div className="flex-1 flex items-center justify-center bg-muted/30">
      <div className="text-center space-y-3 p-8">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            className="w-8 h-8 text-green-500"
            fill="currentColor"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium">WhatsApp Chat</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Selecione uma conversa para começar a enviar mensagens
        </p>
      </div>
    </div>
  );
}
