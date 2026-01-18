
import React, { useState } from "react";
import { useInventoryReports } from "@/hooks/useInventoryReports";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    RefreshCw,
    TrendingDown,
    Package,
    AlertCircle,
    ShoppingCart,
    Trash2,
    BarChart3,
    Calendar
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const UrgencyBadge = ({ urgency }: { urgency: string }) => {
    const variants: Record<string, { bg: string; text: string; label: string }> = {
        critical: { bg: "bg-red-100", text: "text-red-700", label: "Crítico" },
        warning: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Atenção" },
        normal: { bg: "bg-blue-100", text: "text-blue-700", label: "Normal" },
        safe: { bg: "bg-green-100", text: "text-green-700", label: "Seguro" },
    };
    const v = variants[urgency] || variants.safe;
    return <Badge className={`${v.bg} ${v.text} text-xs`}>{v.label}</Badge>;
};

export function InventoryReports() {
    const { data, isLoading, refetch } = useInventoryReports();

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i}>
                            <CardHeader className="pb-2">
                                <Skeleton className="h-4 w-24" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-16" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold">Relatórios Gerenciais</h2>
                    <p className="text-sm text-muted-foreground">
                        Análise de consumo, projeções e perdas dos últimos 6 meses
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
                </Button>
            </div>

            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Consumo Total (6 meses)</CardTitle>
                        <TrendingDown className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {formatCurrency(data.totalConsumptionValue)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {data.monthlyConsumption.reduce((sum, m) => sum + m.quantity, 0)} unidades
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Itens para Repor</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">
                            {data.replenishmentProjections.filter(p => p.urgency !== "safe").length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {data.replenishmentProjections.filter(p => p.urgency === "critical").length} críticos
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Perdas (6 meses)</CardTitle>
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {formatCurrency(data.totalLossValue)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {data.lossReport.reduce((sum, l) => sum + l.totalLosses, 0)} unidades perdidas
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs de Relatórios */}
            <Tabs defaultValue="consumption" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="consumption">
                        <BarChart3 className="h-4 w-4 mr-2" /> Consumo por Categoria
                    </TabsTrigger>
                    <TabsTrigger value="replenishment">
                        <ShoppingCart className="h-4 w-4 mr-2" /> Projeção de Reposição
                    </TabsTrigger>
                    <TabsTrigger value="losses">
                        <Trash2 className="h-4 w-4 mr-2" /> Perdas
                    </TabsTrigger>
                </TabsList>

                {/* Consumo por Categoria */}
                <TabsContent value="consumption">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Consumo Mensal por Categoria</CardTitle>
                            <CardDescription>Últimos 6 meses de movimentações de saída</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {data.categorySummary.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                    <p>Sem dados de consumo registrados</p>
                                </div>
                            ) : (
                                <>
                                    {/* Gráfico de barras simplificado */}
                                    <div className="space-y-4 mb-6">
                                        {data.categorySummary.slice(0, 8).map((cat) => {
                                            const maxValue = data.categorySummary[0]?.totalValue || 1;
                                            const percentage = (cat.totalValue / maxValue) * 100;
                                            return (
                                                <div key={cat.category} className="space-y-1">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="font-medium">{cat.category}</span>
                                                        <span className="text-muted-foreground">
                                                            {formatCurrency(cat.totalValue)} ({cat.itemCount} itens)
                                                        </span>
                                                    </div>
                                                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-500 transition-all duration-500"
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Tabela detalhada */}
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Categoria</TableHead>
                                                <TableHead>Quantidade em Estoque</TableHead>
                                                <TableHead>Valor em Estoque</TableHead>
                                                <TableHead>Itens</TableHead>
                                                <TableHead>Preço Médio</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {data.categorySummary.map((cat) => (
                                                <TableRow key={cat.category}>
                                                    <TableCell className="font-medium">{cat.category}</TableCell>
                                                    <TableCell>{cat.totalQuantity}</TableCell>
                                                    <TableCell>{formatCurrency(cat.totalValue)}</TableCell>
                                                    <TableCell>{cat.itemCount}</TableCell>
                                                    <TableCell>
                                                        {cat.averagePrice ? formatCurrency(cat.averagePrice) : "-"}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Projeção de Reposição */}
                <TabsContent value="replenishment">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Projeção de Reposição</CardTitle>
                            <CardDescription>
                                Baseado no consumo médio dos últimos 6 meses
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {data.replenishmentProjections.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                    <p>Nenhum item necessita reposição no momento</p>
                                </div>
                            ) : (
                                <>
                                    {/* Alertas críticos */}
                                    {data.replenishmentProjections.filter(p => p.urgency === "critical").length > 0 && (
                                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                            <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
                                                <AlertCircle className="h-5 w-5" />
                                                Itens Críticos - Reposição Urgente
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {data.replenishmentProjections
                                                    .filter(p => p.urgency === "critical")
                                                    .map(p => (
                                                        <Badge key={p.itemId} variant="destructive">
                                                            {p.itemName}: {p.daysUntilEmpty !== null ? `${p.daysUntilEmpty} dias` : "Estoque zerado"}
                                                        </Badge>
                                                    ))}
                                            </div>
                                        </div>
                                    )}

                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Produto</TableHead>
                                                <TableHead>Categoria</TableHead>
                                                <TableHead>Estoque Atual</TableHead>
                                                <TableHead>Consumo/Mês</TableHead>
                                                <TableHead>Dias Restantes</TableHead>
                                                <TableHead>Sugestão Pedido</TableHead>
                                                <TableHead>Urgência</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {data.replenishmentProjections.map((proj) => (
                                                <TableRow key={proj.itemId}>
                                                    <TableCell className="font-medium">{proj.itemName}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{proj.category}</Badge>
                                                    </TableCell>
                                                    <TableCell>{proj.currentStock}</TableCell>
                                                    <TableCell>{proj.monthlyConsumption}</TableCell>
                                                    <TableCell>
                                                        {proj.daysUntilEmpty !== null ? (
                                                            <span className={proj.daysUntilEmpty <= 7 ? "text-red-600 font-bold" : ""}>
                                                                {proj.daysUntilEmpty} dias
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {proj.suggestedOrder > 0 ? (
                                                            <span className="font-medium text-blue-600">
                                                                +{proj.suggestedOrder} un
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <UrgencyBadge urgency={proj.urgency} />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Relatório de Perdas */}
                <TabsContent value="losses">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Relatório de Perdas</CardTitle>
                            <CardDescription>Produtos perdidos por vencimento ou avaria</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {data.lossReport.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                    <p>Nenhuma perda registrada nos últimos 6 meses 🎉</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {data.lossReport.map((loss) => (
                                        <div key={loss.month} className="border rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">
                                                        {format(parseISO(`${loss.month}-01`), "MMMM yyyy", { locale: ptBR })}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-red-600 font-bold">{formatCurrency(loss.lossValue)}</span>
                                                    <span className="text-muted-foreground text-sm ml-2">
                                                        ({loss.totalLosses} un)
                                                    </span>
                                                </div>
                                            </div>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Produto</TableHead>
                                                        <TableHead>Quantidade</TableHead>
                                                        <TableHead>Valor</TableHead>
                                                        <TableHead>Motivo</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {loss.items.map((item, idx) => (
                                                        <TableRow key={idx}>
                                                            <TableCell>{item.itemName}</TableCell>
                                                            <TableCell>{item.quantity}</TableCell>
                                                            <TableCell>{formatCurrency(item.value)}</TableCell>
                                                            <TableCell className="text-muted-foreground">{item.reason}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
