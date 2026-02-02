import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUserProfile } from '@/hooks/useUserProfile';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export const PasswordChangePrompt = () => {
    const { profile, isLoading } = useUserProfile();
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoading && profile?.force_password_change) {
            setOpen(true);
        }
    }, [profile, isLoading]);

    const handleAccept = () => {
        setOpen(false);
        // Redireciona para configurações com a aba de segurança ativa
        navigate('/configuracoes?tab=security');
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[425px] border-primary/20 bg-gradient-to-b from-card to-card/95">
                <DialogHeader>
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <ShieldCheck className="w-6 h-6 text-primary" />
                    </div>
                    <DialogTitle className="text-center text-xl">Segurança da Conta</DialogTitle>
                    <DialogDescription className="text-center pt-2">
                        Identificamos que você ainda está usando uma senha temporária.
                        Gostaria de criar uma senha personalizada e mais segura agora?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex sm:justify-center gap-3 pt-4">
                    <Button variant="ghost" onClick={() => setOpen(false)} className="flex-1 sm:flex-none">
                        Agora não
                    </Button>
                    <Button onClick={handleAccept} className="flex-1 sm:flex-none bg-primary hover:bg-primary/90">
                        Sim, trocar agora
                        <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
