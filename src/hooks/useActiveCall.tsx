/**
 * Hook for managing active VOIP calls
 * Uses a shared Context so only one Realtime subscription is created
 * @module hooks/useActiveCall
 */

import { useState, useEffect, useCallback, useRef, createContext, useContext, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useVOIPConfig } from './useVOIPConfig';
import { toast } from '@/components/ui/use-toast';
import type {
    ActiveCallState,
    VOIPCallStatus,
    VOIPProvider,
    WhatsAppCallInitResponse
} from '@/types/voip';

interface ActiveCallContextValue {
    deviceState: 'offline' | 'connecting' | 'ready' | 'error';
    activeCall: ActiveCallState | null;
    makeCall: (phoneNumber: string, contactId?: string, conversationId?: string, contactName?: string) => Promise<void>;
    endCall: () => Promise<void>;
    answerCall: () => Promise<void>;
    rejectCall: () => Promise<void>;
    toggleMute: () => void;
    toggleHold: () => Promise<void>;
}

const ActiveCallContext = createContext<ActiveCallContextValue | null>(null);

export function ActiveCallProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const { config, isReady: isConfigReady } = useVOIPConfig();
    const queryClient = useQueryClient();

    // State
    const [activeCall, setActiveCall] = useState<ActiveCallState | null>(null);
    const [deviceState, setDeviceState] = useState<'offline' | 'connecting' | 'ready' | 'error'>('offline');

    // Audio elements for local playback
    const localAudioRef = useRef<HTMLAudioElement | null>(null);
    const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

    // WebRTC peer connection (for SIP/Twilio bridge)
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

    // Initialize device state based on config
    useEffect(() => {
        if (isConfigReady && config?.is_active) {
            setDeviceState('ready');
        } else if (config && !config.is_active) {
            setDeviceState('offline');
        }
    }, [isConfigReady, config]);

    // Subscribe to realtime updates for call sessions (single subscription)
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    useEffect(() => {
        if (!user?.id) return;

        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }

        const channel = supabase
            .channel(`voip_call_updates:${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'voip_call_sessions',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    console.log('[useActiveCall] Realtime update:', payload);

                    if (payload.eventType === 'INSERT') {
                        const newCall = payload.new as any;
                        if (newCall.direction === 'inbound' && newCall.status === 'ringing') {
                            setActiveCall({
                                sessionId: newCall.id,
                                callSid: newCall.twilio_call_sid,
                                whatsappCallId: newCall.whatsapp_call_id,
                                provider: newCall.provider || 'whatsapp',
                                status: newCall.status,
                                direction: newCall.direction,
                                phoneNumber: newCall.from_number,
                                contactName: newCall.contact_name,
                                contactId: newCall.contact_id,
                                conversationId: newCall.conversation_id,
                                startedAt: new Date(newCall.initiated_at),
                                answeredAt: null,
                                isMuted: false,
                                isOnHold: false,
                                isRecording: false,
                                duration: 0,
                            });
                        }
                    }

                    if (payload.eventType === 'UPDATE') {
                        const updatedCall = payload.new as any;
                        setActiveCall((prev) => {
                            if (!prev || prev.sessionId !== updatedCall.id) return prev;

                            if (['completed', 'failed', 'cancelled', 'no_answer', 'busy'].includes(updatedCall.status)) {
                                return null;
                            }

                            return {
                                ...prev,
                                status: updatedCall.status,
                                answeredAt: updatedCall.answered_at ? new Date(updatedCall.answered_at) : prev.answeredAt,
                                duration: updatedCall.duration_seconds || prev.duration,
                            };
                        });
                    }
                }
            )
            .subscribe();

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
            channelRef.current = null;
        };
    }, [user?.id]);

    // Duration Timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (activeCall && activeCall.status === 'in_progress') {
            interval = setInterval(() => {
                setActiveCall((prev) => {
                    if (!prev) return null;
                    const startTime = prev.answeredAt || prev.startedAt;
                    return {
                        ...prev,
                        duration: Math.floor((Date.now() - startTime.getTime()) / 1000),
                    };
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [activeCall?.status]);

    // ========================================
    // ACTIONS
    // ========================================

    const makeCall = useCallback(async (
        phoneNumber: string,
        contactId?: string,
        conversationId?: string,
        contactName?: string
    ) => {
        if (!user?.id) {
            toast({ title: 'Erro', description: 'Você precisa estar logado.', variant: 'destructive' });
            return;
        }

        if (deviceState !== 'ready') {
            toast({ title: 'Erro', description: 'Serviço de voz não está pronto.', variant: 'destructive' });
            return;
        }

        try {
            console.log('[useActiveCall] Initiating call to:', phoneNumber);

            const tempSessionId = 'temp-' + Date.now();
            setActiveCall({
                sessionId: tempSessionId,
                callSid: null,
                whatsappCallId: null,
                provider: config?.default_provider || 'whatsapp',
                status: 'initiating',
                direction: 'outbound',
                phoneNumber,
                contactName: contactName || null,
                contactId: contactId || null,
                conversationId: conversationId || null,
                startedAt: new Date(),
                answeredAt: null,
                isMuted: false,
                isOnHold: false,
                isRecording: config?.recording_enabled || false,
                duration: 0,
            });

            const { data, error } = await supabase.functions.invoke<WhatsAppCallInitResponse>('whatsapp-voice-call', {
                body: {
                    to_number: phoneNumber,
                    contact_id: contactId,
                    conversation_id: conversationId,
                    contact_name: contactName,
                },
            });

            if (error || !data?.success) {
                throw new Error(data?.error || error?.message || 'Falha ao iniciar chamada');
            }

            setActiveCall((prev) => prev ? ({
                ...prev,
                sessionId: data.session_id || prev.sessionId,
                whatsappCallId: data.call_id || null,
                status: 'ringing',
            }) : null);

            toast({ title: 'Chamando...', description: `Ligando para ${contactName || phoneNumber}` });

        } catch (error: any) {
            console.error('[useActiveCall] Make call error:', error);
            toast({
                title: 'Erro ao ligar',
                description: error.message,
                variant: 'destructive',
            });
            setActiveCall(null);
        }
    }, [user?.id, deviceState, config]);

    const endCall = useCallback(async () => {
        if (!activeCall) return;

        try {
            await supabase
                .from('voip_call_sessions' as any)
                .update({
                    status: 'completed',
                    ended_at: new Date().toISOString(),
                    duration_seconds: activeCall.duration,
                })
                .eq('id', activeCall.sessionId);

            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
                peerConnectionRef.current = null;
            }

            setActiveCall(null);
            toast({ title: 'Chamada encerrada' });

        } catch (error: any) {
            console.error('[useActiveCall] End call error:', error);
        }
    }, [activeCall]);

    const answerCall = useCallback(async () => {
        if (!activeCall || activeCall.direction !== 'inbound') return;

        try {
            await supabase
                .from('voip_call_sessions' as any)
                .update({
                    status: 'in_progress',
                    answered_at: new Date().toISOString(),
                })
                .eq('id', activeCall.sessionId);

            setActiveCall((prev) => prev ? ({
                ...prev,
                status: 'in_progress',
                answeredAt: new Date(),
            }) : null);

        } catch (error: any) {
            console.error('[useActiveCall] Answer call error:', error);
            toast({ title: 'Erro', description: 'Falha ao atender', variant: 'destructive' });
        }
    }, [activeCall]);

    const rejectCall = useCallback(async () => {
        if (!activeCall || activeCall.direction !== 'inbound') return;

        try {
            await supabase
                .from('voip_call_sessions' as any)
                .update({
                    status: 'cancelled',
                    ended_at: new Date().toISOString(),
                })
                .eq('id', activeCall.sessionId);

            setActiveCall(null);

        } catch (error: any) {
            console.error('[useActiveCall] Reject call error:', error);
        }
    }, [activeCall]);

    const toggleMute = useCallback(() => {
        setActiveCall((prev) => {
            if (!prev) return null;
            return { ...prev, isMuted: !prev.isMuted };
        });
    }, []);

    const toggleHold = useCallback(async () => {
        if (!activeCall) return;

        const newStatus = activeCall.isOnHold ? 'in_progress' : 'on_hold';

        await supabase
            .from('voip_call_sessions' as any)
            .update({ status: newStatus })
            .eq('id', activeCall.sessionId);

        setActiveCall((prev) => prev ? ({
            ...prev,
            isOnHold: !prev.isOnHold,
            status: newStatus as VOIPCallStatus,
        }) : null);
    }, [activeCall]);

    const value: ActiveCallContextValue = {
        deviceState,
        activeCall,
        makeCall,
        endCall,
        answerCall,
        rejectCall,
        toggleMute,
        toggleHold,
    };

    return (
        <ActiveCallContext.Provider value={value}>
            {children}
        </ActiveCallContext.Provider>
    );
}

export function useActiveCall(): ActiveCallContextValue {
    const ctx = useContext(ActiveCallContext);
    if (!ctx) {
        // Return no-op defaults when used outside provider (e.g. during SSR or tests)
        return {
            deviceState: 'offline',
            activeCall: null,
            makeCall: async () => {},
            endCall: async () => {},
            answerCall: async () => {},
            rejectCall: async () => {},
            toggleMute: () => {},
            toggleHold: async () => {},
        };
    }
    return ctx;
}
