// MicrophoneVisualizer.tsx - Componente isolado para alta performance de animação
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Volume2, Loader2 } from 'lucide-react';
import { useAudioLevel } from '@/hooks/useAudioLevel';
import { CortanaStatus } from '@/types/cortana';

interface MicrophoneVisualizerProps {
    status: CortanaStatus;
    isConnected: boolean;
}

export function MicrophoneVisualizer({ status, isConnected }: MicrophoneVisualizerProps) {
    // Hook isolado aqui para re-renderizar APENAS este componente
    const { volume, isActive: isAudioActive, startCapture, stopCapture } = useAudioLevel();

    const isListening = status === 'listening';
    const isSpeaking = status === 'speaking';
    const isProcessing = status === 'processing';
    const isConnecting = status === 'connecting';

    // Gerenciar captura de áudio com base no status
    useEffect(() => {
        if (isConnected && isListening) {
            startCapture();
        } else {
            stopCapture();
        }
    }, [isConnected, isListening, startCapture, stopCapture]);

    const waveScale = isListening && isAudioActive ? 1 + (volume * 1.5) : 1;
    const hasVoice = volume > 0.05;

    // Cores basedas no status
    const getIconColor = () => {
        if (isListening && hasVoice) return 'text-green-600';
        if (isListening) return 'text-green-500';
        if (isSpeaking) return 'text-blue-500';
        if (isProcessing) return 'text-yellow-500';
        if (isConnecting) return 'text-purple-500';
        return 'text-gray-400';
    };

    const getWaveColor = () => {
        if (isListening) return 'bg-green-400';
        if (isSpeaking) return 'bg-blue-400';
        return 'bg-gray-300';
    };

    return (
        <div className="relative flex items-center justify-center h-[120px]">
            <AnimatePresence>
                {isListening && (
                    <>
                        <motion.span
                            key="wave-1"
                            className={`absolute w-16 h-16 rounded-full ${getWaveColor()}`}
                            animate={{
                                scale: waveScale,
                                opacity: hasVoice ? 0.6 : 0.2
                            }}
                            // Usar spring para suavizar movimentos bruscos do volume
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        />
                        <motion.span
                            key="wave-2"
                            className={`absolute w-16 h-16 rounded-full ${getWaveColor()}`}
                            animate={{
                                scale: 1 + (volume * 1.8),
                                opacity: hasVoice ? 0.4 : 0.1
                            }}
                            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.05 }}
                        />
                        <motion.span
                            key="wave-3"
                            className={`absolute w-16 h-16 rounded-full ${getWaveColor()}`}
                            animate={{
                                scale: 1 + (volume * 2.2),
                                opacity: hasVoice ? 0.2 : 0
                            }}
                            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
                        />
                    </>
                )}

                {isSpeaking && (
                    <>
                        <motion.span
                            key="speak-1"
                            className={`absolute w-16 h-16 rounded-full ${getWaveColor()} opacity-60`}
                            initial={{ scale: 1, opacity: 0.6 }}
                            animate={{ scale: 2, opacity: 0 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'easeOut' }}
                        />
                        <motion.span
                            key="speak-2"
                            className={`absolute w-16 h-16 rounded-full ${getWaveColor()} opacity-60`}
                            initial={{ scale: 1, opacity: 0.6 }}
                            animate={{ scale: 2, opacity: 0 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'easeOut', delay: 0.33 }}
                        />
                    </>
                )}
            </AnimatePresence>

            <motion.div
                className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-300 ${isListening ? 'bg-green-100 dark:bg-green-900/30' :
                        isSpeaking ? 'bg-blue-100 dark:bg-blue-900/30' :
                            'bg-gray-100 dark:bg-gray-800'
                    }`}
                animate={{
                    scale: isListening && hasVoice ? 1 + (volume * 0.15) : (isSpeaking ? [1, 1.05, 1] : 1)
                }}
                transition={isSpeaking ? { duration: 0.5, repeat: Infinity } : { type: "spring", stiffness: 300, damping: 15 }}
            >
                {isConnecting ? (
                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                ) : isProcessing ? (
                    <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
                ) : isSpeaking ? (
                    <Volume2 className={`w-8 h-8 ${getIconColor()}`} />
                ) : (
                    <Mic className={`w-8 h-8 ${getIconColor()}`} />
                )}
            </motion.div>
        </div>
    );
}
