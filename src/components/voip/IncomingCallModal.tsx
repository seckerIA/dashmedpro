import { useActiveCall } from '@/hooks/useActiveCall';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export function IncomingCallModal() {
    const { activeCall, answerCall, rejectCall } = useActiveCall();

    const isRinging = activeCall?.status === 'ringing' && activeCall?.direction === 'inbound';

    return (
        <Dialog open={isRinging} onOpenChange={(open) => { if (!open) rejectCall(); }}>
            <DialogContent className="sm:max-w-md bg-gradient-to-br from-slate-900 to-slate-800 border-none text-white shadow-2xl">
                <DialogHeader className="items-center text-center space-y-4 pt-4">
                    <div className="mx-auto rounded-full bg-blue-500/20 p-4 animate-pulse">
                        <Phone className="h-10 w-10 text-blue-400" />
                    </div>
                    <DialogTitle className="text-2xl font-light tracking-wide">
                        Chamada Recebida
                    </DialogTitle>
                    <DialogDescription className="text-slate-300 text-lg">
                        {activeCall?.contactName || activeCall?.phoneNumber} esta ligando...
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="flex justify-center gap-6 pb-6 mt-6 sm:justify-center">
                    <div className="flex flex-col items-center gap-2">
                        <Button
                            onClick={rejectCall}
                            variant="destructive"
                            size="icon"
                            className="h-16 w-16 rounded-full shadow-lg hover:bg-red-600 transition-all hover:scale-110"
                        >
                            <PhoneOff className="h-8 w-8" />
                        </Button>
                        <span className="text-xs text-slate-400">Recusar</span>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                        <Button
                            onClick={answerCall}
                            className="bg-green-500 hover:bg-green-600 h-16 w-16 rounded-full shadow-lg transition-all hover:scale-110 animate-bounce"
                            size="icon"
                        >
                            <Phone className="h-8 w-8 text-white" />
                        </Button>
                        <span className="text-xs text-slate-400">Atender</span>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
