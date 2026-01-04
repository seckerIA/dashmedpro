// CortanaOverlay - Modal centralizado com blur no fundo

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, Volume2, Loader2, RefreshCw, WifiOff, MessageSquare } from 'lucide-react';
import { useCortanaContext } from './CortanaProvider';
import { Button } from '@/components/ui/button';

export function CortanaOverlay() {
  const { state, showModal, stopConversation, startConversation, userContext } = useCortanaContext();
  const [showHistory, setShowHistory] = useState(false);

  if (!showModal) {
    return null;
  }

  const getStatusText = () => {
    if (!state.isConnected && state.status !== 'connecting') {
      return 'Desconectada';
    }
    switch (state.status) {
      case 'connecting':
        return 'Conectando...';
      case 'listening':
        return 'Ouvindo...';
      case 'speaking':
        return 'Cortana está falando...';
      case 'processing':
        return 'Processando...';
      case 'error':
        return 'Erro na conexão';
      default:
        return 'Conectada';
    }
  };

  const isDisconnected = !state.isConnected && state.status !== 'connecting';
  const hasHistory = state.transcript || state.lastResponse;

  return (
    <AnimatePresence>
      {/* Backdrop com blur - sem animação de bounce */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
      />

      {/* Modal centralizado - animação simples sem spring */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="pointer-events-auto w-[420px] max-w-[90vw] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          {/* Header com gradiente */}
          <div className={`flex items-center justify-between px-6 py-4 text-white ${
            isDisconnected
              ? 'bg-gradient-to-r from-gray-500 to-gray-600'
              : 'bg-gradient-to-r from-blue-500 to-purple-600'
          }`}>
            <div className="flex items-center gap-3">
              {/* Orb com ícone */}
              <div className="relative w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                {isDisconnected && <WifiOff className="w-5 h-5 text-white" />}
                {state.status === 'connecting' && <Loader2 className="w-5 h-5 text-white animate-spin" />}
                {state.status === 'listening' && <Mic className="w-5 h-5 text-white" />}
                {state.status === 'speaking' && <Volume2 className="w-5 h-5 text-white" />}
                {state.status === 'processing' && <Loader2 className="w-5 h-5 text-white animate-spin" />}
              </div>
              <div>
                <h3 className="font-semibold text-lg">Cortana</h3>
                <p className="text-sm text-white/80">{getStatusText()}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Botão de histórico - só aparece se tiver conteúdo */}
              {hasHistory && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-10 w-10 rounded-full ${
                    showHistory
                      ? 'bg-white/30 text-white'
                      : 'text-white hover:bg-white/20'
                  }`}
                  onClick={() => setShowHistory(!showHistory)}
                >
                  <MessageSquare className="w-5 h-5" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-white hover:bg-white/20 rounded-full"
                onClick={stopConversation}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Conteúdo com altura fixa */}
          <div className="p-6">
            {/* Saudação ao usuário */}
            {userContext && !isDisconnected && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
                Olá, <span className="font-medium text-gray-700 dark:text-gray-300">{userContext.userName}</span>! Como posso ajudar?
              </p>
            )}

            {/* Estado desconectado - Botão de reconectar */}
            {isDisconnected && (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <WifiOff className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  A conexão foi encerrada.
                </p>
                <Button
                  onClick={startConversation}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reconectar
                </Button>
              </div>
            )}

            {/* Visualizador de áudio - altura fixa para não causar bounce */}
            {!isDisconnected && (
              <div className="flex items-center justify-center gap-1.5 h-[80px]">
                {state.status === 'connecting' && (
                  <div className="flex items-center gap-2 text-purple-500">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-sm">Conectando ao ElevenLabs...</span>
                  </div>
                )}
                {state.status === 'listening' && (
                  <>
                    {[...Array(12)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-2 bg-gradient-to-t from-green-500 to-green-400 rounded-full"
                        animate={{
                          height: [16, 40 + Math.random() * 20, 16],
                        }}
                        transition={{
                          duration: 0.4 + Math.random() * 0.3,
                          repeat: Infinity,
                          delay: i * 0.05,
                          ease: 'easeInOut',
                        }}
                      />
                    ))}
                  </>
                )}
                {state.status === 'speaking' && (
                  <>
                    {[...Array(12)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-2 bg-gradient-to-t from-blue-500 to-purple-500 rounded-full"
                        animate={{
                          height: [16, 35 + Math.random() * 25, 16],
                        }}
                        transition={{
                          duration: 0.3 + Math.random() * 0.2,
                          repeat: Infinity,
                          delay: i * 0.04,
                          ease: 'easeInOut',
                        }}
                      />
                    ))}
                  </>
                )}
                {state.status === 'processing' && (
                  <div className="flex items-center gap-2 text-yellow-500">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-sm">Processando...</span>
                  </div>
                )}
                {state.status !== 'listening' && state.status !== 'speaking' && state.status !== 'processing' && state.status !== 'connecting' && (
                  <div className="flex items-center gap-1.5">
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-4 bg-gray-300 dark:bg-gray-600 rounded-full"
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Histórico de conversa - só aparece quando botão é clicado */}
            {showHistory && hasHistory && (
              <div className="mt-4 space-y-3 max-h-[200px] overflow-y-auto">
                {/* Transcrição do usuário */}
                {state.transcript && (
                  <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5 font-medium">
                      <Mic className="w-3 h-3" />
                      Você disse:
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      "{state.transcript}"
                    </p>
                  </div>
                )}

                {/* Resposta da Cortana */}
                {state.lastResponse && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                    <p className="text-xs text-blue-500 mb-1 flex items-center gap-1.5 font-medium">
                      <Volume2 className="w-3 h-3" />
                      Cortana:
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {state.lastResponse}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Dica de uso */}
            <p className="text-xs text-center text-gray-400 mt-4">
              Pressione <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-mono">Ctrl+Shift+C</kbd> ou clique no X para fechar
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
