import React, { useEffect, useRef } from 'react';
import { useAudioLevel } from '@/hooks/useAudioLevel';
import { CortanaStatus } from '@/types/cortana';

interface NeuralVisualizerProps {
    status: CortanaStatus;
    isConnected: boolean;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    baseX: number;
    baseY: number;
    size: number;
    color: string;
}

export function NeuralVisualizer({ status, isConnected }: NeuralVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { volume, isActive, startCapture, stopCapture } = useAudioLevel();

    // Cores
    const primaryColor = '16, 185, 129'; // emerald-500 equivalent (RGB)
    const secondaryColor = '59, 130, 246'; // blue-500 equivalent (RGB)
    const idleColor = '156, 163, 175'; // gray-400 equivalent (RGB)

    const isListening = status === 'listening';
    const isSpeaking = status === 'speaking';
    const isProcessing = status === 'processing';
    const hasVoice = volume > 0.02;

    // Gerenciar captura de áudio
    useEffect(() => {
        if (isConnected && isListening) {
            startCapture();
        } else {
            stopCapture();
        }
    }, [isConnected, isListening, startCapture, stopCapture]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let particles: Particle[] = [];
        let animationFrameId: number;
        let time = 0;

        const resizeCanvas = () => {
            if (containerRef.current && canvas) {
                canvas.width = containerRef.current.clientWidth;
                canvas.height = containerRef.current.clientHeight;
                initParticles();
            }
        };

        const initParticles = () => {
            particles = [];
            const particleCount = 40; // Quantidade de nós
            const w = canvas.width;
            const h = canvas.height;

            for (let i = 0; i < particleCount; i++) {
                particles.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    baseX: Math.random() * w,
                    baseY: Math.random() * h,
                    size: Math.random() * 2 + 1,
                    color: isSpeaking ? secondaryColor : isListening ? primaryColor : idleColor,
                });
            }
        };

        const draw = () => {
            if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            time += 0.01;

            // Fator de intensidade baseado no volume
            // Se estiver ouvindo (microfone) ou falando (IA), usar volume/pulsos simulados
            let intensity = 0;
            if (isListening && hasVoice) {
                intensity = volume * 15; // Reage ao microfone
            } else if (isSpeaking) {
                intensity = Math.sin(time * 5) * 0.5 + 0.5; // Pulsação automática ao falar
            }

            // Atualizar e desenhar partículas
            particles.forEach((p, i) => {
                // Movimento orgânico
                p.x += p.vx + Math.sin(time + i) * 0.2;
                p.y += p.vy + Math.cos(time + i) * 0.2;

                // Limites da tela (bounce suave)
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

                // Expansão baseada no volume (efeito "explosão" suave do centro)
                const centerX = canvas.width / 2;
                const centerY = canvas.height / 2;
                const dx = p.x - centerX;
                const dy = p.y - centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Se houver intensidade, empurrar partículas levemente para fora ou vibrar
                if (intensity > 0.1) {
                    p.x += (dx / dist) * intensity * 0.5;
                    p.y += (dy / dist) * intensity * 0.5;
                }

                // Desenhar nó
                ctx.beginPath();
                const currentNodeColor = isSpeaking ? secondaryColor : isListening ? primaryColor : idleColor;
                ctx.fillStyle = `rgba(${currentNodeColor}, ${0.5 + intensity * 0.5})`;
                ctx.arc(p.x, p.y, p.size + intensity * 2, 0, Math.PI * 2);
                ctx.fill();

                // Conexões (sinapses)
                particles.forEach((p2, j) => {
                    if (i === j) return;
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 100) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(${currentNodeColor}, ${0.1 + intensity * 0.2 - distance / 1000})`;
                        ctx.lineWidth = 0.5 + intensity;
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                });
            });

            animationFrameId = requestAnimationFrame(draw);
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        draw();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, [isListening, isSpeaking, hasVoice, volume]);

    return (
        <div ref={containerRef} className="w-full h-[180px] overflow-hidden rounded-lg bg-black/5 dark:bg-black/20 backdrop-blur-sm">
            <canvas ref={canvasRef} className="w-full h-full" />
        </div>
    );
}
