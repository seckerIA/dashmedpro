/**
 * Página completa de Follow-Up Automatizado
 * Dashboard com métricas em tempo real, fila de envios, respostas e análise IA
 */

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSecretaryDoctors } from '@/hooks/useSecretaryDoctors';
import { useAutomatedFollowUps } from '@/hooks/useAutomatedFollowUps';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';

// Icons
import {
  Plus,
  BarChart3,
  Calendar,
  MessageSquare,
  Settings,
  Clock,
  Send,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Meh,
  Timer,
  Sparkles,
  User,
  Phone,
  Search,
  Filter,
  MoreVertical,
  Trash2,
  RefreshCw,
  Zap,
  Star,
  ChevronRight,
  Activity,
  Target,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Play,
  Pause,
  Eye,
} from 'lucide-react';

// Utils
import { format, formatDistanceToNow, differenceInMinutes, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Components
import { TemplateFormDialog } from '@/components/followup/TemplateFormDialog';
import { FollowUpSettingsTab } from '@/components/followup/FollowUpSettingsTab';

// ============================================
// TYPES
// ============================================

interface FollowUpQueueItem {
  id: string;
  scheduled_for: string;
  channel: string;
  status: string;
  message_template: string;
  created_at: string;
  contact: {
    id: string;
    full_name: string;
    phone: string;
  } | null;
  template: {
    id: string;
    name: string;
    trigger_type: string;
    delay_minutes: number;
  } | null;
}

interface FollowUpResponse {
  id: string;
  nps_score: number | null;
  csat_score: number | null;
  feedback_text: string | null;
  sentiment: 'positive' | 'neutral' | 'negative' | null;
  ai_summary: string | null;
  ai_analyzed: boolean;
  requires_follow_up: boolean;
  responded_at: string;
  contact: {
    id: string;
    full_name: string;
    phone: string;
  } | null;
  scheduled: {
    template: {
      name: string;
      trigger_type: string;
    } | null;
  } | null;
}

interface TemplateItem {
  id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  channel: string;
  delay_minutes: number;
  message_template: string;
  include_nps: boolean;
  include_csat: boolean;
  is_active: boolean;
  created_at: string;
  send_count: number;
  response_count: number;
}

// ============================================
// COUNTDOWN TIMER COMPONENT
// ============================================

function CountdownTimer({ targetDate, compact = false }: { targetDate: string; compact?: boolean }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, total: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const target = new Date(targetDate).getTime();
      const now = Date.now();
      const diff = Math.max(0, target - now);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, total: diff });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (timeLeft.total === 0) {
    return (
      <Badge variant="default" className="bg-green-500 animate-pulse">
        <Send className="h-3 w-3 mr-1" />
        Enviando...
      </Badge>
    );
  }

  if (compact) {
    if (timeLeft.hours > 0) {
      return (
        <span className="font-mono text-sm">
          {timeLeft.hours}h {timeLeft.minutes}m
        </span>
      );
    }
    return (
      <span className="font-mono text-sm text-orange-500">
        {timeLeft.minutes}m {timeLeft.seconds}s
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Timer className={cn("h-4 w-4", timeLeft.hours === 0 && "text-orange-500 animate-pulse")} />
      <div className="flex gap-1 font-mono">
        {timeLeft.hours > 0 && (
          <>
            <span className="bg-muted px-2 py-1 rounded text-sm font-bold">{String(timeLeft.hours).padStart(2, '0')}</span>
            <span className="text-muted-foreground">:</span>
          </>
        )}
        <span className="bg-muted px-2 py-1 rounded text-sm font-bold">{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span className="text-muted-foreground">:</span>
        <span className={cn("bg-muted px-2 py-1 rounded text-sm font-bold", timeLeft.hours === 0 && "text-orange-500")}>
          {String(timeLeft.seconds).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}

// ============================================
// NPS GAUGE COMPONENT
// ============================================

function NPSGauge({ score, size = 'lg' }: { score: number; size?: 'sm' | 'lg' }) {
  const normalizedScore = ((score + 100) / 200) * 100; // -100 to 100 -> 0 to 100
  const color = score >= 50 ? 'text-green-500' : score >= 0 ? 'text-yellow-500' : 'text-red-500';
  const bgColor = score >= 50 ? 'bg-green-500' : score >= 0 ? 'bg-yellow-500' : 'bg-red-500';
  const label = score >= 75 ? 'Excelente' : score >= 50 ? 'Muito Bom' : score >= 0 ? 'Bom' : score >= -50 ? 'Ruim' : 'Crítico';

  if (size === 'sm') {
    return (
      <div className="flex items-center gap-2">
        <span className={cn("text-2xl font-bold", color)}>{score.toFixed(0)}</span>
        <Badge variant="outline" className={cn("text-xs", color)}>{label}</Badge>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex flex-col items-center">
        <div className={cn("text-5xl font-bold", color)}>{score.toFixed(0)}</div>
        <div className="text-sm text-muted-foreground mt-1">{label}</div>
        <div className="w-full mt-3">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", bgColor)}
              style={{ width: `${normalizedScore}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>-100</span>
            <span>0</span>
            <span>+100</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// SENTIMENT INDICATOR
// ============================================

function SentimentIndicator({ sentiment, showLabel = true }: { sentiment: string | null; showLabel?: boolean }) {
  const config: Record<string, { icon: typeof ThumbsUp; color: string; bg: string; label: string }> = {
    positive: { icon: ThumbsUp, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Positivo' },
    neutral: { icon: Minus, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Neutro' },
    negative: { icon: ThumbsDown, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Negativo' },
  };

  const { icon: Icon, color, bg, label } = config[sentiment || 'neutral'] || config.neutral;

  return (
    <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-full", bg)}>
      <Icon className={cn("h-3.5 w-3.5", color)} />
      {showLabel && <span className={cn("text-xs font-medium", color)}>{label}</span>}
    </div>
  );
}

// ============================================
// TRIGGER TYPE BADGE
// ============================================

function TriggerTypeBadge({ type }: { type: string }) {
  const labels: Record<string, { label: string; color: string }> = {
    pre_appointment: { label: 'Pré-Consulta', color: 'bg-blue-500/10 text-blue-500' },
    post_appointment_immediate: { label: 'Pós-Consulta', color: 'bg-green-500/10 text-green-500' },
    post_appointment_7d: { label: '7 dias', color: 'bg-purple-500/10 text-purple-500' },
    post_appointment_30d: { label: '30 dias', color: 'bg-indigo-500/10 text-indigo-500' },
    post_treatment: { label: 'Pós-Tratamento', color: 'bg-teal-500/10 text-teal-500' },
    payment_reminder: { label: 'Pagamento', color: 'bg-orange-500/10 text-orange-500' },
    inactive_patient: { label: 'Inativo', color: 'bg-gray-500/10 text-gray-500' },
    birthday: { label: 'Aniversário', color: 'bg-pink-500/10 text-pink-500' },
    custom: { label: 'Personalizado', color: 'bg-cyan-500/10 text-cyan-500' },
  };

  const { label, color } = labels[type] || labels.custom;

  return <Badge variant="outline" className={cn("text-xs", color)}>{label}</Badge>;
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function FollowUpPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { linkedDoctorIds } = useSecretaryDoctors();
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // User IDs for queries
  const userIds = useMemo(() => {
    if (!user) return [];
    const ids = [user.id];
    if (linkedDoctorIds?.length) {
      ids.push(...linkedDoctorIds);
    }
    return ids;
  }, [user, linkedDoctorIds]);

  // ==========================================
  // DATA QUERIES
  // ==========================================

  // Queue (scheduled follow-ups)
  const { data: queueData, isLoading: isLoadingQueue, refetch: refetchQueue } = useQuery({
    queryKey: ['followup-queue', userIds, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('followup_scheduled')
        .select(`
          id,
          scheduled_for,
          channel,
          status,
          message_template,
          created_at,
          contact:crm_contacts(id, full_name, phone),
          template:followup_templates(id, name, trigger_type, delay_minutes)
        `)
        .in('user_id', userIds)
        .order('scheduled_for', { ascending: true });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      } else {
        query = query.in('status', ['pending', 'sent']);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return (data || []) as FollowUpQueueItem[];
    },
    enabled: userIds.length > 0,
    refetchInterval: 30000,
  });

  // Responses
  const { data: responsesData, isLoading: isLoadingResponses } = useQuery({
    queryKey: ['followup-responses', userIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('followup_responses')
        .select(`
          id,
          nps_score,
          csat_score,
          feedback_text,
          sentiment,
          ai_summary,
          ai_analyzed,
          requires_follow_up,
          responded_at,
          contact:crm_contacts(id, full_name, phone),
          scheduled:followup_scheduled(
            template:followup_templates(name, trigger_type)
          )
        `)
        .in('user_id', userIds)
        .order('responded_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as FollowUpResponse[];
    },
    enabled: userIds.length > 0,
  });

  // Templates with stats
  const { data: templatesData, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['followup-templates-stats', userIds],
    queryFn: async () => {
      const { data: templates, error } = await supabase
        .from('followup_templates')
        .select('*')
        .in('user_id', userIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get stats for each template
      const templatesWithStats = await Promise.all(
        (templates || []).map(async (template) => {
          const { count: sendCount } = await supabase
            .from('followup_scheduled')
            .select('*', { count: 'exact', head: true })
            .eq('template_id', template.id)
            .in('status', ['sent', 'responded']);

          const { count: responseCount } = await supabase
            .from('followup_scheduled')
            .select('*', { count: 'exact', head: true })
            .eq('template_id', template.id)
            .eq('status', 'responded');

          return {
            ...template,
            send_count: sendCount || 0,
            response_count: responseCount || 0,
          };
        })
      );

      return templatesWithStats as TemplateItem[];
    },
    enabled: userIds.length > 0,
  });

  // Dashboard metrics
  const { data: metrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['followup-metrics', userIds],
    queryFn: async () => {
      const now = new Date();
      const last7Days = subDays(now, 7);
      const last30Days = subDays(now, 30);

      // Pending count
      const { count: pending } = await supabase
        .from('followup_scheduled')
        .select('*', { count: 'exact', head: true })
        .in('user_id', userIds)
        .eq('status', 'pending');

      // Sent last 7 days
      const { count: sentLast7Days } = await supabase
        .from('followup_scheduled')
        .select('*', { count: 'exact', head: true })
        .in('user_id', userIds)
        .eq('status', 'sent')
        .gte('sent_at', last7Days.toISOString());

      // Responses last 7 days
      const { data: recentResponses } = await supabase
        .from('followup_responses')
        .select('nps_score, csat_score, sentiment, requires_follow_up')
        .in('user_id', userIds)
        .gte('responded_at', last7Days.toISOString());

      // Calculate NPS
      const npsScores = recentResponses?.filter(r => r.nps_score !== null) || [];
      const promoters = npsScores.filter(r => r.nps_score! >= 9).length;
      const detractors = npsScores.filter(r => r.nps_score! <= 6).length;
      const passives = npsScores.length - promoters - detractors;
      const npsScore = npsScores.length > 0
        ? ((promoters - detractors) / npsScores.length) * 100
        : 0;

      // CSAT average
      const csatScores = recentResponses?.filter(r => r.csat_score !== null) || [];
      const csatAverage = csatScores.length > 0
        ? csatScores.reduce((sum, r) => sum + r.csat_score!, 0) / csatScores.length
        : 0;

      // Response rate
      const responseRate = sentLast7Days && sentLast7Days > 0
        ? ((recentResponses?.length || 0) / sentLast7Days) * 100
        : 0;

      // Sentiment breakdown
      const sentimentBreakdown = {
        positive: recentResponses?.filter(r => r.sentiment === 'positive').length || 0,
        neutral: recentResponses?.filter(r => r.sentiment === 'neutral').length || 0,
        negative: recentResponses?.filter(r => r.sentiment === 'negative').length || 0,
      };

      // Requires action
      const requiresAction = recentResponses?.filter(r => r.requires_follow_up).length || 0;

      return {
        pending: pending || 0,
        sentLast7Days: sentLast7Days || 0,
        totalResponses: recentResponses?.length || 0,
        responseRate,
        nps: {
          score: npsScore,
          promoters,
          passives,
          detractors,
          total: npsScores.length,
        },
        csat: {
          average: csatAverage,
          total: csatScores.length,
        },
        sentiment: sentimentBreakdown,
        requiresAction,
      };
    },
    enabled: userIds.length > 0,
    refetchInterval: 60000,
  });

  // ==========================================
  // REALTIME SUBSCRIPTIONS
  // ==========================================

  useEffect(() => {
    if (!userIds.length) return;

    const channel = supabase
      .channel('followup-page-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'followup_scheduled' }, () => {
        queryClient.invalidateQueries({ queryKey: ['followup-queue'] });
        queryClient.invalidateQueries({ queryKey: ['followup-metrics'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'followup_responses' }, () => {
        queryClient.invalidateQueries({ queryKey: ['followup-responses'] });
        queryClient.invalidateQueries({ queryKey: ['followup-metrics'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'followup_templates' }, () => {
        queryClient.invalidateQueries({ queryKey: ['followup-templates-stats'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userIds, queryClient]);

  // ==========================================
  // HANDLERS
  // ==========================================

  const { cancelScheduled, updateTemplate, deleteTemplate, createDefaultTemplates } = useAutomatedFollowUps();

  const handleCancelFollowUp = async () => {
    if (!selectedItemId) return;
    try {
      await cancelScheduled(selectedItemId);
      toast({ title: 'Follow-up cancelado com sucesso' });
      setCancelDialogOpen(false);
      setSelectedItemId(null);
    } catch (error) {
      toast({ title: 'Erro ao cancelar', variant: 'destructive' });
    }
  };

  const handleToggleTemplate = async (template: TemplateItem) => {
    try {
      await updateTemplate({
        id: template.id,
        updates: { is_active: !template.is_active },
      });
      toast({
        title: template.is_active ? 'Template desativado' : 'Template ativado',
      });
    } catch (error) {
      toast({ title: 'Erro ao atualizar template', variant: 'destructive' });
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await deleteTemplate(id);
      toast({ title: 'Template excluído' });
    } catch (error) {
      toast({ title: 'Erro ao excluir', variant: 'destructive' });
    }
  };

  // Filter queue items
  const filteredQueue = useMemo(() => {
    if (!queueData) return [];
    if (!searchTerm) return queueData;

    const term = searchTerm.toLowerCase();
    return queueData.filter(item =>
      item.contact?.full_name?.toLowerCase().includes(term) ||
      item.contact?.phone?.includes(term) ||
      item.template?.name?.toLowerCase().includes(term)
    );
  }, [queueData, searchTerm]);

  // Next follow-up
  const nextFollowUp = useMemo(() => {
    return queueData?.find(item => item.status === 'pending');
  }, [queueData]);

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Zap className="h-6 w-6 text-yellow-500" />
                Follow-Up Center
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Automação de acompanhamento com análise de satisfação
              </p>
            </div>
            <div className="flex items-center gap-3">
              {(templatesData?.length === 0) && (
                <Button variant="outline" onClick={() => createDefaultTemplates()}>
                  <Settings className="h-4 w-4 mr-2" />
                  Criar Templates Padrão
                </Button>
              )}
              <Button onClick={() => setIsTemplateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Template
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6 space-y-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* NPS Card */}
          <Card className="col-span-1 md:col-span-2 lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                NPS Score
                <Target className="h-4 w-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingMetrics ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <NPSGauge score={metrics?.nps.score || 0} />
              )}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-500">{metrics?.nps.promoters || 0}</div>
                  <div className="text-[10px] text-muted-foreground">Promotores</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-500">{metrics?.nps.passives || 0}</div>
                  <div className="text-[10px] text-muted-foreground">Neutros</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-500">{metrics?.nps.detractors || 0}</div>
                  <div className="text-[10px] text-muted-foreground">Detratores</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Response Rate Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                Taxa de Resposta
                <MessageSquare className="h-4 w-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingMetrics ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <>
                  <div className="text-4xl font-bold">
                    {metrics?.responseRate.toFixed(0)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {metrics?.totalResponses} de {metrics?.sentLast7Days} (7 dias)
                  </p>
                  <Progress value={metrics?.responseRate || 0} className="h-2 mt-3" />
                </>
              )}
            </CardContent>
          </Card>

          {/* CSAT Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                CSAT Médio
                <Star className="h-4 w-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingMetrics ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">{metrics?.csat.average.toFixed(1)}</span>
                    <span className="text-muted-foreground">/5</span>
                  </div>
                  <div className="flex gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "h-4 w-4",
                          star <= Math.round(metrics?.csat.average || 0)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted"
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {metrics?.csat.total} avaliações
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Pending Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                Na Fila
                <Clock className="h-4 w-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingMetrics ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <>
                  <div className="text-4xl font-bold text-orange-500">
                    {metrics?.pending || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    aguardando envio
                  </p>
                  {nextFollowUp && (
                    <div className="mt-3 p-2 bg-muted rounded-lg">
                      <div className="text-[10px] text-muted-foreground mb-1">Próximo:</div>
                      <CountdownTimer targetDate={nextFollowUp.scheduled_for} compact />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alert for actions required */}
        {metrics?.requiresAction ? (
          <Card className="border-red-500/50 bg-red-500/5">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-medium text-red-500">
                      {metrics.requiresAction} resposta(s) requerem atenção
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Pacientes com feedback negativo ou solicitação de contato
                    </p>
                  </div>
                </div>
                <Button variant="destructive" size="sm">
                  Ver Agora
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Main Content Tabs */}
        <Tabs defaultValue="queue" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="queue" className="gap-2">
                <Clock className="h-4 w-4" />
                Fila de Envio
                <Badge variant="secondary" className="ml-1">{filteredQueue.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="responses" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                Respostas
                <Badge variant="secondary" className="ml-1">{responsesData?.length || 0}</Badge>
              </TabsTrigger>
              <TabsTrigger value="templates" className="gap-2">
                <Settings className="h-4 w-4" />
                Templates
                <Badge variant="secondary" className="ml-1">{templatesData?.length || 0}</Badge>
              </TabsTrigger>
              <TabsTrigger value="insights" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Insights IA
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="h-4 w-4" />
                Configurações
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => refetchQueue()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Queue Tab */}
          <TabsContent value="queue" className="space-y-4">
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="sent">Enviados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoadingQueue ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : filteredQueue.length === 0 ? (
              <Card className="p-12 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-semibold">Nenhum follow-up na fila</h3>
                <p className="text-muted-foreground mt-1">
                  Os follow-ups serão criados automaticamente após consultas
                </p>
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredQueue.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-2 rounded-full",
                          item.status === 'pending' ? 'bg-orange-500/10' : 'bg-green-500/10'
                        )}>
                          {item.status === 'pending' ? (
                            <Clock className="h-5 w-5 text-orange-500" />
                          ) : (
                            <Send className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.contact?.full_name || 'Sem nome'}</span>
                            <TriggerTypeBadge type={item.template?.trigger_type || 'custom'} />
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {item.contact?.phone}
                            </span>
                            <span>•</span>
                            <span>{item.template?.name}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {item.status === 'pending' ? (
                          <CountdownTimer targetDate={item.scheduled_for} />
                        ) : (
                          <Badge variant="outline" className="text-green-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Enviado
                          </Badge>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Mensagem
                            </DropdownMenuItem>
                            {item.status === 'pending' && (
                              <DropdownMenuItem
                                className="text-red-500"
                                onClick={() => {
                                  setSelectedItemId(item.id);
                                  setCancelDialogOpen(true);
                                }}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancelar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Responses Tab */}
          <TabsContent value="responses" className="space-y-4">
            {isLoadingResponses ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : responsesData?.length === 0 ? (
              <Card className="p-12 text-center">
                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">Nenhuma resposta ainda</h3>
                <p className="text-muted-foreground mt-1">
                  As respostas dos pacientes aparecerão aqui
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {responsesData?.map((response) => (
                  <Card
                    key={response.id}
                    className={cn(
                      "p-4",
                      response.requires_follow_up && "border-red-500/50 bg-red-500/5"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{response.contact?.full_name}</span>
                          </div>
                          <SentimentIndicator sentiment={response.sentiment} />
                          {response.requires_follow_up && (
                            <Badge variant="destructive" className="text-xs">
                              Requer Ação
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 mt-2">
                          {response.nps_score !== null && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">NPS:</span>
                              <span className={cn(
                                "text-lg font-bold",
                                response.nps_score >= 9 ? 'text-green-500' :
                                response.nps_score >= 7 ? 'text-yellow-500' : 'text-red-500'
                              )}>
                                {response.nps_score}
                              </span>
                            </div>
                          )}
                          {response.csat_score !== null && (
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={cn(
                                    "h-4 w-4",
                                    star <= response.csat_score!
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-muted"
                                  )}
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        {response.feedback_text && (
                          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm italic">"{response.feedback_text}"</p>
                          </div>
                        )}

                        {response.ai_analyzed && response.ai_summary && (
                          <div className="mt-3 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                            <div className="flex items-center gap-2 mb-1">
                              <Sparkles className="h-4 w-4 text-purple-500" />
                              <span className="text-xs font-medium text-purple-500">Análise IA</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{response.ai_summary}</p>
                          </div>
                        )}
                      </div>

                      <div className="text-right ml-4">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(response.responded_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                        {response.scheduled?.template && (
                          <div className="mt-1">
                            <TriggerTypeBadge type={response.scheduled.template.trigger_type} />
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            {isLoadingTemplates ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-48 w-full" />
                ))}
              </div>
            ) : templatesData?.length === 0 ? (
              <Card className="p-12 text-center">
                <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">Nenhum template configurado</h3>
                <p className="text-muted-foreground mt-1 mb-4">
                  Crie templates para automatizar o envio de follow-ups
                </p>
                <Button onClick={() => createDefaultTemplates()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Templates Padrão
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templatesData?.map((template) => (
                  <Card key={template.id} className={cn(!template.is_active && "opacity-60")}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          {template.description && (
                            <CardDescription className="text-xs mt-1">
                              {template.description}
                            </CardDescription>
                          )}
                        </div>
                        <Badge variant={template.is_active ? 'default' : 'secondary'}>
                          {template.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <TriggerTypeBadge type={template.trigger_type} />
                        <Badge variant="outline" className="text-xs">
                          {template.channel === 'whatsapp' ? 'WhatsApp' : template.channel}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {template.delay_minutes >= 0 ? '+' : ''}{template.delay_minutes}min
                        </Badge>
                        {template.include_nps && (
                          <Badge variant="outline" className="text-xs text-green-500">NPS</Badge>
                        )}
                        {template.include_csat && (
                          <Badge variant="outline" className="text-xs text-yellow-500">CSAT</Badge>
                        )}
                      </div>

                      <div className="p-2 bg-muted/50 rounded text-xs text-muted-foreground line-clamp-2">
                        {template.message_template}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Send className="h-3 w-3" />
                            {template.send_count} enviados
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {template.response_count} respostas
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleTemplate(template)}
                          >
                            {template.is_active ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => handleDeleteTemplate(template.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Sentiment Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Sentimento (7 dias)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ThumbsUp className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Positivo</span>
                      </div>
                      <span className="font-bold text-green-500">{metrics?.sentiment.positive || 0}</span>
                    </div>
                    <Progress
                      value={metrics?.totalResponses ? (metrics.sentiment.positive / metrics.totalResponses) * 100 : 0}
                      className="h-2"
                    />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Minus className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">Neutro</span>
                      </div>
                      <span className="font-bold text-yellow-500">{metrics?.sentiment.neutral || 0}</span>
                    </div>
                    <Progress
                      value={metrics?.totalResponses ? (metrics.sentiment.neutral / metrics.totalResponses) * 100 : 0}
                      className="h-2"
                    />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ThumbsDown className="h-4 w-4 text-red-500" />
                        <span className="text-sm">Negativo</span>
                      </div>
                      <span className="font-bold text-red-500">{metrics?.sentiment.negative || 0}</span>
                    </div>
                    <Progress
                      value={metrics?.totalResponses ? (metrics.sentiment.negative / metrics.totalResponses) * 100 : 0}
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* AI Summaries */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    Análises Recentes da IA
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {responsesData?.filter(r => r.ai_summary).slice(0, 5).map((response) => (
                        <div
                          key={response.id}
                          className="p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">{response.contact?.full_name}</span>
                            <SentimentIndicator sentiment={response.sentiment} showLabel={false} />
                          </div>
                          <p className="text-xs text-muted-foreground">{response.ai_summary}</p>
                        </div>
                      ))}
                      {!responsesData?.filter(r => r.ai_summary).length && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Nenhuma análise IA disponível</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <FollowUpSettingsTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Cancel Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Follow-Up</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar este follow-up? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelFollowUp} className="bg-red-500 hover:bg-red-600">
              Cancelar Follow-Up
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Template Dialog */}
      <TemplateFormDialog
        open={isTemplateDialogOpen}
        onOpenChange={setIsTemplateDialogOpen}
      />
    </div>
  );
}
