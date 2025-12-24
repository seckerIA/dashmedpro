import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFollowUps } from '@/hooks/useFollowUps';
import { useCRM } from '@/hooks/useCRM';
import { FollowUpScheduleModal } from '@/components/crm/FollowUpScheduleModal';
import { FollowUp } from '@/types/followUp';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Search,
  Phone,
  Mail,
  MessageSquare,
  User
} from 'lucide-react';
import { format, parseISO, isPast, isToday, isFuture, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function FollowUps() {
  const { followUps, isLoading, deleteFollowUp, updateFollowUp, isDeleting } = useFollowUps();
  const { deals } = useCRM();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all');
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');

  // Filtrar follow-ups
  const filteredFollowUps = followUps.filter(followUp => {
    // Filtro por busca
    if (searchTerm) {
      const deal = deals.find(d => d.id === followUp.deal_id);
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        deal?.title?.toLowerCase().includes(searchLower) ||
        deal?.contact?.full_name?.toLowerCase().includes(searchLower) ||
        followUp.description?.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }

    // Filtro por status/tab
    const scheduledDate = parseISO(followUp.scheduled_date);
    const isOverdue = isPast(scheduledDate) && followUp.status !== 'concluido' && followUp.status !== 'cancelado';
    
    switch (selectedTab) {
      case 'pending':
        return followUp.status === 'pendente' && !isOverdue;
      case 'completed':
        return followUp.status === 'concluido';
      case 'overdue':
        return isOverdue;
      default:
        return true;
    }
  });

  // Agrupar por data
  const groupedFollowUps = filteredFollowUps.reduce((acc, followUp) => {
    const date = parseISO(followUp.scheduled_date);
    const dateKey = format(date, 'yyyy-MM-dd');
    
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(followUp);
    return acc;
  }, {} as Record<string, FollowUp[]>);

  const sortedDates = Object.keys(groupedFollowUps).sort();

  const handleComplete = async () => {
    if (!selectedFollowUp) return;

    try {
      await updateFollowUp({
        id: selectedFollowUp.id,
        data: {
          status: 'concluido',
          completed_notes: completionNotes || null,
        },
      });

      toast({
        title: 'Follow-up concluído',
        description: 'O follow-up foi marcado como concluído com sucesso.',
      });

      setShowCompleteModal(false);
      setSelectedFollowUp(null);
      setCompletionNotes('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Não foi possível concluir o follow-up.',
      });
    }
  };

  const handleDelete = async (followUpId: string) => {
    try {
      await deleteFollowUp(followUpId);
      toast({
        title: 'Follow-up removido',
        description: 'O follow-up foi removido com sucesso.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Não foi possível remover o follow-up.',
      });
    }
  };

  const handleEdit = (followUp: FollowUp) => {
    setSelectedFollowUp(followUp);
    setShowScheduleModal(true);
  };

  const handleNewFollowUp = () => {
    setSelectedFollowUp(null);
    setShowScheduleModal(true);
  };

  const getFollowUpTypeIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Phone className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (followUp: FollowUp) => {
    const scheduledDate = parseISO(followUp.scheduled_date);
    const isOverdue = isPast(scheduledDate) && followUp.status === 'pendente';

    if (followUp.status === 'concluido') {
      return <Badge variant="default" className="bg-green-500">Concluído</Badge>;
    }
    if (followUp.status === 'cancelado') {
      return <Badge variant="secondary">Cancelado</Badge>;
    }
    if (isOverdue) {
      return <Badge variant="destructive">Atrasado</Badge>;
    }
    if (isToday(scheduledDate)) {
      return <Badge variant="default" className="bg-blue-500">Hoje</Badge>;
    }
    return <Badge variant="outline">Pendente</Badge>;
  };

  const getDealInfo = (dealId: string) => {
    const deal = deals.find(d => d.id === dealId);
    return deal || null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Carregando follow-ups...</div>
      </div>
    );
  }

  const pendingCount = followUps.filter(f => f.status === 'pendente' && !isPast(parseISO(f.scheduled_date))).length;
  const completedCount = followUps.filter(f => f.status === 'concluido').length;
  const overdueCount = followUps.filter(f => {
    const date = parseISO(f.scheduled_date);
    return isPast(date) && f.status === 'pendente';
  }).length;

  return (
    <div className="min-h-screen space-y-6 bg-background pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Calendar className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-card-foreground">Follow-ups</h1>
            <p className="text-muted-foreground text-sm sm:text-lg">Gerencie seus acompanhamentos e contatos</p>
          </div>
        </div>
        <Button onClick={handleNewFollowUp} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Follow-up
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{followUps.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Concluídos</p>
                <p className="text-2xl font-bold">{completedCount}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Atrasados</p>
                <p className="text-2xl font-bold text-destructive">{overdueCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por negócio, contato ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="completed">Concluídos</TabsTrigger>
          <TabsTrigger value="overdue">Atrasados</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6">
          {sortedDates.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Nenhum follow-up encontrado.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {sortedDates.map((dateKey) => {
                const date = parseISO(dateKey);
                const followUpsForDate = groupedFollowUps[dateKey];
                
                return (
                  <div key={dateKey} className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </h3>
                    <div className="grid gap-3">
                      {followUpsForDate.map((followUp) => {
                        const deal = getDealInfo(followUp.deal_id);
                        const scheduledDateTime = parseISO(`${followUp.scheduled_date}T${followUp.scheduled_time || '09:00'}`);

                        return (
                          <Card key={followUp.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="pt-6">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {getStatusBadge(followUp)}
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                      {getFollowUpTypeIcon('call')}
                                      <span className="capitalize">Ligação</span>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h4 className="font-semibold">
                                      {deal?.title || 'Negócio não encontrado'}
                                    </h4>
                                    {deal?.contact && (
                                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                        <User className="h-3 w-3" />
                                        {deal.contact.full_name}
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      {format(scheduledDateTime, 'HH:mm')}
                                    </div>
                                    {followUp.description && (
                                      <p className="text-sm">{followUp.description}</p>
                                    )}
                                  </div>

                                  {followUp.completed_notes && (
                                    <div className="mt-2 p-2 bg-muted rounded text-sm">
                                      <p className="font-medium">Notas de conclusão:</p>
                                      <p>{followUp.completed_notes}</p>
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  {followUp.status === 'pendente' && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() => {
                                          setSelectedFollowUp(followUp);
                                          setShowCompleteModal(true);
                                        }}
                                      >
                                        <CheckCircle2 className="h-4 w-4 mr-1" />
                                        Concluir
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleEdit(followUp)}
                                      >
                                        Editar
                                      </Button>
                                    </>
                                  )}
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="sm" variant="ghost">
                                        <XCircle className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Remover Follow-up?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Esta ação não pode ser desfeita. O follow-up será permanentemente removido.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDelete(followUp.id)}
                                          disabled={isDeleting}
                                        >
                                          Remover
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <FollowUpScheduleModal
          dealId={selectedFollowUp?.deal_id || (deals[0]?.id || '')}
          dealTitle={selectedFollowUp ? (getDealInfo(selectedFollowUp.deal_id)?.title || 'Follow-up') : 'Novo Follow-up'}
          open={showScheduleModal}
          onOpenChange={(open) => {
            setShowScheduleModal(open);
            if (!open) {
              setSelectedFollowUp(null);
            }
          }}
          followUp={selectedFollowUp || undefined}
        />
      )}

      {/* Complete Modal */}
      <AlertDialog open={showCompleteModal} onOpenChange={setShowCompleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Concluir Follow-up</AlertDialogTitle>
            <AlertDialogDescription>
              Adicione notas sobre o resultado do follow-up (opcional).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="completionNotes">Notas de Conclusão</Label>
              <Textarea
                id="completionNotes"
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Descreva o resultado do follow-up..."
                rows={4}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowCompleteModal(false);
              setCompletionNotes('');
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleComplete}>
              Concluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}








