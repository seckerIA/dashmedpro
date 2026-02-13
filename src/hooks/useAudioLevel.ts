// Hook para capturar nível de volume do microfone em tempo real
// Usa Web Audio API com AnalyserNode

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseAudioLevelOptions {
    fftSize?: number;
    smoothingTimeConstant?: number;
}

interface AudioLevelState {
    volume: number; // 0-1 normalizado
    isActive: boolean;
}

export function useAudioLevel(options: UseAudioLevelOptions = {}) {
    const { fftSize = 256, smoothingTimeConstant = 0.8 } = options;

    const [state, setState] = useState<AudioLevelState>({
        volume: 0,
        isActive: false,
    });

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);

    // Função para calcular o volume RMS (Root Mean Square)
    const calculateVolume = useCallback(() => {
        if (!analyserRef.current || !dataArrayRef.current) return;

        analyserRef.current.getByteTimeDomainData(dataArrayRef.current as any);

        let sum = 0;
        const data = dataArrayRef.current;

        for (let i = 0; i < data.length; i++) {
            const amplitude = (data[i] - 128) / 128; // Normalizar para -1 a 1
            sum += amplitude * amplitude;
        }

        const rms = Math.sqrt(sum / data.length);
        // Amplificar e limitar entre 0 e 1
        const volume = Math.min(1, rms * 3);

        setState(prev => ({
            ...prev,
            volume,
        }));

        // Continuar loop de animação
        animationFrameRef.current = requestAnimationFrame(calculateVolume);
    }, []);

    // Iniciar captura de áudio
    const startCapture = useCallback(async () => {
        try {
            // Obter stream do microfone
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // Criar contexto de áudio
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = audioContext;

            // Criar analyser node
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = fftSize;
            analyser.smoothingTimeConstant = smoothingTimeConstant;
            analyserRef.current = analyser;

            // Criar buffer para dados
            dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

            // Conectar microfone ao analyser
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            sourceRef.current = source;

            setState(prev => ({ ...prev, isActive: true }));

            // Iniciar loop de análise
            calculateVolume();
        } catch (error) {
            console.error('[useAudioLevel] Erro ao capturar áudio:', error);
        }
    }, [fftSize, smoothingTimeConstant, calculateVolume]);

    // Parar captura de áudio
    const stopCapture = useCallback(() => {
        // Parar animation frame
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        // Desconectar source
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }

        // Parar tracks do stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        // Fechar contexto de áudio
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        analyserRef.current = null;
        dataArrayRef.current = null;

        setState({ volume: 0, isActive: false });
    }, []);

    // Cleanup ao desmontar
    useEffect(() => {
        return () => {
            stopCapture();
        };
    }, [stopCapture]);

    return {
        ...state,
        startCapture,
        stopCapture,
    };
}
