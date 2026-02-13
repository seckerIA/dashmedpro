import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bot, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function AISettingsToggle() {
    const [enabled, setEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        if (user?.id) {
            fetchConfig();
        }
    }, [user?.id]);

    const fetchConfig = async () => {
        try {
            const { data, error } = await (supabase
                .from('whatsapp_ai_config' as any) as any)
                .select('auto_reply_enabled')
                .eq('user_id', user!.id)
                .maybeSingle();

            if (error) throw error;
            if (data) {
                setEnabled(data.auto_reply_enabled || false);
            }
        } catch (error) {
            console.error('Error fetching AI config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (checked: boolean) => {
        if (!user?.id) return;

        setEnabled(checked); // Optimistic update

        try {
            const { error } = await (supabase
                .from('whatsapp_ai_config' as any) as any)
                .upsert({
                    user_id: user.id,
                    auto_reply_enabled: checked,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            if (error) throw error;

            toast.success(checked ? "Auto-resposta ativada" : "Auto-resposta desativada");
        } catch (error) {
            console.error('Error updating AI config:', error);
            toast.error("Erro ao atualizar configuração");
            setEnabled(!checked); // Revert on error
        }
    };

    if (loading) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;

    return (
        <div className="flex items-center gap-2 px-4 py-2 bg-card border rounded-lg shadow-sm">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 cursor-help">
                            <Bot className={`h-4 w-4 ${enabled ? 'text-primary' : 'text-muted-foreground'}`} />
                            <Label htmlFor="ai-toggle" className="text-sm font-medium cursor-pointer">
                                Auto-Resposta
                            </Label>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[200px]">
                        <p>Quando ativo, a IA responderá automaticamente se tiver 85% de certeza.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <Switch
                id="ai-toggle"
                checked={enabled}
                onCheckedChange={handleToggle}
            />
        </div>
    );
}
