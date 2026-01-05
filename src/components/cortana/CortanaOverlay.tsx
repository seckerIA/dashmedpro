// CortanaOverlay - Modal centralizado com blur no fundo

import React, { useState, useRef, useEffect } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, Volume2, Loader2, RefreshCw, WifiOff, MessageSquare, Send, Keyboard } from 'lucide-react';
import { useCortanaContext } from './CortanaProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MicrophoneVisualizer } from './MicrophoneVisualizer';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function CortanaOverlay() {
  const { state, showModal, stopConversation, startConversation, userContext } = useCortanaContext();
  const [chatMode, setChatMode] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hook de áudio movido para MicrophoneVisualizer.tsx para otimização de performance

  // Auto-scroll para última mensagem no chat
  useEffect(() => {
    if (chatMode && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, chatMode]);

  // Foca no input ao entrar no modo chat
  useEffect(() => {
    if (chatMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [chatMode]);

  // Atualiza histórico com transcrição de voz
  useEffect(() => {
    if (state.transcript && !chatMode) {
      setChatHistory(prev => {
        const lastUserMsg = prev.findIndex(m => m.role === 'user' && m.content === state.transcript);
        if (lastUserMsg === -1) {
          return [...prev, { role: 'user', content: state.transcript, timestamp: new Date() }];
        }
        return prev;
      });
    }
  }, [state.transcript, chatMode]);

  useEffect(() => {
    if (state.lastResponse) {
      setChatHistory(prev => {
        const lastAssistantMsg = prev.findIndex(m => m.role === 'assistant' && m.content === state.lastResponse);
        if (lastAssistantMsg === -1) {
          return [...prev, { role: 'assistant', content: state.lastResponse, timestamp: new Date() }];
        }
        return prev;
      });
    }
  }, [state.lastResponse]);

  if (!showModal) {
    return null;
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date() }]);

    // TODO: Processar comando de texto via clientTools
    // Por enquanto, apenas adiciona uma resposta placeholder
    setTimeout(() => {
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: 'Recebi sua mensagem. O processamento de comandos por texto será implementado em breve.',
        timestamp: new Date()
      }]);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getStatusText = () => {
    if (chatMode) return 'Chat ativo';
    if (!state.isConnected && state.status !== 'connecting') {
      return 'Desconectada';
    }
    switch (state.status) {
      case 'connecting':
        return 'Conectando...';
      case 'listening':
        return 'Ouvindo...';
      case 'speaking':
        return 'Falando...';
      case 'processing':
        return 'Processando...';
      case 'error':
        return 'Erro na conexão';
      default:
        return 'Conectada';
    }
  };

  const isDisconnected = !state.isConnected && state.status !== 'connecting';

  return (
    <AnimatePresence>
      {/* Backdrop com blur */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
      />

      {/* Modal centralizado */}
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
          <div className={`flex items - center justify - between px - 6 py - 4 text - white ${chatMode
            ? 'bg-gradient-to-r from-indigo-500 to-purple-600'
            : isDisconnected
              ? 'bg-gradient-to-r from-gray-500 to-gray-600'
              : 'bg-gradient-to-r from-blue-500 to-purple-600'
            } `}>
            <div className="flex items-center gap-3">
              {/* Orb com ícone */}
              <div className="relative w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                {chatMode && <Keyboard className="w-5 h-5 text-white" />}
                {!chatMode && isDisconnected && <WifiOff className="w-5 h-5 text-white" />}
                {!chatMode && state.status === 'connecting' && <Loader2 className="w-5 h-5 text-white animate-spin" />}
                {!chatMode && state.status === 'listening' && <Mic className="w-5 h-5 text-white" />}
                {!chatMode && state.status === 'speaking' && <Volume2 className="w-5 h-5 text-white" />}
                {!chatMode && state.status === 'processing' && <Loader2 className="w-5 h-5 text-white animate-spin" />}
                {!chatMode && !isDisconnected && state.status === 'idle' && <Mic className="w-5 h-5 text-white" />}
              </div>
              <div>
                <h3 className="font-semibold text-lg">Cortana</h3>
                <p className="text-sm text-white/80">{getStatusText()}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Botão para alternar entre voz e chat */}
              <Button
                variant="ghost"
                size="icon"
                className={`h - 10 w - 10 rounded - full ${chatMode ? 'bg-white/30 text-white' : 'text-white hover:bg-white/20'
                  } `}
                onClick={() => setChatMode(!chatMode)}
                title={chatMode ? 'Modo voz' : 'Modo chat'}
              >
                {chatMode ? <Mic className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
              </Button>

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

          {/* Conteúdo */}
          <div className="p-6">
            {/* Saudação ao usuário */}
            {userContext && !isDisconnected && !chatMode && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
                Olá, <span className="font-medium text-gray-700 dark:text-gray-300">{userContext.userName}</span>! Como posso ajudar?
              </p>
            )}

            {/* Estado desconectado - Botão de reconectar */}
            {isDisconnected && !chatMode && (
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

            {/* Modo Voz: Visualizador de microfone com ondas - COMPONENTE OTIMIZADO */}
            {/* Visualização de Rede Neural */}
            {!isDisconnected && !chatMode && (
              <MicrophoneVisualizer
                status={state.status}
                isConnected={state.isConnected}
              />
            )}

            {/* Modo Chat */}
            {chatMode && (
              <div className="flex flex-col h-[280px]">
                {/* Histórico de mensagens */}
                <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                  {chatHistory.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-8">
                      Digite uma mensagem para começar...
                    </p>
                  )}
                  {chatHistory.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p - 3 rounded - xl text - sm ${msg.role === 'user'
                        ? 'bg-blue-100 dark:bg-blue-900/30 ml-8'
                        : 'bg-gray-100 dark:bg-gray-800 mr-8'
                        } `}
                    >
                      <p className={`text - xs mb - 1 font - medium ${msg.role === 'user' ? 'text-blue-600' : 'text-gray-500'
                        } `}>
                        {msg.role === 'user' ? 'Você' : 'Cortana'}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">{msg.content}</p>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Input de chat */}
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Digite sua mensagem..."
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim()}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Dica de uso */}
            {!chatMode && (
              <p className="text-xs text-center text-gray-400 mt-4">
                Pressione <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-mono">Ctrl+Shift+C</kbd> ou clique no X para fechar
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

