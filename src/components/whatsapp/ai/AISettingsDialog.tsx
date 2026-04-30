import { useState, useEffect, useMemo, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Sparkles, Save, Info, Bot, ShieldCheck, User, Stethoscope, Film, Clock, MessageCircleReply, Upload, Video, Trash2 } from 'lucide-react';
import { useWhatsAppAI } from '@/hooks/useWhatsAppAI';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { TestimonialVideosManager } from './TestimonialVideosManager';
import type { AIConfig } from '@/types/whatsappAI';

interface AISettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    targetUserId?: string; // ID do médico dono da conversa
    /**
     * Quando passado, o toggle "Agente Autônomo" atua POR CONVERSA
     * (`whatsapp_conversations.ai_autonomous_mode`), permitindo ligar
     * a IA só nessa conversa mesmo com auto_reply_enabled global=false.
     * Sem conversationId o toggle atua no global (whatsapp_ai_config).
     */
    conversationId?: string;
}

export function AISettingsDialog({ open, onOpenChange, targetUserId, conversationId }: AISettingsDialogProps) {
    const preInvestmentInputRef = useRef<HTMLInputElement>(null);
    const [isUploadingPreInvestmentVideos, setIsUploadingPreInvestmentVideos] = useState(false);
    // Passa o targetUserId para garantir que estamos editando a config do médico correto
    const { aiConfig, updateAIConfig, isUpdatingConfig } = useWhatsAppAI({ targetUserId });
    const queryClient = useQueryClient();

    // Estado do override por conversa (ai_autonomous_mode)
    const { data: conversationAI } = useQuery({
        queryKey: ['whatsapp-conversation-ai', conversationId],
        queryFn: async () => {
            if (!conversationId) return null;
            const { data } = await (supabase as any)
                .from('whatsapp_conversations')
                .select('ai_autonomous_mode')
                .eq('id', conversationId)
                .single();
            return data as { ai_autonomous_mode: boolean | null } | null;
        },
        enabled: !!conversationId && open,
    });

    const [formData, setFormData] = useState({
        agent_name: '',
        clinic_name: '',
        specialist_name: '',
        agent_greeting: '',
        doctor_info: '',
        knowledge_base: '',
        pre_investment_videos: '',
        already_known_info: '',
        custom_prompt_instructions: '',
        /** Minutos (UI); persistido em segundos no banco */
        reply_delay_min_minutes: 2,
        reply_delay_max_minutes: 5,
        auto_reply_enabled: false,
        auto_scheduling_enabled: false,
        followup_enabled: false,
        followup_window_start_hour: 8,
        followup_window_end_hour: 21,
        followup_max_attempts: 3,
    });
    const [videosOpen, setVideosOpen] = useState(false);

    useEffect(() => {
        if (aiConfig) {
            setFormData({
                agent_name: aiConfig.agent_name || '',
                clinic_name: aiConfig.clinic_name || '',
                specialist_name: aiConfig.specialist_name || '',
                agent_greeting: aiConfig.agent_greeting || '',
                doctor_info: aiConfig.doctor_info || '',
                knowledge_base: aiConfig.knowledge_base || '',
                pre_investment_videos: aiConfig.pre_investment_videos || '',
                already_known_info: aiConfig.already_known_info || '',
                custom_prompt_instructions: aiConfig.custom_prompt_instructions || '',
                reply_delay_min_minutes: Math.max(
                    0,
                    Math.round((aiConfig.ai_reply_delay_min_seconds ?? 120) / 60)
                ),
                reply_delay_max_minutes: Math.max(
                    0,
                    Math.round((aiConfig.ai_reply_delay_max_seconds ?? 300) / 60)
                ),
                // Se estamos em modo per-conversa, o toggle reflete a conversa
                auto_reply_enabled: conversationId
                    ? (conversationAI?.ai_autonomous_mode ?? false)
                    : (aiConfig.auto_reply_enabled || false),
                auto_scheduling_enabled: aiConfig.auto_scheduling_enabled || false,
                followup_enabled: (aiConfig as any).followup_enabled || false,
                followup_window_start_hour: (aiConfig as any).followup_window_start_hour ?? 8,
                followup_window_end_hour: (aiConfig as any).followup_window_end_hour ?? 21,
                followup_max_attempts: (aiConfig as any).followup_max_attempts ?? 3,
            });
        }
    }, [aiConfig, conversationAI, conversationId]);

    const preInvestmentVideoUrls = useMemo(
        () =>
            formData.pre_investment_videos
                .split('\n')
                .map((line) => line.trim())
                .filter(Boolean),
        [formData.pre_investment_videos]
    );

    const handleUploadPreInvestmentVideos = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        setIsUploadingPreInvestmentVideos(true);
        try {
            const uploadedUrls: string[] = [];
            const ownerId = targetUserId || aiConfig?.user_id || 'current-user';

            for (const file of Array.from(files)) {
                if (!file.type.startsWith('video/')) {
                    throw new Error(`O arquivo "${file.name}" não é um vídeo válido.`);
                }

                const ext = file.name.split('.').pop() || 'mp4';
                const safeBaseName = file.name
                    .replace(/\.[^/.]+$/, '')
                    .replace(/[^a-zA-Z0-9_-]/g, '_')
                    .slice(0, 50);
                const filePath = `ai-pre-investment-videos/${ownerId}/${Date.now()}_${safeBaseName}.${ext}`;

                const { error: uploadError } = await supabase.storage
                    .from('whatsapp-media')
                    .upload(filePath, file, { contentType: file.type, upsert: false });

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage
                    .from('whatsapp-media')
                    .getPublicUrl(filePath);

                if (!publicUrlData?.publicUrl) {
                    throw new Error(`Falha ao gerar URL do vídeo "${file.name}".`);
                }

                uploadedUrls.push(publicUrlData.publicUrl);
            }

            if (uploadedUrls.length > 0) {
                const merged = Array.from(new Set([...preInvestmentVideoUrls, ...uploadedUrls]));
                setFormData((prev) => ({ ...prev, pre_investment_videos: merged.join('\n') }));
            }

            toast({
                title: 'Vídeos enviados',
                description: `${uploadedUrls.length} vídeo(s) pronto(s) para uso pela IA.`,
            });
        } catch (error: any) {
            toast({
                title: 'Erro no upload de vídeo',
                description: error?.message || 'Não foi possível enviar o vídeo.',
                variant: 'destructive',
            });
        } finally {
            setIsUploadingPreInvestmentVideos(false);
            if (preInvestmentInputRef.current) {
                preInvestmentInputRef.current.value = '';
            }
        }
    };

    const handleRemovePreInvestmentVideo = (urlToRemove: string) => {
        const updated = preInvestmentVideoUrls.filter((url) => url !== urlToRemove);
        setFormData((prev) => ({ ...prev, pre_investment_videos: updated.join('\n') }));
    };

    const buildAiConfigPayload = (): Partial<AIConfig> => {
        const minM = Number(formData.reply_delay_min_minutes);
        const maxM = Number(formData.reply_delay_max_minutes);
        let minSec = Math.round((Number.isFinite(minM) ? minM : 2) * 60);
        let maxSec = Math.round((Number.isFinite(maxM) ? maxM : 5) * 60);
        if (minSec < 0) minSec = 0;
        if (maxSec < 0) maxSec = 0;
        if (maxSec < minSec) {
            const t = minSec;
            minSec = maxSec;
            maxSec = t;
        }
        return {
            agent_name: formData.agent_name,
            clinic_name: formData.clinic_name,
            specialist_name: formData.specialist_name,
            agent_greeting: formData.agent_greeting,
            doctor_info: formData.doctor_info,
            knowledge_base: formData.knowledge_base,
            pre_investment_videos: formData.pre_investment_videos,
            already_known_info: formData.already_known_info,
            custom_prompt_instructions: formData.custom_prompt_instructions,
            auto_scheduling_enabled: formData.auto_scheduling_enabled,
            ai_reply_delay_min_seconds: minSec,
            ai_reply_delay_max_seconds: maxSec,
        };
    };

    const handleSave = async () => {
        // Se per-conversa: salvar toggle separadamente em whatsapp_conversations
        if (conversationId) {
            const { auto_reply_enabled } = formData;
            await updateAIConfig(buildAiConfigPayload());
            const { error: convErr } = await (supabase as any)
                .from('whatsapp_conversations')
                .update({ ai_autonomous_mode: auto_reply_enabled })
                .eq('id', conversationId);
            if (convErr) {
                toast({ title: 'Erro ao salvar IA da conversa', description: convErr.message, variant: 'destructive' });
            } else {
                queryClient.invalidateQueries({ queryKey: ['whatsapp-conversation-ai', conversationId] });
                queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
            }
        } else {
            await updateAIConfig({
                ...buildAiConfigPayload(),
                auto_reply_enabled: formData.auto_reply_enabled,
            });
        }
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Bot className="h-5 w-5 text-primary" />
                        </div>
                        <DialogTitle>Configuracoes do Agente de IA</DialogTitle>
                    </div>
                    <DialogDescription>
                        Configure a identidade e comportamento do seu agente de IA humanizado para WhatsApp.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Identidade do Agente */}
                    <div className="space-y-4 p-4 rounded-xl border border-primary/20 bg-primary/5">
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" />
                            <Label className="text-sm font-bold">Identidade do Agente</Label>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="agent_name" className="text-xs text-muted-foreground">Nome da IA</Label>
                                <Input
                                    id="agent_name"
                                    placeholder="Sofia"
                                    value={formData.agent_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, agent_name: e.target.value }))}
                                    className="h-9 text-sm bg-background"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="specialist_name" className="text-xs text-muted-foreground">Nome do Medico</Label>
                                <Input
                                    id="specialist_name"
                                    placeholder="Dr. Rafael"
                                    value={formData.specialist_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, specialist_name: e.target.value }))}
                                    className="h-9 text-sm bg-background"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="agent_greeting" className="text-xs text-muted-foreground">Saudacao personalizada (opcional)</Label>
                            <Textarea
                                id="agent_greeting"
                                placeholder="Ola! Sou a Sofia, assistente do Dr. Rafael. Como posso te ajudar?"
                                className="h-16 text-sm resize-none bg-background"
                                value={formData.agent_greeting}
                                onChange={(e) => setFormData(prev => ({ ...prev, agent_greeting: e.target.value }))}
                            />
                        </div>
                    </div>

                    {/* Informacoes do Medico */}
                    <div className="space-y-3 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
                        <div className="flex items-center gap-2">
                            <Stethoscope className="h-4 w-4 text-blue-500" />
                            <Label htmlFor="doctor_info" className="text-sm font-bold">Informacoes do Medico</Label>
                        </div>
                        <Textarea
                            id="doctor_info"
                            placeholder="Ex: Dr. Carlos Silva, Cirurgiao Plastico com 15 anos de experiencia. Especialista em rinoplastia e lipoaspiracao. Abordagem humanizada, foco em resultado natural. CRM 12345-SP."
                            className="min-h-[100px] text-sm resize-none bg-background"
                            value={formData.doctor_info}
                            onChange={(e) => setFormData(prev => ({ ...prev, doctor_info: e.target.value }))}
                        />
                        <p className="text-[11px] text-muted-foreground">
                            Bio, especialidade e abordagem do medico. A IA usara essas informacoes para responder sobre o profissional.
                        </p>
                    </div>

                    {/* Base de Conhecimento */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="knowledge_base" className="text-sm font-bold flex items-center gap-2">
                                Base de Conhecimento
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button
                                            type="button"
                                            className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                        >
                                            <Info className="h-3.5 w-3.5" />
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="max-w-[320px] p-4 bg-popover border-border shadow-2xl z-[100]" side="right" align="start">
                                        <div className="space-y-3">
                                            <p className="text-sm font-semibold text-primary">Como preencher corretamente?</p>
                                            <p className="text-xs leading-relaxed text-muted-foreground">
                                                Forneça detalhes que tornem o atendimento único. A IA usará isso para responder dúvidas sem perguntar a você.
                                            </p>
                                            <div className="p-3 bg-muted/40 rounded-lg border border-border/50 space-y-2">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-primary opacity-80">Exemplo de Prompt:</p>
                                                <p className="text-[11px] italic leading-relaxed text-foreground/90">
                                                    "Somos a Clínica MedPro, focada em Harmonização. O Dr. João tem 15 anos de prática. Atendemos de Seg-Sex 08h-18h. Nunca fale preços sem antes agendar uma avaliação inicial."
                                                </p>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </Label>
                        </div>
                        <Textarea
                            id="knowledge_base"
                            placeholder="Ex: Somos uma clínica especializada em harmonização facial. O Dr. João tem 15 anos de experiência. Aceitamos convênios Unimed e Bradesco..."
                            className="min-h-[120px] text-sm resize-none bg-muted/20 border-border/50 focus:border-primary/50"
                            value={formData.knowledge_base}
                            onChange={(e) => setFormData(prev => ({ ...prev, knowledge_base: e.target.value }))}
                        />
                        <p className="text-[11px] text-muted-foreground">
                            Dê contexto sobre sua clínica, médicos, horários e diferenciais. A IA usa este texto em toda resposta (junto com identidade e médico).
                        </p>
                    </div>

                    {/* Atraso humanizado */}
                    <div className="space-y-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                        <Label className="text-sm font-bold">Tempo antes de responder (humanizado)</Label>
                        <p className="text-[11px] text-muted-foreground">
                            Após uma mensagem do lead, a IA espera um intervalo aleatório entre esses limites antes de enviar a resposta (padrão 2 a 5 minutos). Em mensagens com palavras de emergência, responde sem esperar.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="reply_delay_min" className="text-xs text-muted-foreground">Mínimo (min)</Label>
                                <Input
                                    id="reply_delay_min"
                                    type="number"
                                    min={0}
                                    max={60}
                                    className="h-9 text-sm bg-background"
                                    value={formData.reply_delay_min_minutes}
                                    onChange={(e) => setFormData((prev) => ({
                                        ...prev,
                                        reply_delay_min_minutes: Number(e.target.value),
                                    }))}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="reply_delay_max" className="text-xs text-muted-foreground">Máximo (min)</Label>
                                <Input
                                    id="reply_delay_max"
                                    type="number"
                                    min={0}
                                    max={60}
                                    className="h-9 text-sm bg-background"
                                    value={formData.reply_delay_max_minutes}
                                    onChange={(e) => setFormData((prev) => ({
                                        ...prev,
                                        reply_delay_max_minutes: Number(e.target.value),
                                    }))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Videos antes de investimento */}
                    <div className="space-y-3 p-4 rounded-xl border border-violet-500/20 bg-violet-500/5">
                        <div className="flex items-center justify-between gap-2">
                            <Label className="text-sm font-bold">
                                Videos para enviar antes de falar de investimento
                            </Label>
                            <input
                                ref={preInvestmentInputRef}
                                type="file"
                                accept="video/*"
                                multiple
                                className="hidden"
                                onChange={(e) => handleUploadPreInvestmentVideos(e.target.files)}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1"
                                disabled={isUploadingPreInvestmentVideos}
                                onClick={() => preInvestmentInputRef.current?.click()}
                            >
                                <Upload className="h-3.5 w-3.5" />
                                {isUploadingPreInvestmentVideos ? 'Enviando...' : 'Upload de vídeo'}
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {preInvestmentVideoUrls.length === 0 ? (
                                <div className="text-xs text-muted-foreground border border-dashed rounded-md p-3 bg-background/60">
                                    Nenhum vídeo enviado ainda.
                                </div>
                            ) : (
                                preInvestmentVideoUrls.map((url, index) => (
                                    <div key={`${url}-${index}`} className="flex items-center justify-between gap-2 rounded-md border p-2 bg-background">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Video className="h-4 w-4 text-violet-500 shrink-0" />
                                            <span className="text-xs truncate">{url}</span>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 shrink-0"
                                            onClick={() => handleRemovePreInvestmentVideo(url)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            A IA envia esses vídeos primeiro para gerar valor antes de entrar no investimento da consulta.
                        </p>
                    </div>

                    {/* Informações que já sabemos */}
                    <div className="space-y-3">
                        <Label htmlFor="already_known_info" className="text-sm font-bold flex items-center gap-2">
                            Dados já conhecidos
                            <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                        </Label>
                        <Textarea
                            id="already_known_info"
                            placeholder="Ex: Telefone, Nome, Endereço da clínica (eles já sabem pois está no Maps)."
                            className="h-20 text-sm resize-none bg-muted/20 border-border/50 focus:border-primary/50"
                            value={formData.already_known_info}
                            onChange={(e) => setFormData(prev => ({ ...prev, already_known_info: e.target.value }))}
                        />
                        <p className="text-[11px] text-muted-foreground">
                            A IA evitará perguntar coisas que você listar aqui.
                        </p>
                    </div>

                    {/* Instruções Personalizadas */}
                    <div className="space-y-3">
                        <Label htmlFor="custom_prompt" className="text-sm font-bold flex items-center gap-2">
                            Instruções de Tom de Voz
                            <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                        </Label>
                        <Textarea
                            id="custom_prompt"
                            placeholder="Ex: Seja sempre muito direto. Não use muitos emojis. Sempre tente marcar para a mesma semana."
                            className="h-20 text-sm resize-none bg-muted/20 border-border/50 focus:border-primary/50"
                            value={formData.custom_prompt_instructions}
                            onChange={(e) => setFormData(prev => ({ ...prev, custom_prompt_instructions: e.target.value }))}
                        />
                    </div>

                    {/* Auto-Reply Switch */}
                    <div className={cn(
                        "p-4 rounded-xl border transition-all duration-200",
                        formData.auto_reply_enabled
                            ? "bg-emerald-500/10 border-emerald-500/20"
                            : "bg-muted/30 border-border"
                    )}>
                        <div className="flex items-center justify-between gap-4">
                            <div className="space-y-1">
                                <Label className="text-sm font-bold flex items-center gap-2">
                                    {conversationId ? 'Agente Autônomo (esta conversa)' : 'Agente Autônomo (global)'}
                                    {formData.auto_reply_enabled && (
                                        <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">
                                            ATIVO
                                        </span>
                                    )}
                                </Label>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {conversationId
                                        ? 'Liga a IA apenas nesta conversa, independente do toggle global. Ideal para testar ou atender contatos específicos com IA.'
                                        : 'O agente conversará diretamente com pacientes de forma humanizada, qualificando leads e direcionando para agendamento.'}
                                </p>
                            </div>
                            <Switch
                                checked={formData.auto_reply_enabled}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_reply_enabled: checked }))}
                                className="data-[state=checked]:bg-emerald-500"
                            />
                        </div>
                    </div>
                    {/* Vídeos de Depoimento */}
                    <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                        <div className="flex items-center justify-between gap-4">
                            <div className="space-y-1 min-w-0">
                                <Label className="text-sm font-bold flex items-center gap-2">
                                    <Film className="h-4 w-4 text-amber-500" />
                                    Vídeos de depoimento
                                </Label>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Até 3 vídeos curtos de pacientes — enviados automaticamente pelo agente após gerar valor e antes de falar de preço (ORDEM SAGRADA).
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setVideosOpen(true)}
                                className="flex-shrink-0"
                            >
                                Gerenciar
                            </Button>
                        </div>
                    </div>

                    <TestimonialVideosManager
                        open={videosOpen}
                        onOpenChange={setVideosOpen}
                        targetUserId={targetUserId}
                    />

                    {/* Follow-up Automatico (re-engajamento de leads frios) */}
                    <div className={cn(
                        "p-4 rounded-xl border transition-all duration-200",
                        formData.followup_enabled
                            ? "bg-blue-500/10 border-blue-500/20"
                            : "bg-muted/30 border-border"
                    )}>
                        <div className="flex items-center justify-between gap-4">
                            <div className="space-y-1 min-w-0">
                                <Label className="text-sm font-bold flex items-center gap-2">
                                    <MessageCircleReply className="h-4 w-4 text-blue-500" />
                                    Follow-up Automático
                                    {formData.followup_enabled && (
                                        <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full font-bold">
                                            ATIVO
                                        </span>
                                    )}
                                </Label>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Quando o paciente parar de responder, a IA volta sozinha em <b>3h</b>, <b>24h</b> e <b>72h</b> com mensagem contextual. No 3º silêncio, conversa é transferida automaticamente para humano.
                                </p>
                            </div>
                            <Switch
                                checked={formData.followup_enabled}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, followup_enabled: checked }))}
                                className="data-[state=checked]:bg-blue-500"
                                disabled={!formData.auto_reply_enabled}
                            />
                        </div>

                        {formData.followup_enabled && (
                            <div className="mt-4 grid grid-cols-3 gap-3 pt-4 border-t border-blue-500/20">
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        Início (BRT)
                                    </Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={23}
                                        value={formData.followup_window_start_hour}
                                        onChange={(e) => setFormData(prev => ({ ...prev, followup_window_start_hour: Math.max(0, Math.min(23, parseInt(e.target.value) || 0)) }))}
                                        className="h-8 text-sm bg-background"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        Fim (BRT)
                                    </Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={23}
                                        value={formData.followup_window_end_hour}
                                        onChange={(e) => setFormData(prev => ({ ...prev, followup_window_end_hour: Math.max(0, Math.min(23, parseInt(e.target.value) || 0)) }))}
                                        className="h-8 text-sm bg-background"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] text-muted-foreground">Máx. tentativas</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={5}
                                        value={formData.followup_max_attempts}
                                        onChange={(e) => setFormData(prev => ({ ...prev, followup_max_attempts: Math.max(1, Math.min(5, parseInt(e.target.value) || 3)) }))}
                                        className="h-8 text-sm bg-background"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Auto-Scheduling Switch */}
                    <div className={cn(
                        "p-4 rounded-xl border transition-all duration-200",
                        formData.auto_scheduling_enabled
                            ? "bg-purple-500/10 border-purple-500/20"
                            : "bg-muted/30 border-border"
                    )}>
                        <div className="flex items-center justify-between gap-4">
                            <div className="space-y-1">
                                <Label className="text-sm font-bold flex items-center gap-2">
                                    Agendamento Autônomo
                                    {formData.auto_scheduling_enabled && (
                                        <span className="text-[10px] bg-purple-500 text-white px-2 py-0.5 rounded-full font-bold">
                                            ATIVO
                                        </span>
                                    )}
                                </Label>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Permitir que a IA agende horários na sua agenda automaticamente quando o paciente confirmar.
                                    Requer "Auto-Resposta" ativada.
                                </p>
                            </div>
                            <Switch
                                checked={formData.auto_scheduling_enabled}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_scheduling_enabled: checked }))}
                                className="data-[state=checked]:bg-purple-500"
                                disabled={!formData.auto_reply_enabled}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isUpdatingConfig}
                        className="bg-primary hover:bg-primary/90 gap-2"
                    >
                        {isUpdatingConfig ? (
                            <span className="flex items-center gap-2">
                                <Save className="h-4 w-4 animate-spin" />
                                Salvando...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Save className="h-4 w-4" />
                                Salvar Configurações
                            </span>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
