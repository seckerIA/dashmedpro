/**
 * Input de mensagem do chat WhatsApp
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Smile,
  X,
  Image as ImageIcon,
  FileText,
  Mic,
  Video,
  CornerUpLeft,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { WhatsAppMessageWithRelations } from '@/types/whatsapp';

interface MessageInputProps {
  onSendText: (text: string) => Promise<void>;
  onSendMedia?: (file: File, caption?: string) => Promise<void>;
  replyTo?: WhatsAppMessageWithRelations | null;
  onCancelReply?: () => void;
  disabled?: boolean;
  isSending?: boolean;
}

// Emojis comuns para acesso rápido
const QUICK_EMOJIS = ['👍', '❤️', '😊', '😂', '🙏', '👏', '🎉', '✅', '👋', '💪'];

export function MessageInput({
  onSendText,
  onSendMedia,
  replyTo,
  onCancelReply,
  disabled,
  isSending,
}: MessageInputProps) {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Focus no input quando muda replyTo
  useEffect(() => {
    if (replyTo) {
      textareaRef.current?.focus();
    }
  }, [replyTo]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [text]);

  const handleSubmit = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || disabled || isSending) return;

    try {
      await onSendText(trimmed);
      setText('');
      onCancelReply?.();
    } catch (error) {
      // Error handled by parent
    }
  }, [text, disabled, isSending, onSendText, onCancelReply]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleEmojiSelect = useCallback((emoji: string) => {
    setText(prev => prev + emoji);
    setShowEmoji(false);
    textareaRef.current?.focus();
  }, []);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && onSendMedia) {
        await onSendMedia(file);
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [onSendMedia]
  );

  const handleAttachmentClick = useCallback((type: string) => {
    const input = fileInputRef.current;
    if (!input) return;

    switch (type) {
      case 'image':
        input.accept = 'image/*';
        break;
      case 'video':
        input.accept = 'video/*';
        break;
      case 'document':
        input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.txt';
        break;
      default:
        input.accept = '*/*';
    }
    input.click();
  }, []);

  return (
    <div className="border-t bg-background">
      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 border-b">
          <CornerUpLeft className="h-4 w-4 text-green-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Respondendo</p>
            <p className="text-sm truncate">{replyTo.content}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={onCancelReply}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2 p-3">
        {/* Emoji picker */}
        <Popover open={showEmoji} onOpenChange={setShowEmoji}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 flex-shrink-0"
              disabled={disabled}
            >
              <Smile className="h-5 w-5 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="start"
            className="w-auto p-2"
          >
            <div className="flex gap-1">
              {QUICK_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  className="text-xl p-1 hover:bg-muted rounded transition-colors"
                  onClick={() => handleEmojiSelect(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Attachment menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 flex-shrink-0"
              disabled={disabled}
            >
              <Paperclip className="h-5 w-5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start">
            <DropdownMenuItem onClick={() => handleAttachmentClick('image')}>
              <ImageIcon className="h-4 w-4 mr-2 text-blue-500" />
              Imagem
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAttachmentClick('video')}>
              <Video className="h-4 w-4 mr-2 text-purple-500" />
              Vídeo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAttachmentClick('document')}>
              <FileText className="h-4 w-4 mr-2 text-orange-500" />
              Documento
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Text input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite uma mensagem..."
            className={cn(
              'min-h-[40px] max-h-[150px] py-2.5 px-4 resize-none',
              'rounded-2xl border-muted-foreground/20',
              'focus-visible:ring-green-500/50'
            )}
            disabled={disabled || isSending}
            rows={1}
          />
        </div>

        {/* Send button */}
        <Button
          size="icon"
          className={cn(
            'h-10 w-10 rounded-full flex-shrink-0',
            'bg-green-500 hover:bg-green-600'
          )}
          onClick={handleSubmit}
          disabled={!text.trim() || disabled || isSending}
        >
          {isSending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
}
