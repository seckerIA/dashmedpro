/**
 * Lista de conversas do inbox WhatsApp
 */

import { useRef, useCallback } from 'react';
import { Loader2, MessageSquare, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ConversationItem } from './ConversationItem';
import type { WhatsAppConversationWithRelations } from '@/types/whatsapp';

interface ConversationListProps {
  conversations: WhatsAppConversationWithRelations[];
  selectedId?: string;
  onSelect: (conversation: WhatsAppConversationWithRelations) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  isLoading,
  onRefresh,
  isRefreshing,
}: ConversationListProps) {
  const listRef = useRef<HTMLDivElement>(null);

  const handleRefresh = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground mt-2">Carregando conversas...</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center">
        <div className="p-4 rounded-full bg-muted mb-4">
          <MessageSquare className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-foreground">Nenhuma conversa</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Quando pacientes enviarem mensagens pelo WhatsApp, elas aparecerão aqui.
        </p>
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Atualizar
          </Button>
        )}
      </div>
    );
  }

  return (
    <div ref={listRef} className="flex flex-col h-full overflow-y-auto">
      {/* Header com contagem e refresh */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
        <span className="text-xs text-muted-foreground">
          {conversations.length} conversa{conversations.length !== 1 ? 's' : ''}
        </span>
        {onRefresh && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={cn('h-3 w-3', isRefreshing && 'animate-spin')}
            />
          </Button>
        )}
      </div>

      {/* Lista de conversas */}
      <div className="flex-1 divide-y">
        {conversations.map(conversation => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            isSelected={conversation.id === selectedId}
            onClick={() => onSelect(conversation)}
          />
        ))}
      </div>
    </div>
  );
}
