import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle, Trophy, UserPlus, Calendar, Stethoscope, Clock, AlertTriangle, MessageSquare, CheckCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function PipelineHelp() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                    <HelpCircle className="h-5 w-5" />
                    <span className="sr-only">Ajuda do Pipeline</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <HelpCircle className="h-6 w-6 text-primary" />
                        Entenda seu Pipeline CRM
                    </DialogTitle>
                    <DialogDescription>
                        Guia rápido sobre as etapas do funil de vendas e como organizar seus pacientes.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="h-[60vh] pr-4">
                    <div className="space-y-6">

                        {/* Seção das Etapas */}
                        <section className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2">Etapas do Funil</h3>

                            <div className="grid gap-4">
                                <HelpItem
                                    icon={UserPlus}
                                    color="text-slate-400"
                                    title="Lead Novo"
                                    description="Pacientes que acabaram de chegar (site, redes sociais). Ação: Fazer o primeiro contato."
                                />

                                <HelpItem
                                    icon={MessageSquare}
                                    color="text-cyan-400"
                                    title="Em Contato / Qualificação"
                                    description="Conversa iniciada. O paciente está tirando dúvidas, mas ainda não agendou. Separa quem é 'frio' (Novo) de quem está 'morno'."
                                />

                                <HelpItem
                                    icon={Calendar}
                                    color="text-blue-400"
                                    title="Agendado"
                                    description="Primeira vitória! Data e hora marcadas. O sistema enviará lembretes automáticos."
                                />

                                <HelpItem
                                    icon={Stethoscope} // Or FileText per new config, let's stick to concept
                                    color="text-indigo-400"
                                    title="Avaliação / Orçamento"
                                    description="Paciente compareceu e recebeu um orçamento. Fase de negociação de valores."
                                />

                                <HelpItem
                                    icon={Stethoscope}
                                    color="text-green-400"
                                    title="Em Tratamento (Conversão ✅)"
                                    description="Orçamento aprovado e tratamento iniciado. Aqui conta como 'Venda' para suas métricas."
                                />

                                <HelpItem
                                    icon={Clock}
                                    color="text-yellow-400"
                                    title="Aguardando Retorno"
                                    description="Pausa clínica (ex: cicatrizando, esperando exames). O paciente vai voltar, mas não requer ação imediata de hoje."
                                />

                                <HelpItem
                                    icon={AlertTriangle}
                                    color="text-red-400"
                                    title="Inadimplentes"
                                    description="Realizou serviço mas está pendente de pagamento. Atenção do financeiro."
                                />

                                <HelpItem
                                    icon={Trophy}
                                    color="text-emerald-500"
                                    title="Finalizado / Alta"
                                    description="Tratamento concluído com sucesso. Bom momento para pedir indicações ou avaliações."
                                />
                            </div>
                        </section>

                        {/* Seção Follow-ups */}
                        <section className="space-y-4 bg-muted/50 p-4 rounded-lg border border-orange-200 dark:border-orange-900/30">
                            <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-orange-500" />
                                <h3 className="text-lg font-semibold text-orange-700 dark:text-orange-400">Aba Lateral: Follow-ups</h3>
                            </div>

                            <div className="text-sm space-y-2 text-muted-foreground">
                                <p>
                                    <strong>Não arraste pacientes para cá!</strong> Esta aba não é uma etapa.
                                </p>
                                <p>
                                    Ela mostra automaticamente qualquer paciente (de qualquer etapa) que tenha uma <strong>Tarefa Pendente</strong> ou que foi marcado para acompanhamento.
                                </p>
                                <div className="bg-background p-3 rounded border text-foreground text-xs">
                                    <span className="font-semibold">Exemplo:</span> Você tem um paciente "Em Negociação" e marca pra ligar amanhã. Ele continuará na coluna "Em Negociação", mas aparecerá nesta aba amanhã como lembrete.
                                </div>
                            </div>
                        </section>

                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

function HelpItem({ icon: Icon, color, title, description }: { icon: any, color: string, title: string, description: string }) {
    return (
        <div className="flex gap-3 items-start">
            <div className={`mt-1 p-1.5 rounded-md bg-muted ${color}`}>
                <Icon className="h-4 w-4" />
            </div>
            <div>
                <h4 className="font-medium text-sm text-foreground">{title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
        </div>
    );
}
