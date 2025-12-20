import { useState } from 'react';
import { useHistoricalReports } from '@/hooks/useHistoricalReports';
import { useTeamMembersForAdmin } from '@/hooks/useTeamMembersForAdmin';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, Calendar, Users, Target, TrendingUp, Clock, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HistoricalReportsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HistoricalReportsPanel({ isOpen, onClose }: HistoricalReportsPanelProps) {
  const { isAdmin } = useUserProfile();
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    userId: 'all',
  });

  const { reports, stats, isLoading, exportToCSV } = useHistoricalReports(filters);
  const { teamMembers, isLoading: isLoadingTeam } = useTeamMembersForAdmin();

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      userId: 'all',
    });
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string, isPaused: boolean | null) => {
    if (status === 'completed') {
      return <Badge variant="default" className="bg-green-500">Finalizado</Badge>;
    } else if (isPaused) {
      return <Badge variant="secondary">Pausado</Badge>;
    } else {
      return <Badge variant="outline">Ativo</Badge>;
    }
  };

  const getConversionRate = (calls: number | null, contacts: number | null) => {
    if (!calls || calls === 0) return 0;
    return ((contacts || 0) / calls) * 100;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Relatórios Históricos
          </DialogTitle>
          <DialogDescription>
            Visualize e analise o histórico de performance da equipe
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-4 w-4" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Data Inicial</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Data Final</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  />
                </div>
                {isAdmin && (
                  <div className="space-y-2">
                    <Label htmlFor="userId">Usuário</Label>
                    <Select value={filters.userId || 'all'} onValueChange={(value) => handleFilterChange('userId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os usuários" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os usuários</SelectItem>
                        {teamMembers?.filter((m) => !!m?.id).map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.full_name || member.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <Button onClick={clearFilters} variant="outline" size="sm" className="gap-2">
                    <X className="h-4 w-4" />
                    Limpar
                  </Button>
                  <Button onClick={exportToCSV} className="gap-2" size="sm">
                    <Download className="h-4 w-4" />
                    Exportar CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Total de Relatórios</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{stats.totalReports}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Total Atendimentos</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{stats.totalCalls}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Total Contatos</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{stats.totalContacts}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">Taxa Conversão</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{stats.conversionRate.toFixed(2)}%</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Melhor Dia */}
          {stats?.bestDay && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Melhor Dia de Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Data: {formatDate(stats.bestDay.date)}</p>
                    <p className="text-lg font-semibold">
                      {stats.bestDay.calls} atendimentos • {stats.bestDay.contacts} contatos
                    </p>
                  </div>
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    {stats.bestDay.calls + stats.bestDay.contacts} total
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de Relatórios */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Relatórios</CardTitle>
              <CardDescription>
                {reports?.length || 0} relatórios encontrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Carregando relatórios...</p>
                </div>
              ) : reports && reports.length > 0 ? (
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <Card key={report.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-4">
                              <h3 className="font-semibold">{formatDate(report.date)}</h3>
                              {getStatusBadge(report.status, report.is_paused)}
                              {isAdmin && (
                                <Badge variant="outline" className="text-xs">
                                  {report.user_profile?.full_name || report.user_profile?.email}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Meta Atendimentos</p>
                                <p className="font-medium">{report.goal_calls}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Meta Contatos</p>
                                <p className="font-medium">{report.goal_contacts}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Atendimentos</p>
                                <p className="font-medium">{report.final_calls || 0}</p>
                                <Progress 
                                  value={(report.final_calls || 0) / report.goal_calls * 100} 
                                  className="h-1 mt-1"
                                />
                              </div>
                              <div>
                                <p className="text-muted-foreground">Contatos</p>
                                <p className="font-medium">{report.final_contacts || 0}</p>
                                <Progress 
                                  value={(report.final_contacts || 0) / report.goal_contacts * 100} 
                                  className="h-1 mt-1"
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Taxa: {getConversionRate(report.final_calls, report.final_contacts).toFixed(1)}%</span>
                              <span>•</span>
                              <span>Iniciado: {formatDateTime(report.started_at)}</span>
                              {report.finished_at && (
                                <>
                                  <span>•</span>
                                  <span>Finalizado: {formatDateTime(report.finished_at)}</span>
                                </>
                              )}
                              {report.total_paused_time && report.total_paused_time > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Pausado: {Math.round(report.total_paused_time / 60)}min
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum relatório encontrado</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ajuste os filtros ou aguarde novos relatórios
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
