/**
 * AISuggestionsPanel
 * Painel com sugestões de mensagem geradas pela IA
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Sparkles,
  Zap,
  MessageSquare,
  FileText,
  Calendar,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import type { AISuggestion, SuggestionType } from '@/types/whatsappAI';
import { SUGGESTION_TYPE_CONFIG } from '@/types/whatsappAI';

interface AISuggestionsPanelProps {
  suggestions: AISuggestion[];
  isLoading?: boolean;
  onSelectSuggestion: (suggestion: AISuggestion) => void;
  onRegenerateSuggestions?: () => void;
  className?: string;
  compact?: boolean;
}

const iconMap: Record<SuggestionType, React.ElementType> = {
  quick_reply: Zap,
  full_message: MessageSquare,
  procedure_info: FileText,
  scheduling: Calendar,
  follow_up: RefreshCw,
};

export function AISuggestionsPanel({
  suggestions,
  isLoading,
  onSelectSuggestion,
  onRegenerateSuggestions,
  className,
  compact = false,
}: AISuggestionsPanelProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(!compact);

  const handleCopy = async (suggestion: AISuggestion) => {
    try {
      await navigator.clipboard.writeText(suggestion.content);
      setCopiedId(suggestion.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleSelect = (suggestion: AISuggestion) => {
    onSelectSuggestion(suggestion);
  };

  if (suggestions.length === 0 && !isLoading) {
    return null;
  }

  if (compact && !isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground',
          'bg-purple-500/5 hover:bg-purple-500/10 rounded-lg transition-colors',
          'border border-purple-500/20',
          className
        )}
      >
        <Sparkles className="h-4 w-4 text-purple-500" />
        <span>{suggestions.length} sugestões da IA</span>
        <ChevronDown className="h-4 w-4 ml-auto" />
      </button>
    );
  }

  return (
    <Card
      className={cn(
        'bg-background border-primary/20 shadow-sm transition-all duration-200',
        className
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium">Sugestões Turbo</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {onRegenerateSuggestions && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 text-xs gap-1.5"
                      onClick={onRegenerateSuggestions}
                      disabled={isLoading}
                    >
                      <RefreshCw
                        className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')}
                      />
                      <span>Atualizar</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Gerar novas sugestões (Ctrl+R)</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {compact && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setIsExpanded(false)}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <CardDescription className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70">
          Sugerido pela IA de Conversão
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-2 pt-0">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 rounded-lg bg-muted/50 animate-pulse"
              />
            ))}
          </div>
        ) : (
          suggestions.map((suggestion, index) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              index={index}
              isCopied={copiedId === suggestion.id}
              onSelect={() => handleSelect(suggestion)}
              onCopy={() => handleCopy(suggestion)}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

interface SuggestionCardProps {
  suggestion: AISuggestion;
  index: number;
  isCopied: boolean;
  onSelect: () => void;
  onCopy: () => void;
}

function SuggestionCard({
  suggestion,
  index,
  isCopied,
  onSelect,
  onCopy,
}: SuggestionCardProps) {
  const config = SUGGESTION_TYPE_CONFIG[suggestion.suggestion_type];
  const IconComponent = iconMap[suggestion.suggestion_type] || MessageSquare;
  const confidencePercent = Math.round(suggestion.confidence * 100);

  return (
    <div
      className={cn(
        'group relative p-3 rounded-lg border transition-all cursor-pointer',
        'bg-background/50 hover:bg-background',
        'border-border hover:border-purple-500/40',
        'hover:shadow-sm'
      )}
      onClick={onSelect}
    >
      {/* Atalho de teclado */}
      <div className="absolute -left-1.5 -top-1.5 flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold shadow-md ring-2 ring-background">
        {index + 1}
      </div>

      <div className="flex items-start gap-3 pl-3">
        {/* Ícone do tipo */}
        <div
          className={cn(
            'flex-shrink-0 p-1.5 rounded-md',
            'bg-primary/10 text-primary'
          )}
        >
          <IconComponent className="h-4 w-4" />
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-muted-foreground">
              {config.label}
            </span>
            <span
              className={cn(
                'text-xs px-1.5 py-0.5 rounded-full',
                confidencePercent >= 80
                  ? 'bg-green-500/10 text-green-600'
                  : confidencePercent >= 60
                    ? 'bg-yellow-500/10 text-yellow-600'
                    : 'bg-gray-500/10 text-gray-600'
              )}
            >
              {confidencePercent}%
            </span>
          </div>

          <p className="text-sm text-foreground line-clamp-2">
            {suggestion.content}
          </p>

          {/* Motivo (tooltip) */}
          {suggestion.reasoning && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="flex items-center gap-1 mt-1 text-xs text-muted-foreground hover:text-foreground">
                    <Info className="h-3 w-3" />
                    Por que essa sugestão?
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="text-xs">{suggestion.reasoning}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Botão copiar */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy();
                }}
              >
                {isCopied ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copiar</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

/**
 * Versão inline (para dentro do input)
 */
interface AISuggestionsInlineProps {
  suggestions: AISuggestion[];
  onSelect: (suggestion: AISuggestion) => void;
}

export function AISuggestionsInline({
  suggestions,
  onSelect,
}: AISuggestionsInlineProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
      {suggestions.slice(0, 3).map((suggestion, index) => {
        const IconComponent = iconMap[suggestion.suggestion_type] || MessageSquare;

        return (
          <TooltipProvider key={suggestion.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs',
                    'bg-primary/5 hover:bg-primary/10',
                    'text-primary-foreground font-medium',
                    'border border-primary/20 hover:border-primary/40',
                    'transition-all whitespace-nowrap'
                  )}
                  onClick={() => onSelect(suggestion)}
                >
                  <span className="font-bold">{index + 1}</span>
                  <IconComponent className="h-3 w-3" />
                  <span className="max-w-[100px] truncate">
                    {suggestion.content.slice(0, 30)}...
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-sm">{suggestion.content}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}

export default AISuggestionsPanel;
