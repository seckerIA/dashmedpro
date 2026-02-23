import { useState, useEffect } from 'react';
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
import { Sparkles, Save, Info, Bot, ShieldCheck, User, Stethoscope } from 'lucide-react';
import { useWhatsAppAI } from '@/hooks/useWhatsAppAI';
import { cn } from '@/lib/utils';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

interface AISettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    targetUserId?: string; // ID do médico dono da conversa
}

export function AISettingsDialog({ open, onOpenChange, targetUserId }: AISettingsDialogProps) {
    // Passa o targetUserId para garantir que estamos editando a config do médico correto
    const { aiConfig, updateAIConfig, isUpdatingConfig, isLoadingConfig } = useWhatsAppAI({ targetUserId });

    const [formData, setFormData] = useState({
        agent_name: '',
        clinic_name: '',
        specialist_name: '',
        agent_greeting: '',
        doctor_info: '',
        knowledge_base: '',
        already_known_info: '',
        custom_prompt_instructions: '',
        auto_reply_enabled: false,
        auto_scheduling_enabled: false,
    });

    useEffect(() => {
        if (aiConfig) {
            setFormData({
                agent_name: aiConfig.agent_name || '',
                clinic_name: aiConfig.clinic_name || '',
                specialist_name: aiConfig.specialist_name || '',
                agent_greeting: aiConfig.agent_greeting || '',
                doctor_info: aiConfig.doctor_info || '',
                knowledge_base: aiConfig.knowledge_base || '',
                already_known_info: aiConfig.already_known_info || '',
                custom_prompt_instructions: aiConfig.custom_prompt_instructions || '',
                auto_reply_enabled: aiConfig.auto_reply_enabled || false,
                auto_scheduling_enabled: aiConfig.auto_scheduling_enabled || false,
            });
        }
    }, [aiConfig]);

    const handleSave = async () => {
        await updateAIConfig(formData);
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
                            Dê contexto sobre sua clínica, médicos, horários e diferenciais.
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
                                    Agente Autonomo
                                    {formData.auto_reply_enabled && (
                                        <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">
                                            ATIVO
                                        </span>
                                    )}
                                </Label>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    O agente conversara diretamente com pacientes de forma humanizada,
                                    qualificando leads e direcionando para agendamento.
                                </p>
                            </div>
                            <Switch
                                checked={formData.auto_reply_enabled}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_reply_enabled: checked }))}
                                className="data-[state=checked]:bg-emerald-500"
                            />
                        </div>
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
