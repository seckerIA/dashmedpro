
import React, { useState } from "react";
import { useInventoryAlerts, InventoryAlertItem } from "@/hooks/useInventoryAlerts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    AlertTriangle,
    Clock,
    XCircle,
    ArrowDown,
    Package,
    Trash2,
    RefreshCw,
    Filter
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type FilterType = "all" | "expired" | "critical" | "warning" | "low_stock";

const AlertIcon = ({ type }: { type: InventoryAlertItem["type"] }) => {
    switch (type) {
        case "expired":
            return <XCircle className="h-5 w-5 text-black" />;
        case "critical":
            return <AlertTriangle className="h-5 w-5 text-red-500" />;
        case "warning":
            return <Clock className="h-5 w-5 text-yellow-500" />;
        case "low_stock":
            return <ArrowDown className="h-5 w-5 text-orange-500" />;
    }
};

const AlertBadge = ({ type }: { type: InventoryAlertItem["type"] }) => {
    const variants: Record<InventoryAlertItem["type"], { bg: string; text: string; label: string }> = {
        expired: { bg: "bg-black", text: "text-white", label: "Vencido" },
        critical: { bg: "bg-red-500", text: "text-white", label: "Crítico" },
        warning: { bg: "bg-yellow-500", text: "text-black", label: "Atenção" },
        low_stock: { bg: "bg-orange-500", text: "text-white", label: "Estoque Baixo" },
    };
    const v = variants[type];
    return <Badge className={`${v.bg} ${v.text} text-xs`}>{v.label}</Badge>;
};

export function AlertsPanel() {
    const { alerts, summary, isLoading, refetch } = useInventoryAlerts();
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [selectedAlert, setSelectedAlert] = useState<InventoryAlertItem | null>(null);
    const [isLossModalOpen, setIsLossModalOpen] = useState(false);
    const [lossQuantity, setLossQuantity] = useState("");
    const [lossReason, setLossReason] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [filter, setFilter] = useState<FilterType>("all");

    const filteredAlerts = alerts.filter(alert => {
        if (filter === "all") return true;
        return alert.type === filter;
    });

    const handleRegisterLoss = async () => {
        if (!selectedAlert || !user?.id) return;

        const qty = parseInt(lossQuantity);
        if (isNaN(qty) || qty <= 0 || qty > selectedAlert.quantity) {
            toast({
                variant: "destructive",
                title: "Quantidade inválida",
                description: `A quantidade deve ser entre 1 e ${selectedAlert.quantity}`,
            });
            return;
        }

        setIsProcessing(true);

        try {
            // Registrar movimentação de perda
            const { error } = await (supabase
                .from("inventory_movements" as any) as any)
                .insert([{
                    batch_id: selectedAlert.batchId,
                    type: "LOSS",
                    quantity: -qty, // Negativo para indicar saída
                    description: `Perda registrada: ${lossReason || 'Vencimento'}`,
                    created_by: user.id,
                }] as any);

            if (error) throw error;

            toast({
                title: "Perda registrada",
                description: `${qty} unidade(s) de "${selectedAlert.itemName}" registrada(s) como perda.`,
            });

            // Invalidar queries
            queryClient.invalidateQueries({ queryKey: ["inventory-alerts"] });
            queryClient.invalidateQueries({ queryKey: ["inventory-dashboard"] });
            queryClient.invalidateQueries({ queryKey: ["inventory-items"] });

            setIsLossModalOpen(false);
            setSelectedAlert(null);
            setLossQuantity("");
            setLossReason("");
        } catch (error) {
            console.error("Erro ao registrar perda:", error);
            toast({
                variant: "destructive",
                title: "Erro ao registrar perda",
                description: "Não foi possível registrar a perda. Tente novamente.",
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const openLossModal = (alert: InventoryAlertItem) => {
        if (!alert.batchId) {
            toast({
                variant: "destructive",
                title: "Ação não disponível",
                description: "Esta ação só está disponível para alertas de lotes específicos.",
            });
            return;
        }
        setSelectedAlert(alert);
        setLossQuantity(String(alert.quantity));
        setLossReason(alert.type === "expired" ? "Produto vencido" : "");
        setIsLossModalOpen(true);
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                Central de Alertas
                            </CardTitle>
                            <CardDescription>
                                {summary?.total || 0} alertas ativos • {summary?.expired || 0} vencidos • {summary?.critical || 0} críticos
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => refetch()}>
                            <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Filtros */}
                    <div className="mb-4">
                        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
                            <TabsList>
                                <TabsTrigger value="all">Todos ({summary?.total || 0})</TabsTrigger>
                                <TabsTrigger value="expired" className="text-black">Vencidos ({summary?.expired || 0})</TabsTrigger>
                                <TabsTrigger value="critical" className="text-red-500">Críticos ({summary?.critical || 0})</TabsTrigger>
                                <TabsTrigger value="warning" className="text-yellow-600">Atenção ({summary?.warning || 0})</TabsTrigger>
                                <TabsTrigger value="low_stock" className="text-orange-500">Estoque Baixo ({summary?.lowStock || 0})</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    {/* Lista de Alertas */}
                    {filteredAlerts.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Package className="h-16 w-16 mx-auto mb-4 opacity-30" />
                            <p className="text-lg font-medium">Nenhum alerta encontrado</p>
                            <p className="text-sm">
                                {filter === "all"
                                    ? "Seu estoque está em ordem!"
                                    : `Não há alertas do tipo "${filter.replace("_", " ")}"`
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[500px] overflow-y-auto">
                            {filteredAlerts.map((alert) => (
                                <div
                                    key={alert.id}
                                    className={`
                    flex items-center justify-between gap-4 p-4 rounded-lg border
                    ${alert.type === "expired"
                                            ? "bg-gray-500/10 border-gray-500/50"
                                            : alert.type === "critical"
                                                ? "bg-red-500/10 border-red-500/50"
                                                : alert.type === "warning"
                                                    ? "bg-yellow-500/10 border-yellow-500/50"
                                                    : "bg-orange-500/10 border-orange-500/50"
                                        }
                    transition-colors hover:shadow-md
                  `}
                                >
                                    <div className="flex items-center gap-4">
                                        <AlertIcon type={alert.type} />
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold">{alert.itemName}</span>
                                                <AlertBadge type={alert.type} />
                                            </div>
                                            <p className="text-sm text-muted-foreground">{alert.message}</p>
                                            {alert.batchNumber && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Lote: {alert.batchNumber} • Qtd: {alert.quantity}
                                                    {alert.expirationDate && (
                                                        <> • Validade: {format(alert.expirationDate, "dd/MM/yyyy", { locale: ptBR })}</>
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Ações */}
                                    {alert.batchId && (alert.type === "expired" || alert.type === "critical") && (
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => openLossModal(alert)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" /> Registrar Perda
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal de Registro de Perda */}
            <Dialog open={isLossModalOpen} onOpenChange={setIsLossModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Registrar Perda de Estoque</DialogTitle>
                        <DialogDescription>
                            Registrar perda do produto "{selectedAlert?.itemName}" (Lote: {selectedAlert?.batchNumber})
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Quantidade a dar baixa</Label>
                            <Input
                                type="number"
                                min="1"
                                max={selectedAlert?.quantity || 0}
                                value={lossQuantity}
                                onChange={(e) => setLossQuantity(e.target.value)}
                                onFocus={(e) => e.target.select()}
                            />
                            <p className="text-xs text-muted-foreground">
                                Disponível no lote: {selectedAlert?.quantity} unidades
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Motivo da perda</Label>
                            <Textarea
                                value={lossReason}
                                onChange={(e) => setLossReason(e.target.value)}
                                placeholder="Ex: Produto vencido, danificado, etc."
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsLossModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleRegisterLoss}
                            disabled={isProcessing}
                        >
                            {isProcessing ? "Processando..." : "Confirmar Perda"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
