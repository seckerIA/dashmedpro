
import React, { useState } from "react";
import { useABCAnalysis, ABCItem, ABCClass } from "@/hooks/useABCAnalysis";
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
    RefreshCw,
    Search,
    Package,
    Star,
    CircleDot,
    Circle
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type FilterType = "all" | "A" | "B" | "C";

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const ABCBadge = ({ abcClass }: { abcClass: ABCClass }) => {
    const variants: Record<ABCClass, { bg: string; text: string; icon: React.ReactNode }> = {
        A: { bg: "bg-amber-500/20", text: "text-amber-400", icon: <Star className="h-3 w-3 fill-amber-400" /> },
        B: { bg: "bg-blue-500/20", text: "text-blue-400", icon: <CircleDot className="h-3 w-3" /> },
        C: { bg: "bg-gray-500/20", text: "text-gray-400", icon: <Circle className="h-3 w-3" /> },
    };
    const v = variants[abcClass];
    return (
        <Badge className={`${v.bg} ${v.text} text-xs gap-1 font-bold`}>
            {v.icon} Classe {abcClass}
        </Badge>
    );
};

export function ABCChart() {
    const { summary, items, isLoading, refetch } = useABCAnalysis();
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState<FilterType>("all");

    const filteredItems = items.filter(item => {
        const matchesSearch = item.itemName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === "all" || item.abcClass === filter;
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
                    <h2 className="text-lg font-semibold">Curva ABC (Pareto)</h2>
                    <p className="text-sm text-muted-foreground">
                        Classificação de itens por representatividade de valor
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
                </Button>
            </div>

            {/* Explicação */}
            <Card className="bg-muted/30">
                <CardContent className="pt-4">
                    <div className="grid gap-4 md:grid-cols-3 text-sm">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-amber-500/20 rounded-full">
                                <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                            </div>
                            <div>
                                <p className="font-semibold text-amber-400">Classe A (80% do valor)</p>
                                <p className="text-muted-foreground">Itens prioritários - gestão rigorosa</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-full">
                                <CircleDot className="h-4 w-4 text-blue-400" />
                            </div>
                            <div>
                                <p className="font-semibold text-blue-400">Classe B (15% do valor)</p>
                                <p className="text-muted-foreground">Itens intermediários - gestão moderada</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-gray-500/20 rounded-full">
                                <Circle className="h-4 w-4 text-gray-400" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-400">Classe C (5% do valor)</p>
                                <p className="text-muted-foreground">Itens de baixo valor - gestão simplificada</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* KPIs por Classe */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(summary.totalValue)}</div>
                        <p className="text-xs text-muted-foreground">{items.length} itens com valor</p>
                    </CardContent>
                </Card>

                <Card className="border-amber-500/50 bg-amber-500/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Classe A</CardTitle>
                        <Star className="h-4 w-4 text-amber-400 fill-amber-300" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-400">{summary.classA.items}</div>
                        <p className="text-xs text-muted-foreground">
                            {formatCurrency(summary.classA.value)} ({summary.classA.percentage.toFixed(0)}% dos itens)
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-blue-500/50 bg-blue-500/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Classe B</CardTitle>
                        <CircleDot className="h-4 w-4 text-blue-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-400">{summary.classB.items}</div>
                        <p className="text-xs text-muted-foreground">
                            {formatCurrency(summary.classB.value)} ({summary.classB.percentage.toFixed(0)}% dos itens)
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-gray-500/50 bg-gray-500/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Classe C</CardTitle>
                        <Circle className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-400">{summary.classC.items}</div>
                        <p className="text-xs text-muted-foreground">
                            {formatCurrency(summary.classC.value)} ({summary.classC.percentage.toFixed(0)}% dos itens)
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Gráfico Visual de Barras (simplificado) */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Distribuição Visual</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {items.slice(0, 15).map((item, idx) => {
                            const maxValue = items[0]?.stockValue || 1;
                            const percentage = (item.stockValue / maxValue) * 100;
                            const colors = {
                                A: "bg-amber-500",
                                B: "bg-blue-500",
                                C: "bg-gray-400",
                            };

                            return (
                                <div key={item.itemId} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium truncate max-w-[200px]">
                                            {idx + 1}. {item.itemName}
                                        </span>
                                        <span className="text-muted-foreground flex items-center gap-2">
                                            {formatCurrency(item.stockValue)}
                                            <ABCBadge abcClass={item.abcClass} />
                                        </span>
                                    </div>
                                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${colors[item.abcClass]} transition-all duration-500`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                        {items.length > 15 && (
                            <p className="text-center text-sm text-muted-foreground pt-2">
                                +{items.length - 15} itens adicionais na tabela abaixo
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Tabela Completa */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Todos os Itens</CardTitle>
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
                                <TabsTrigger value="A" className="text-amber-600">A</TabsTrigger>
                                <TabsTrigger value="B" className="text-blue-600">B</TabsTrigger>
                                <TabsTrigger value="C" className="text-gray-600">C</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>#</TableHead>
                                <TableHead>Produto</TableHead>
                                <TableHead>Categoria</TableHead>
                                <TableHead>Estoque</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>% do Total</TableHead>
                                <TableHead>% Acumulado</TableHead>
                                <TableHead>Classe</TableHead>
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
                                filteredItems.map((item, idx) => (
                                    <TableRow key={item.itemId}>
                                        <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                                        <TableCell className="font-medium">{item.itemName}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{item.category}</Badge>
                                        </TableCell>
                                        <TableCell>{item.currentStock} {item.unit}</TableCell>
                                        <TableCell>{formatCurrency(item.stockValue)}</TableCell>
                                        <TableCell>{item.percentageOfTotal.toFixed(1)}%</TableCell>
                                        <TableCell>{item.cumulativePercentage.toFixed(1)}%</TableCell>
                                        <TableCell>
                                            <ABCBadge abcClass={item.abcClass} />
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
