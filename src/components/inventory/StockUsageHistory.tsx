
import React from "react";
import { useStockUsageHistory } from "@/hooks/useStockUsageHistory";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { History, Calendar, User, Stethoscope } from "lucide-react";

export function StockUsageHistory() {
    const { data: history, isLoading } = useStockUsageHistory();

    if (isLoading) {
        return <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>;
    }

    if (!history || history.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground border rounded-lg bg-muted/20">
                <History className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>Nenhum histórico de uso registrado ainda.</p>
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Histórico de Uso em Consultas
                </CardTitle>
                <CardDescription>
                    Registro dos últimos itens consumidos em atendimentos
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data/Hora</TableHead>
                            <TableHead>Paciente</TableHead>
                            <TableHead>Item</TableHead>
                            <TableHead>Quantidade</TableHead>
                            <TableHead>Médico</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {history.map((record) => (
                            <TableRow key={record.id}>
                                <TableCell className="whitespace-nowrap">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-xs">
                                            {format(parseISO(record.created_at), "dd/MM/yyyy", { locale: ptBR })}
                                        </span>
                                        <span className="text-muted-foreground text-[10px]">
                                            {format(parseISO(record.created_at), "HH:mm")}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <User className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-sm">{record.appointment.patient_name}</span>
                                    </div>
                                    <div className="text-[10px] text-muted-foreground mt-0.5 ml-5">
                                        Consult: {record.appointment.title}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="font-medium">{record.item.name}</span>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">
                                        -{record.quantity} {record.item.unit}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1 text-muted-foreground text-xs">
                                        <Stethoscope className="h-3 w-3" />
                                        {record.appointment.doctor_name}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
