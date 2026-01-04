// CortanaButton - Botão flutuante para ativar a Cortana

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Loader2, Volume2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCortanaContext } from './CortanaProvider';
import { CortanaStatus } from '@/types/cortana';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CortanaButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export function CortanaButton({
  className,
  size = 'lg',
  showTooltip = true,
}: CortanaButtonProps) {
  const { state, isConfigured, startConversation, stopConversation } = useCortanaContext();

  const handleClick = () => {
    if (state.isConnected) {
      stopConversation();
    } else {
      startConversation();
    }
  };

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-14 h-14',
  };

  const iconSize = {
    sm: 18,
    md: 22,
    lg: 26,
  };

  const getStatusIcon = () => {
    switch (state.status) {
      case 'connecting':
        return <Loader2 size={iconSize[size]} className="animate-spin" />;
      case 'listening':
        return <Mic size={iconSize[size]} />;
      case 'processing':
        return <Loader2 size={iconSize[size]} className="animate-spin" />;
      case 'speaking':
        return <Volume2 size={iconSize[size]} />;
      case 'error':
        return <AlertCircle size={iconSize[size]} />;
      default:
        return state.isMuted ? <MicOff size={iconSize[size]} /> : <Mic size={iconSize[size]} />;
    }
  };

  const getStatusColor = (): string => {
    switch (state.status) {
      case 'listening':
        return 'bg-green-500 hover:bg-green-600';
      case 'speaking':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'processing':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'connecting':
        return 'bg-purple-500 hover:bg-purple-600';
      case 'error':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700';
    }
  };

  const getTooltipText = (): string => {
    if (!isConfigured) {
      return 'Cortana não configurada';
    }

    switch (state.status) {
      case 'connecting':
        return 'Conectando...';
      case 'listening':
        return 'Cortana está ouvindo (clique para parar)';
      case 'speaking':
        return 'Cortana está falando';
      case 'processing':
        return 'Processando...';
      case 'error':
        return state.error || 'Erro na conexão';
      default:
        return 'Clique para ativar a Cortana (Ctrl+Shift+C)';
    }
  };

  const button = (
    <motion.button
      onClick={handleClick}
      disabled={!isConfigured || state.status === 'connecting'}
      className={cn(
        'fixed bottom-6 right-6 z-50',
        'rounded-full shadow-lg',
        'flex items-center justify-center',
        'text-white font-medium',
        'transition-all duration-200',
        'focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizeClasses[size],
        getStatusColor(),
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {/* Animação de ondas quando está ouvindo */}
      <AnimatePresence>
        {state.status === 'listening' && (
          <>
            <motion.span
              className="absolute inset-0 rounded-full bg-green-400 opacity-75"
              initial={{ scale: 1 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.span
              className="absolute inset-0 rounded-full bg-green-400 opacity-75"
              initial={{ scale: 1 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Animação de pulso quando está falando */}
      <AnimatePresence>
        {state.status === 'speaking' && (
          <motion.span
            className="absolute inset-0 rounded-full bg-blue-400"
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        )}
      </AnimatePresence>

      {/* Ícone */}
      <span className="relative z-10">
        {getStatusIcon()}
      </span>
    </motion.button>
  );

  if (!showTooltip) {
    return button;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {button}
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs">
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Exportar componente compacto para uso no header
export function CortanaButtonCompact({ className }: { className?: string }) {
  return <CortanaButton size="sm" className={className} />;
}
