import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bot, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQueryClient } from "@tanstack/react-query";
import { WHATSAPP_CONVERSATIONS_KEY } from "@/hooks/useWhatsAppConversations";

export interface AISettingsToggleProps {
  /**
   * Dono da config de IA (normalmente o `user_id` da conversa no WhatsApp = médico da instância).
   * Se omitido, usa o usuário logado.
   */
  configUserId?: string;
}

export function AISettingsToggle({ configUserId }: AISettingsToggleProps) {
    const [enabled, setEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const effectiveUserId = configUserId || user?.id;

    useEffect(() => {
        if (effectiveUserId) {
            fetchConfig();
        }
    }, [effectiveUserId]);

    const fetchConfig = async () => {
        if (!effectiveUserId) return;
        try {
            const { data, error } = await (supabase
                .from('whatsapp_ai_config' as any) as any)
                .select('auto_reply_enabled')
                .eq('user_id', effectiveUserId)
                .maybeSingle();

            if (error) throw error;
            if (data) {
                setEnabled(data.auto_reply_enabled || false);
            } else {
                setEnabled(false);
            }
        } catch (error) {
            console.error('Error fetching AI config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (checked: boolean) => {
        if (!effectiveUserId) return;

        setEnabled(checked); // Optimistic update

        try {
            const { error } = await (supabase
                .from('whatsapp_ai_config' as any) as any)
                .upsert({
                    user_id: effectiveUserId,
                    auto_reply_enabled: checked,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            if (error) throw error;

            // Paridade com toggle individual:
            // - ao ATIVAR: limpa overrides per-conversa (null = "siga global"), garantindo que
            //   a IA responda imediatamente na próxima inbound de qualquer conversa.
            // - ao DESATIVAR: também limpa overrides true persistentes para evitar resposta órfã
            //   por conversas com `ai_autonomous_mode=true` legado. Conversas que o usuário
            //   ATIVOU explicitamente via dialog individual continuam, pois o dialog grava
            //   `true` no momento exato — quem zera é apenas o toggle global.
            const { error: convErr } = await (supabase
                .from('whatsapp_conversations' as any) as any)
                .update({ ai_autonomous_mode: null })
                .eq('user_id', effectiveUserId);

            if (convErr) {
                console.warn('[AISettingsToggle] Could not reset ai_autonomous_mode on conversations:', convErr);
            }

            // Invalidar todas as queries relacionadas (paridade com salvar do dialog individual)
            queryClient.invalidateQueries({ queryKey: [WHATSAPP_CONVERSATIONS_KEY] });
            queryClient.invalidateQueries({ queryKey: ['whatsapp-ai-config', effectiveUserId] });
            queryClient.invalidateQueries({ queryKey: ['whatsapp-conversation-ai'] });

            toast.success(
                checked
                    ? "Auto-resposta ativada — IA responderá novas mensagens"
                    : "Auto-resposta desativada"
            );
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
                    <TooltipContent className="max-w-[240px]">
                        <p>
                            Quando ativo, o agente responde automaticamente às mensagens recebidas neste número.
                            Se você já respondeu manualmente por aqui, ao ligar de novo o sistema reabre a IA nas conversas deste médico.
                        </p>
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
