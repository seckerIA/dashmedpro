import { useActiveCall } from '@/hooks/useActiveCall';
import { Button } from '@/components/ui/button';
import { PhoneOff, Mic, MicOff, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';

// Simple draggable logic could be added later, for now just fixed overlay or simple CSS drag
export function CallOverlay() {
    const { activeCall, endCall, toggleMute, answerCall, rejectCall } = useActiveCall();

    if (!activeCall) return null;

    const isIncoming = activeCall.direction === 'inbound' && activeCall.status === 'ringing';
    const isConnected = activeCall.status === 'in_progress';

    // Format duration
    const mins = Math.floor(activeCall.duration / 60);
    const secs = activeCall.duration % 60;
    const durationDisplay = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    return (
        <div className="fixed bottom-4 right-4 z-50 w-80 bg-background border rounded-lg shadow-xl overflow-hidden animate-in slide-in-from-bottom-5">
            {/* Header */}
            <div className={cn(
                "p-4 text-white flex justify-between items-center",
                isIncoming ? "bg-blue-600" : isConnected ? "bg-green-600" : "bg-slate-700"
            )}>
                <div>
                    <h3 className="font-semibold text-lg">
                        {activeCall.contactName || activeCall.phoneNumber}
                    </h3>
                    <p className="text-xs opacity-90">
                        {isIncoming ? "Chamada Recebida..." : isConnected ? "Em Chamada" : "Chamando..."}
                    </p>
                </div>
                {isConnected && (
                    <span className="font-mono text-sm">{durationDisplay}</span>
                )}
            </div>

            {/* Body / Controls */}
            <div className="p-6 bg-card flex flex-col items-center gap-6">

                {isIncoming ? (
                    <div className="flex gap-4 w-full justify-center">
                        <Button
                            onClick={rejectCall}
                            variant="destructive"
                            size="icon"
                            className="h-14 w-14 rounded-full"
                        >
                            <PhoneOff className="h-6 w-6" />
                        </Button>
                        <Button
                            onClick={answerCall}
                            className="bg-green-500 hover:bg-green-600 h-14 w-14 rounded-full"
                            size="icon"
                        >
                            <Phone className="h-6 w-6 animate-pulse" />
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="flex gap-4">
                            <Button
                                variant={activeCall.isMuted ? "destructive" : "secondary"}
                                size="icon"
                                className="h-12 w-12 rounded-full"
                                onClick={toggleMute}
                                disabled={!isConnected}
                            >
                                {activeCall.isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                            </Button>

                            {/* Add Keypad button later if needed */}
                        </div>

                        <Button
                            variant="destructive"
                            className="w-full rounded-full"
                            onClick={endCall}
                        >
                            <PhoneOff className="mr-2 h-4 w-4" />
                            Encerrar
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}
