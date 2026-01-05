/**
 * AI Typing Indicator Component
 * Shows when AI is processing/generating a response
 */

import { memo } from 'react';
import { Bot, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AITypingIndicatorProps {
    isVisible: boolean;
    startedAt?: string | null;
}

export const AITypingIndicator = memo(function AITypingIndicator({
    isVisible,
    startedAt,
}: AITypingIndicatorProps) {
    if (!isVisible) return null;

    // Calculate how long AI has been processing
    const processingSeconds = startedAt
        ? Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
        : 0;

    return (
        <div className="flex gap-2 px-4 py-2 justify-end">
            <div className="flex items-center gap-2 max-w-[70%] rounded-2xl px-4 py-3 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-br-md">
                {/* Robot icon with pulse animation */}
                <div className="relative">
                    <Bot className="h-5 w-5 text-purple-500" />
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-purple-500 rounded-full animate-ping" />
                </div>

                {/* Text content */}
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground flex items-center gap-2">
                        IA analisando conversa
                        <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {processingSeconds < 10
                            ? 'Preparando resposta...'
                            : processingSeconds < 20
                                ? 'Analisando contexto...'
                                : 'Finalizando análise...'
                        }
                    </span>
                </div>

                {/* Typing dots animation */}
                <div className="flex gap-1 ml-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        </div>
    );
});
