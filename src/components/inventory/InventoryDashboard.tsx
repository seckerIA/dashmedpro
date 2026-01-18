
import React from "react";
import { useInventoryDashboard, InventoryAlert } from "@/hooks/useInventoryDashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Package,
    DollarSign,
    TrendingUp,
    AlertTriangle,
    Clock,
    XCircle,
    ArrowDown,
    RefreshCw,
    Boxes,
    Activity
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const AlertIcon = ({ type }: { type: InventoryAlert["type"] }) => {
    switch (type) {
        case "expired":
            return <XCircle className="h-4 w-4 text-black" />;
        case "critical":
            return <AlertTriangle className="h-4 w-4 text-red-500" />;
        case "warning":
            return <Clock className="h-4 w-4 text-yellow-500" />;
        case "low_stock":
            return <ArrowDown className="h-4 w-4 text-orange-500" />;
    }
};

const AlertBadge = ({ type }: { type: InventoryAlert["type"] }) => {
    const variants: Record<InventoryAlert["type"], { bg: string; text: string; label: string }> = {
        expired: { bg: "bg-black", text: "text-white", label: "Vencido" },
        critical: { bg: "bg-red-500/20", text: "text-red-400", label: "Crítico" },
        warning: { bg: "bg-yellow-500/20", text: "text-yellow-400", label: "Atenção" },
        low_stock: { bg: "bg-orange-500/20", text: "text-orange-400", label: "Estoque Baixo" },
    };
    const v = variants[type];
    return <Badge className={`${v.bg} ${v.text} text-xs`}>{v.label}</Badge>;
};

export function InventoryDashboard() {
    const { metrics, isLoading, refetch } = useInventoryDashboard();

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i}>
                            <CardHeader className="pb-2">
                                <Skeleton className="h-4 w-24" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-32" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (!metrics) return null;

    const totalAlerts = metrics.alerts.length;
    const criticalAlerts = metrics.alerts.filter(a => a.type === "expired" || a.type === "critical").length;

    return (
        <div className="space-y-6">
            {/* Header com Refresh */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold">Visão Geral do Estoque</h2>
                    <p className="text-sm text-muted-foreground">Métricas atualizadas em tempo real</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
                </Button>
            </div>

            {/* KPIs Principais */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Valor em Estoque (Custo)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(metrics.totalCostValue)}</div>
                        <p className="text-xs text-muted-foreground">
                            Estimativa de custo de aquisição
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Valor de Venda Potencial</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(metrics.totalSellValue)}</div>
                        <p className="text-xs text-muted-foreground">
                            Margem potencial: {formatCurrency(metrics.potentialMargin)}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Itens / Lotes</CardTitle>
                        <Boxes className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.totalItems} / {metrics.totalBatches}</div>
                        <p className="text-xs text-muted-foreground">
                            {metrics.recentMovements} movimentações (30d)
                        </p>
                    </CardContent>
                </Card>

                <Card className={criticalAlerts > 0 ? "border-red-500/50 bg-red-500/10" : ""}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Alertas Ativos</CardTitle>
                        <AlertTriangle className={`h-4 w-4 ${criticalAlerts > 0 ? "text-red-400" : "text-muted-foreground"}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${criticalAlerts > 0 ? "text-red-400" : ""}`}>
                            {totalAlerts}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {criticalAlerts > 0 && <span className="text-red-400">{criticalAlerts} críticos</span>}
                            {criticalAlerts === 0 && "Nenhum alerta crítico"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Grid: Alertas + Categorias */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Painel de Alertas */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Activity className="h-4 w-4" /> Alertas e Notificações
                        </CardTitle>
                        <CardDescription>
                            Itens que requerem atenção imediata
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {metrics.alerts.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Nenhum alerta ativo</p>
                                <p className="text-sm">Seu estoque está em ordem!</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                {metrics.alerts.slice(0, 10).map((alert) => (
                                    <div
                                        key={alert.id}
                                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                    >
                                        <AlertIcon type={alert.type} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium text-sm truncate">{alert.itemName}</span>
                                                <AlertBadge type={alert.type} />
                                            </div>
                                            <p className="text-xs text-muted-foreground">{alert.message}</p>
                                            {alert.batchNumber !== "-" && (
                                                <p className="text-xs text-muted-foreground">
                                                    Lote: {alert.batchNumber} • Qtd: {alert.quantity}
                                                    {alert.expirationDate && (
                                                        <> • Validade: {format(alert.expirationDate, "dd/MM/yyyy", { locale: ptBR })}</>
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {metrics.alerts.length > 10 && (
                                    <p className="text-center text-sm text-muted-foreground pt-2">
                                        +{metrics.alerts.length - 10} alertas adicionais
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Distribuição por Categoria */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Package className="h-4 w-4" /> Distribuição por Categoria
                        </CardTitle>
                        <CardDescription>
                            Valor em estoque por tipo de produto
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {metrics.categoryDistribution.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>Nenhum dado disponível</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {metrics.categoryDistribution
                                    .sort((a, b) => b.value - a.value)
                                    .map((cat, idx) => {
                                        const maxValue = Math.max(...metrics.categoryDistribution.map(c => c.value));
                                        const percentage = maxValue > 0 ? (cat.value / maxValue) * 100 : 0;
                                        const colors = ["bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500", "bg-pink-500"];

                                        return (
                                            <div key={cat.category} className="space-y-1">
                                                <div className="flex justify-between text-sm">
                                                    <span className="font-medium">{cat.category}</span>
                                                    <span className="text-muted-foreground">
                                                        {formatCurrency(cat.value)} ({cat.count} itens)
                                                    </span>
                                                </div>
                                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${colors[idx % colors.length]} transition-all duration-500`}
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Resumo de Status */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-red-500/50 bg-red-500/10">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-500/20 rounded-full">
                                <XCircle className="h-5 w-5 text-red-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-red-400">{metrics.expiredCount}</p>
                                <p className="text-sm text-muted-foreground">Lotes Vencidos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-yellow-500/50 bg-yellow-500/10">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-500/20 rounded-full">
                                <Clock className="h-5 w-5 text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-yellow-400">{metrics.expiringCount}</p>
                                <p className="text-sm text-muted-foreground">Próximos ao Vencimento</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-orange-500/50 bg-orange-500/10">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-500/20 rounded-full">
                                <ArrowDown className="h-5 w-5 text-orange-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-orange-400">{metrics.lowStockCount}</p>
                                <p className="text-sm text-muted-foreground">Estoque Baixo</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
