import { useState } from 'react';
import { useLinkedDoctorProcedures } from '@/hooks/useLinkedDoctorProcedures';
import { useAuth } from '@/hooks/useAuth';
import { useSecretaryDoctors } from '@/hooks/useSecretaryDoctors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Stethoscope, Search, GripVertical } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export function ProceduresList() {
    const { procedures, isLoading } = useLinkedDoctorProcedures();
    const { user } = useAuth();
    const { doctorIds: linkedDoctorIds } = useSecretaryDoctors();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProcedures = procedures.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDragStart = (e: React.DragEvent, procedure: typeof procedures[0]) => {
        e.dataTransfer.setData('text/plain', `*${procedure.name}*\nValor: R$ ${procedure.price.toFixed(2)}`);
        e.dataTransfer.effectAllowed = 'copy';
    };

    if (isLoading) {
        return (
            <Card className="h-full border-l rounded-none">
                <CardHeader className="py-3 px-4">
                    <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full border-l rounded-none bg-background/50 backdrop-blur-sm shadow-xl w-80 flex flex-col">
            <CardHeader className="py-3 px-4 border-b">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-primary" />
                    Procedimentos Médicos
                </CardTitle>
            </CardHeader>

            <div className="p-3 border-b bg-muted/20">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar procedimento..."
                        className="pl-9 h-9 text-xs"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <ScrollArea className="flex-1 p-0">
                <div className="p-3 space-y-2">
                    {filteredProcedures.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-xs">
                            Nenhum procedimento encontrado
                        </div>
                    ) : (
                        filteredProcedures.map((proc) => (
                            <div
                                key={proc.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, proc)}
                                className="group flex flex-col gap-1 p-3 rounded-md border bg-card hover:bg-accent/50 hover:border-primary/50 cursor-grab active:cursor-grabbing transition-all shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm truncate flex items-center gap-1">
                                            <GripVertical className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                            {proc.name}
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="text-xs font-semibold shrink-0 bg-green-500/10 text-green-600 dark:text-green-400 dark:bg-green-500/20">
                                        R$ {proc.price.toFixed(2)}
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-between mt-1 pl-4">
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 truncate max-w-[120px]">
                                        {proc.doctor_name}
                                    </span>
                                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 border px-1 rounded">
                                        {proc.category === 'consultation' ? 'Consulta' :
                                            proc.category === 'exam' ? 'Exame' :
                                                proc.category === 'surgery' ? 'Cirurgia' : 'Proc.'}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>

            <div className="p-2 border-t bg-muted/20 text-[10px] text-center text-muted-foreground">
                Arraste um item para o chat para enviar

                {/* Debug Info - Remover em produção */}
                <div className="mt-2 text-left border-t pt-2 text-[10px] text-muted-foreground/50 opacity-50 hover:opacity-100 transition-opacity">
                    <p>Debug:</p>
                    <p>User ID: {user?.id || 'N/A'}</p>
                    <p>Procedures Count: {procedures.length}</p>
                    <p>Linked IDs Found: {linkedDoctorIds?.length || 0}</p>
                    <p>Distinct Docs in Procs: {procedures.map(p => p.doctor_name).filter((v, i, a) => a.indexOf(v) === i).length}</p>
                </div>
            </div>
        </Card>
    );
}
