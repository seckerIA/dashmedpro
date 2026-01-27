'use client';

import { useSecretaryDoctors } from '@/hooks/useSecretaryDoctors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, ClipboardList, Loader2, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface ActivityLog {
    id: string;
    description: string;
    created_at: string;
    type: 'task_completion' | 'note' | 'status_change' | 'general';
    performer_name?: string; // Nome da secretária
}

export function SecretaryActivities() {
    const { secretaryIds, isLoading: loadingRelations } = useSecretaryDoctors();
    const supabase = createClient();

    // Fetch activities performed by my secretaries
    const { data: activities, isLoading: loadingActivities } = useQuery({
        queryKey: ['secretary-activities', secretaryIds],
        queryFn: async () => {
            if (secretaryIds.length === 0) return [];

            // We want to see logs/tasks where the performer is one of my secretaries
            // AND the task relates to one of my contacts/deals.
            // Simplified: Fetch recent 'crm_tasks' completed by secretaries OR generic logs if available.

            // Assuming we have a 'crm_activities' or using 'crm_tasks' for now.
            // Let's use 'crm_tasks' that are completed by them.

            const { data: tasks, error } = await supabase
                .from('crm_tasks')
                .select(`
                    id, 
                    title, 
                    updated_at, 
                    created_by,
                    status
                `)
                .in('created_by', secretaryIds) // Tasks created by my secretaries
                .eq('status', 'completed')
                .order('updated_at', { ascending: false })
                .limit(20);

            if (error) throw error;

            // Map tasks to a common activity format
            return tasks.map(task => ({
                id: task.id,
                description: `Concluiu a tarefa: "${task.title}"`,
                created_at: task.updated_at,
                type: 'task_completion',
                performer_name: 'Secretária' // In a real app, join with profiles to get name
            })) as ActivityLog[];
        },
        enabled: secretaryIds.length > 0,
        staleTime: 1000 * 60 * 5,
    });

    if (loadingRelations || loadingActivities) {
        return (
            <Card className="h-full border-none shadow-none bg-muted/10">
                <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
            </Card>
        );
    }

    if (!activities || activities.length === 0) {
        return (
            <Card className="h-full border-none shadow-none bg-muted/10">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-primary" />
                        Atividades da Secretaria
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground text-center py-4">
                        Nenhuma atividade recente registrada.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full border-none shadow-none bg-muted/10">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-primary" />
                    Atividades da Secretaria
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[300px] px-4 pb-4">
                    <div className="space-y-4">
                        {activities.map((activity) => (
                            <div key={activity.id} className="flex gap-3 items-start">
                                <div className="mt-1">
                                    <Avatar className="h-6 w-6">
                                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">S</AvatarFallback>
                                    </Avatar>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-foreground leading-snug">
                                        <span className="font-medium text-primary mr-1">Secretária</span>
                                        {activity.description}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-muted-foreground">
                                            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: ptBR })}
                                        </span>
                                        {activity.type === 'task_completion' && (
                                            <Badge variant="outline" className="text-[9px] h-4 px-1 py-0 border-green-200 text-green-700 bg-green-50">
                                                Feito
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
