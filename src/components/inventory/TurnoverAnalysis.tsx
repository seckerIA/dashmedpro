
import React, { useState } from "react";
import { useStockTurnover, ItemTurnover, TurnoverStatus } from "@/hooks/useStockTurnover";
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
import { Input } from "@/components/ui/input";
import {
    TrendingUp,
    TrendingDown,
    Minus,
    Clock,
    RefreshCw,
    Search,
    AlertCircle,
    DollarSign,
    Package
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type FilterType = "all" | "high" | "medium" | "low" | "stale";

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const TurnoverBadge = ({ status }: { status: TurnoverStatus }) => {
    const variants: Record<TurnoverStatus, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
        high: { bg: "bg-green-500/20", text: "text-green-400", label: "Alto Giro", icon: <TrendingUp className="h-3 w-3" /> },
        medium: { bg: "bg-blue-500/20", text: "text-blue-400", label: "Médio Giro", icon: <Minus className="h-3 w-3" /> },
        low: { bg: "bg-yellow-500/20", text: "text-yellow-400", label: "Baixo Giro", icon: <TrendingDown className="h-3 w-3" /> },
        stale: { bg: "bg-red-500/20", text: "text-red-400", label: "Parado", icon: <Clock className="h-3 w-3" /> },
    };
    const v = variants[status];
    return (
        <Badge className={`${v.bg} ${v.text} text-xs gap-1`}>
            {v.icon} {v.label}
        </Badge>
    );
};

export function TurnoverAnalysis() {
    const { summary, items, isLoading, refetch } = useStockTurnover();
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState<FilterType>("all");

    const filteredItems = items.filter(item => {
        const matchesSearch = item.itemName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === "all" || item.turnoverStatus === filter;
        return matchesSearch && matchesFilter;
    });

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
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

    if (!summary) return null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold">Análise de Giro de Estoque</h2>
                    <p className="text-sm text-muted-foreground">
                        Identifique produtos parados que consomem capital
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
                </Button>
            </div>

            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-green-500/50 bg-green-500/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Alto Giro</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-400">{summary.highGiro}</div>
                        <p className="text-xs text-muted-foreground">Movimentou em ≤15 dias</p>
                    </CardContent>
                </Card>

                <Card className="border-blue-500/50 bg-blue-500/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Médio Giro</CardTitle>
                        <Minus className="h-4 w-4 text-blue-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-400">{summary.mediumGiro}</div>
                        <p className="text-xs text-muted-foreground">Movimentou em 16-45 dias</p>
                    </CardContent>
                </Card>

                <Card className="border-yellow-500/50 bg-yellow-500/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Baixo Giro</CardTitle>
                        <TrendingDown className="h-4 w-4 text-yellow-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-400">{summary.lowGiro}</div>
                        <p className="text-xs text-muted-foreground">Movimentou em 46-90 dias</p>
                    </CardContent>
                </Card>

                <Card className="border-red-500/50 bg-red-500/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Parados</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-400">{summary.staleGiro}</div>
                        <p className="text-xs text-muted-foreground">
                            {formatCurrency(summary.staleValue)} parado
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Alerta de Capital Parado */}
            {summary.staleValue > 0 && (
                <Card className="border-red-500/50 bg-red-500/10">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-500/20 rounded-full">
                                <DollarSign className="h-6 w-6 text-red-400" />
                            </div>
                            <div>
                                <p className="font-semibold text-red-400">
                                    {formatCurrency(summary.staleValue)} em capital parado
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {summary.staleGiro} produto(s) sem movimentação há mais de 90 dias.
                                    Considere promoções ou ajustes de estoque.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Tabela */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Detalhamento por Produto</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Filtros */}
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <div className="flex items-center gap-2 flex-1">
                            <Search className="h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar produto..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="max-w-sm"
                            />
                        </div>
                        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
                            <TabsList>
                                <TabsTrigger value="all">Todos</TabsTrigger>
                                <TabsTrigger value="stale">Parados</TabsTrigger>
                                <TabsTrigger value="low">Baixo</TabsTrigger>
                                <TabsTrigger value="medium">Médio</TabsTrigger>
                                <TabsTrigger value="high">Alto</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Produto</TableHead>
                                <TableHead>Categoria</TableHead>
                                <TableHead>Estoque</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Última Saída</TableHead>
                                <TableHead>Consumo/Mês</TableHead>
                                <TableHead>Cobertura</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                        <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                        <p>Nenhum produto encontrado</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredItems.map((item) => (
                                    <TableRow key={item.itemId}>
                                        <TableCell className="font-medium">{item.itemName}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{item.category}</Badge>
                                        </TableCell>
                                        <TableCell>{item.currentStock} {item.unit}</TableCell>
                                        <TableCell>{formatCurrency(item.stockValue)}</TableCell>
                                        <TableCell>
                                            {item.lastMovementDate ? (
                                                <span className={item.daysSinceMovement! > 45 ? "text-red-600" : ""}>
                                                    {format(item.lastMovementDate, "dd/MM/yyyy", { locale: ptBR })}
                                                    <span className="text-xs text-muted-foreground ml-1">
                                                        ({item.daysSinceMovement}d)
                                                    </span>
                                                </span>
                                            ) : (
                                                <span className="text-red-600">Nunca</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {item.monthlyConsumption > 0
                                                ? `${item.monthlyConsumption} ${item.unit}/mês`
                                                : <span className="text-muted-foreground">-</span>
                                            }
                                        </TableCell>
                                        <TableCell>
                                            {item.coverageMonths !== null ? (
                                                <span className={item.coverageMonths > 6 ? "text-yellow-600" : ""}>
                                                    {item.coverageMonths} meses
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <TurnoverBadge status={item.turnoverStatus} />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
