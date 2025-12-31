/**
 * Lista de mensagens do chat com scroll infinito
 */

import { useRef, useEffect, useCallback, Fragment } from 'react';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MessageItem } from './MessageItem';
import type { WhatsAppMessageWithRelations } from '@/types/whatsapp';

interface MessageListProps {
  messages: WhatsAppMessageWithRelations[];
  isLoading?: boolean;
  isFetchingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onReply?: (message: WhatsAppMessageWithRelations) => void;
}

export function MessageList({
  messages,
  isLoading,
  isFetchingMore,
  hasMore,
  onLoadMore,
  onReply,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isAtBottom = useRef(true);
  const lastMessageCount = useRef(messages.length);

  // Scroll to bottom quando novas mensagens chegam
  useEffect(() => {
    if (messages.length > lastMessageCount.current && isAtBottom.current) {
      scrollToBottom();
    }
    lastMessageCount.current = messages.length;
  }, [messages.length]);

  // Initial scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, []);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check if at bottom
    const { scrollTop, scrollHeight, clientHeight } = container;
    isAtBottom.current = scrollHeight - scrollTop - clientHeight < 50;

    // Load more when scrolled to top
    if (scrollTop < 100 && hasMore && !isFetchingMore) {
      onLoadMore?.();
    }
  }, [hasMore, isFetchingMore, onLoadMore]);

  // Group messages by date
  const groupedMessages = groupMessagesByDate(messages);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div className="p-4 rounded-full bg-muted mb-4">
          <svg
            className="h-8 w-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <h3 className="font-medium">Nenhuma mensagem</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Comece uma conversa enviando uma mensagem
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto"
      onScroll={handleScroll}
    >
      {/* Load more indicator */}
      {isFetchingMore && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Has more indicator */}
      {hasMore && !isFetchingMore && (
        <div className="flex justify-center py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLoadMore}
            className="text-xs"
          >
            Carregar mensagens anteriores
          </Button>
        </div>
      )}

      {/* Messages grouped by date */}
      {groupedMessages.map(({ date, messages: dayMessages }) => (
        <Fragment key={date}>
          {/* Date separator */}
          <DateSeparator date={date} />

          {/* Messages */}
          {dayMessages.map((message, index) => {
            const prevMessage = index > 0 ? dayMessages[index - 1] : null;
            const isFirstInGroup =
              !prevMessage ||
              prevMessage.direction !== message.direction ||
              (message.sent_at &&
                prevMessage.sent_at &&
                new Date(message.sent_at).getTime() -
                  new Date(prevMessage.sent_at).getTime() >
                  5 * 60 * 1000); // 5 minutos

            return (
              <MessageItem
                key={message.id}
                message={message}
                isFirst={isFirstInGroup}
                showAvatar={isFirstInGroup && message.direction === 'inbound'}
                onReply={onReply}
              />
            );
          })}
        </Fragment>
      ))}

      {/* Bottom anchor */}
      <div ref={bottomRef} className="h-1" />

      {/* Scroll to bottom button (quando não está no bottom) */}
      {!isAtBottom.current && (
        <Button
          variant="secondary"
          size="icon"
          className="fixed bottom-24 right-8 rounded-full shadow-lg"
          onClick={scrollToBottom}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

/**
 * Separador de data entre mensagens
 */
function DateSeparator({ date }: { date: string }) {
  const dateObj = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let label: string;
  if (isSameDay(dateObj, today)) {
    label = 'Hoje';
  } else if (isSameDay(dateObj, yesterday)) {
    label = 'Ontem';
  } else {
    label = format(dateObj, "d 'de' MMMM", { locale: ptBR });
  }

  return (
    <div className="flex items-center justify-center py-4">
      <div className="px-3 py-1 rounded-full bg-muted text-xs text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

/**
 * Agrupar mensagens por data
 */
function groupMessagesByDate(
  messages: WhatsAppMessageWithRelations[]
): { date: string; messages: WhatsAppMessageWithRelations[] }[] {
  const groups = new Map<string, WhatsAppMessageWithRelations[]>();

  // Mensagens vêm ordenadas do mais antigo para o mais novo
  const sortedMessages = [...messages].sort((a, b) => {
    const dateA = a.sent_at ? new Date(a.sent_at).getTime() : 0;
    const dateB = b.sent_at ? new Date(b.sent_at).getTime() : 0;
    return dateA - dateB;
  });

  for (const message of sortedMessages) {
    const date = message.sent_at
      ? format(new Date(message.sent_at), 'yyyy-MM-dd')
      : 'unknown';

    if (!groups.has(date)) {
      groups.set(date, []);
    }
    groups.get(date)!.push(message);
  }

  return Array.from(groups.entries()).map(([date, msgs]) => ({
    date,
    messages: msgs,
  }));
}
