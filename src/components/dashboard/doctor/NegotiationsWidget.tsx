
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Phone, ArrowUpRight, CheckCircle2, Bot, Calendar, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCRM } from "@/hooks/useCRM";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

export function NegotiationsWidget() {
    const navigate = useNavigate();
    // Using useCRM to fetch "deals" which represent negotiations
    const { deals, isLoading } = useCRM();

    // Filter relevant deals: not lost or won, just active negotiations
    // Pipeline stages: 'lead_novo', 'em_contato', 'agendado', 'avaliacao', 'em_tratamento', 'aguardando_retorno', 'inadimplente'
    // We want to show "Active Conversations" or "Negotiations". Let's pick 'em_contato', 'agendado', 'avaliacao'.
    const activeDeals = deals?.filter(deal =>
        ['em_contato', 'avaliacao', 'agendado'].includes(deal.stage)
    ).slice(0, 5) || [];

    if (isLoading) {
        return <Skeleton className="w-full h-[300px] rounded-xl" />;
    }

    // Mock AI win probability for now, as it wasn't in the base `deals` type immediately visible
    // In a real implementation, this would come from `deal.win_probability` or similar analysis
    const getWinProbability = (dealId: string) => {
        // Deterministic 'random' based on ID length for consistent UI demo
        const seed = dealId.length;
        if (seed % 3 === 0) return { val: 85, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
        if (seed % 3 === 1) return { val: 60, color: 'text-amber-500', bg: 'bg-amber-500/10' };
        return { val: 40, color: 'text-red-500', bg: 'bg-red-500/10' };
    };

    return (
        <Card className="h-full border-border shadow-sm">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-primary" />
                            Negociações Ativas
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">Conversas e agendamentos em andamento</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[300px]">
                    <div className="divide-y divide-border/50">
                        {activeDeals.length > 0 ? (
                            activeDeals.map((deal) => {
                                const probability = getWinProbability(deal.id);
                                return (
                                    <div key={deal.id} className="p-4 hover:bg-muted/40 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="space-y-1">
                                                <p className="font-medium text-sm text-foreground">
                                                    {deal.title || "Sem título"}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-3 h-3" />
                                                        {deal.contact?.full_name || "Desconhecido"}
                                                    </span>
                                                    <span>•</span>
                                                    <span>
                                                        {formatDistanceToNow(new Date(deal.created_at), { addSuffix: true, locale: ptBR })}
                                                    </span>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className={`${probability.bg} ${probability.color} border-0 text-xs`}>
                                                {probability.val}% chance
                                            </Badge>
                                        </div>

                                        <div className="flex items-center justify-between mt-3">
                                            <div className="flex items-center gap-2">
                                                {deal.assigned_to_profile ? (
                                                    <div className="flex items-center gap-1.5 text-xs bg-muted px-2 py-1 rounded-full">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                        <span className="text-muted-foreground">
                                                            {deal.assigned_to_profile.full_name?.split(' ')[0]}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-xs bg-muted px-2 py-1 rounded-full opacity-70">
                                                        <Bot className="w-3 h-3" />
                                                        <span>IA Assistente</span>
                                                    </div>
                                                )}
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 text-xs hover:bg-primary/10 hover:text-primary"
                                                onClick={() => navigate(`/crm?dealId=${deal.id}`)}
                                            >
                                                Ver conversa <ArrowUpRight className="w-3 h-3 ml-1" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-8 text-center text-muted-foreground">
                                <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                <p>Nenhuma negociação ativa no momento.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <div className="p-3 border-t bg-muted/20">
                    <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => navigate('/crm')}>
                        Ver todas as negociações
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
