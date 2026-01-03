
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Sparkles, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';

export function VirtualAssistantButton() {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    // Se estiver no chat (WhatsApp), sobe o botão para não cobrir o input
    const isChatPage = location.pathname.includes('/whatsapp');

    return (
        <>
            <motion.button
                drag
                dragMomentum={false}
                dragElastic={0.02}
                dragConstraints={{
                    top: -window.innerHeight + 180,
                    bottom: 20,
                    left: -window.innerWidth + 100,
                    right: 20,
                }}
                onClick={() => setIsOpen(true)}
                className={cn(
                    "fixed right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg hover:shadow-xl bg-primary text-primary-foreground hover:bg-primary/90 cursor-grab active:cursor-grabbing group",
                    isChatPage ? "bottom-24" : "bottom-8"
                )}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping group-hover:hidden" />
                <Mic className="h-6 w-6 relative z-10" />
            </motion.button>

            {/* Modal Placeholder da Secretária */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md border-primary/10 bg-background/95 backdrop-blur-xl shadow-2xl">
                    <DialogHeader className="space-y-3 pb-4 border-b border-border/50">
                        <DialogTitle className="flex items-center justify-center gap-2 text-lg font-medium tracking-tight">
                            Secretária Virtual
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">Beta</span>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-col items-center justify-center py-6 space-y-8">
                        {/* AI Orb Animation */}
                        <div className="relative flex items-center justify-center">
                            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-50 animate-pulse" />
                            <motion.div
                                className="relative h-24 w-24 rounded-full bg-gradient-to-b from-primary to-primary/60 shadow-[0_0_40px_-5px_var(--primary)] backdrop-blur-sm flex items-center justify-center"
                                animate={{
                                    scale: [1, 1.05, 1],
                                    opacity: [0.9, 1, 0.9]
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            >
                                <Mic className="h-10 w-10 text-primary-foreground drop-shadow-md" />
                            </motion.div>
                        </div>

                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-semibold tracking-tight text-foreground">Como posso ajudar?</h3>
                            <p className="text-sm text-muted-foreground">Toque para falar ou escolha uma opção</p>
                        </div>

                        {/* Quick Actions */}
                        <div className="w-full grid grid-cols-2 gap-3 px-2">
                            <Button variant="outline" className="h-auto py-3 px-4 justify-start text-xs text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all">
                                📅 Ver minha agenda
                            </Button>
                            <Button variant="outline" className="h-auto py-3 px-4 justify-start text-xs text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all">
                                📊 Resumo de vendas
                            </Button>
                            <Button variant="outline" className="h-auto py-3 px-4 justify-start text-xs text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all">
                                👥 Cadastrar paciente
                            </Button>
                            <Button variant="outline" className="h-auto py-3 px-4 justify-start text-xs text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all">
                                ⚠️ Ver pendências
                            </Button>
                        </div>
                    </div>

                    <div className="flex justify-center pt-2">
                        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
                            ⌨️ Ou digite seu comando
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
