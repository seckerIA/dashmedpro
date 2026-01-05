import { useCallHistory, useCallStats } from '@/hooks/useCallHistory';
import { useActiveCall } from '@/hooks/useActiveCall';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Phone, ArrowUpRight, ArrowDownLeft, Clock, Calendar, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { CallButton } from '@/components/voip/CallButton';

export default function CallsPage() {
    const { data: calls, isLoading } = useCallHistory();
    const { data: stats } = useCallStats();
    const [dialNumber, setDialNumber] = useState('');

    return (
        <div className="container py-6 space-y-8">
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Chamadas</h1>
                    <p className="text-muted-foreground">Histórico e discador rápido.</p>
                </div>

                <div className="flex gap-2 items-center bg-card p-2 rounded-lg border shadow-sm">
                    <Input
                        placeholder="Digitar número..."
                        value={dialNumber}
                        onChange={(e) => setDialNumber(e.target.value)}
                        className="w-48 border-none bg-transparent"
                    />
                    <CallButton phoneNumber={dialNumber} disabled={!dialNumber} />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Chamadas</CardTitle>
                        <Phone className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalCalls || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Hoje</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.todayCalls || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Duração Média</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.averageDuration || 0}s</div>
                    </CardContent>
                </Card>
            </div>

            {/* List */}
            <Card>
                <CardHeader>
                    <CardTitle>Histórico Recente</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {calls?.map((call) => (
                            <div key={call.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "p-2 rounded-full",
                                        call.direction === 'inbound' ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                                    )}>
                                        {call.direction === 'inbound' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                                    </div>
                                    <div>
                                        <p className="font-medium">{call.contact_name || call.contact?.full_name || (call.direction === 'inbound' ? call.from_number : call.to_number)}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {format(new Date(call.initiated_at), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <span className={cn(
                                        "px-2 py-1 rounded-full text-xs font-medium",
                                        call.status === 'completed' ? "bg-green-100 text-green-800" :
                                            call.status === 'no_answer' ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
                                    )}>
                                        {call.status}
                                    </span>
                                    <span className="text-sm tabular-nums text-muted-foreground w-12 text-right">
                                        {call.duration_seconds > 0 ? `${Math.floor(call.duration_seconds / 60)}:${(call.duration_seconds % 60).toString().padStart(2, '0')}` : '--'}
                                    </span>

                                    <CallButton
                                        phoneNumber={call.direction === 'inbound' ? call.from_number : call.to_number}
                                        contactName={call.contact_name}
                                    />
                                </div>
                            </div>
                        ))}
                        {!isLoading && calls?.length === 0 && (
                            <div className="text-center py-10 text-muted-foreground">
                                Nenhuma chamada registrada.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
