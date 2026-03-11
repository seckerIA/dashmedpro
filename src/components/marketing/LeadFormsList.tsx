import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  RefreshCw,
  FileText,
  ChevronDown,
  ChevronRight,
  Users,
  HelpCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  User,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  Megaphone,
  Building2,
} from 'lucide-react';
import { type LeadFormSubmission } from '@/hooks/useMetaLeadForms';
import { useMetaLeadForms, useLeadFormSubmissions, type MetaLeadForm } from '@/hooks/useMetaLeadForms';
import { useAdPlatformConnections } from '@/hooks/useAdPlatformConnections';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ========================================
// Sub-component: Perguntas do formulário
// ========================================
function FormQuestions({ questions }: { questions: MetaLeadForm['questions'] }) {
  if (!questions || questions.length === 0) {
    return <p className="text-sm text-muted-foreground italic">Nenhuma pergunta configurada</p>;
  }

  return (
    <div className="space-y-2">
      {questions.map((q, idx) => (
        <div key={q.key || idx} className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground font-mono text-xs w-6 text-right">{idx + 1}.</span>
          <span className="flex-1">{q.label || q.key}</span>
          <Badge variant="outline" className="text-xs font-mono">
            {q.type || 'text'}
          </Badge>
        </div>
      ))}
    </div>
  );
}

// ========================================
// Sub-component: Detalhe de um lead (modal)
// ========================================
function LeadDetailDialog({
  submission,
  open,
  onOpenChange,
}: {
  submission: LeadFormSubmission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!submission) return null;

  const fieldData = submission.field_data || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {submission.full_name || 'Lead sem nome'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {/* Info básica */}
            <div className="grid grid-cols-1 gap-3">
              {submission.full_name && (
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground w-16">Nome</span>
                  <span className="font-medium">{submission.full_name}</span>
                </div>
              )}
              {submission.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground w-16">Email</span>
                  <span className="font-medium">{submission.email}</span>
                </div>
              )}
              {submission.phone_number && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground w-16">Telefone</span>
                  <span className="font-medium font-mono">{submission.phone_number}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground w-16">Data</span>
                <span>{format(new Date(submission.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
              </div>
              {submission.campaign_name && (
                <div className="flex items-center gap-3 text-sm">
                  <Megaphone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground w-16">Campanha</span>
                  <span>{submission.campaign_name}</span>
                </div>
              )}
              {submission.ad_name && (
                <div className="flex items-center gap-3 text-sm">
                  <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground w-16">Anúncio</span>
                  <span>{submission.ad_name}</span>
                </div>
              )}
            </div>

            {/* Status CRM */}
            <div className="flex items-center gap-2">
              {submission.is_processed ? (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Vinculado ao CRM
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <Clock className="h-3 w-3" />
                  Pendente de processamento
                </Badge>
              )}
            </div>

            <Separator />

            {/* Respostas do formulário */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Respostas do Formulário</h4>
              {fieldData.length > 0 ? (
                <div className="space-y-3">
                  {fieldData.map((field: any, idx: number) => {
                    const value = Array.isArray(field.values)
                      ? field.values.join(', ')
                      : field.values || '—';
                    return (
                      <div key={field.name || idx} className="rounded-lg bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground mb-1">
                          {field.name?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || `Campo ${idx + 1}`}
                        </p>
                        <p className="text-sm font-medium">{value}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Dados do formulário não disponíveis
                </p>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ========================================
// Sub-component: Leads de um formulário
// ========================================
function FormLeads({ formId }: { formId: string }) {
  const { data: submissions, isLoading } = useLeadFormSubmissions(formId);
  const [selectedLead, setSelectedLead] = useState<LeadFormSubmission | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!submissions || submissions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic py-2">
        Nenhum lead recebido neste formulário ainda.
      </p>
    );
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>CRM</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((sub) => (
              <TableRow
                key={sub.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedLead(sub)}
              >
                <TableCell className="font-medium text-primary hover:underline">
                  {sub.full_name || '—'}
                </TableCell>
                <TableCell className="text-sm">{sub.email || '—'}</TableCell>
                <TableCell className="text-sm font-mono">{sub.phone_number || '—'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(sub.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}
                </TableCell>
                <TableCell>
                  {sub.is_processed ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Vinculado
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="h-3 w-3" />
                      Pendente
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <LeadDetailDialog
        submission={selectedLead}
        open={!!selectedLead}
        onOpenChange={(open) => !open && setSelectedLead(null)}
      />
    </>
  );
}

// ========================================
// Sub-component: Card de um formulário
// ========================================
function FormCard({ form }: { form: MetaLeadForm }) {
  const [showQuestions, setShowQuestions] = useState(false);
  const [showLeads, setShowLeads] = useState(false);

  const statusBadge = form.status === 'active' ? (
    <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
      Ativo
    </Badge>
  ) : (
    <Badge variant="secondary">{form.status}</Badge>
  );

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-tight">{form.form_name}</CardTitle>
          {statusBadge}
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{form.leads_count} leads</span>
          </div>
          <div className="flex items-center gap-1">
            <HelpCircle className="h-4 w-4" />
            <span>{(form.questions || []).length} perguntas</span>
          </div>
        </div>

        {form.last_synced_at && (
          <p className="text-xs text-muted-foreground">
            Sync: {format(new Date(form.last_synced_at), "dd/MM HH:mm", { locale: ptBR })}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setShowLeads(!showLeads); if (!showLeads) setShowQuestions(false); }}
            className="flex-1"
          >
            <Users className="h-4 w-4 mr-1" />
            {showLeads ? 'Ocultar Leads' : 'Ver Leads'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setShowQuestions(!showQuestions); if (!showQuestions) setShowLeads(false); }}
          >
            <HelpCircle className="h-4 w-4 mr-1" />
            Perguntas
          </Button>
        </div>

        {showQuestions && (
          <div className="pt-2 border-t">
            <FormQuestions questions={form.questions} />
          </div>
        )}

        {showLeads && (
          <div className="pt-2 border-t">
            <FormLeads formId={form.meta_form_id} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ========================================
// Main Component: LeadFormsList
// ========================================
export function LeadFormsList() {
  const { forms, isLoading, syncForms, isSyncing } = useMetaLeadForms();
  const { data: connections } = useAdPlatformConnections();
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());
  const [selectedBmId, setSelectedBmId] = useState<string>('all');

  // BMs disponíveis para filtro (dedup)
  const bmOptions = useMemo(() => {
    const bms = (connections || []).filter(
      (c) => c.account_category === 'bm' && c.platform === 'meta_ads'
    );
    const seen = new Set<string>();
    return bms.filter((b) => {
      if (seen.has(b.account_id)) return false;
      seen.add(b.account_id);
      return true;
    });
  }, [connections]);

  // Pré-seleciona a BM sincronizada mais recentemente (igual à escolha em Integrações)
  useEffect(() => {
    if (!connections || connections.length === 0) return;
    const metaConns = connections.filter((c) => c.platform === 'meta_ads');

    // Para cada BM, achar o last_sync_at mais recente entre suas ad accounts
    const bmLastSync: Record<string, string> = {};
    metaConns
      .filter((c) => c.account_category === 'other' && c.parent_account_id && c.last_sync_at)
      .forEach((c) => {
        const bmId = c.parent_account_id as string;
        if (!bmLastSync[bmId] || c.last_sync_at! > bmLastSync[bmId]) {
          bmLastSync[bmId] = c.last_sync_at as string;
        }
      });

    // BM com sync mais recente
    const sortedBms = Object.entries(bmLastSync).sort(([, a], [, b]) =>
      b.localeCompare(a)
    );

    if (sortedBms.length > 0) {
      setSelectedBmId(sortedBms[0][0]);
    }
    // Roda só uma vez quando as conexões carregam
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connections !== undefined]);

  // Agrupar formulários por página
  const pageGroups = useMemo(() => {
    const pages = (connections || []).filter(
      (c) => c.account_category === 'page' && c.platform === 'meta_ads'
    );

    return pages
      .filter((page) => {
        if (selectedBmId === 'all') return true;
        return page.parent_account_id === selectedBmId;
      })
      .map((page) => {
        const rawPageId = page.account_id.replace('page_', '');
        const pageForms = forms.filter((f) => f.page_id === rawPageId);
        return {
          pageId: rawPageId,
          pageName: page.account_name,
          parentBm: page.parent_account_id,
          forms: pageForms,
        };
      });
  }, [connections, forms, selectedBmId]);

  const totalForms = forms.length;
  const totalLeads = forms.reduce((sum, f) => sum + (f.leads_count || 0), 0);

  const togglePage = (pageId: string) => {
    setExpandedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageId)) next.delete(pageId);
      else next.add(pageId);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Formulários de Captação</h2>
          <p className="text-sm text-muted-foreground">
            Formulários nativos do Meta (Instant Forms) conectados às suas páginas
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* BM Filter */}
          {bmOptions.length > 1 && (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedBmId} onValueChange={setSelectedBmId}>
                <SelectTrigger className="w-[200px] h-9">
                  <SelectValue placeholder="Filtrar por BM" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as BMs</SelectItem>
                  {bmOptions.map((bm) => (
                    <SelectItem key={bm.account_id} value={bm.account_id}>
                      {bm.account_name || bm.account_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {totalForms > 0 && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{totalForms} formulário(s)</span>
              <span>{totalLeads} leads total</span>
            </div>
          )}
          <Button onClick={() => syncForms()} disabled={isSyncing}>
            {isSyncing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sincronizar
          </Button>
        </div>
      </div>

      {/* Sem páginas conectadas */}
      {pageGroups.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="font-medium text-lg">Nenhuma página conectada</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Conecte sua conta Meta na aba Integrações para descobrir suas páginas e formulários de captação.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Sem formulários, mas com páginas */}
      {pageGroups.length > 0 && totalForms === 0 && (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="font-medium text-lg">Nenhum formulário encontrado</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              {pageGroups.length} página(s) conectada(s), mas nenhum formulário de Lead Ads foi encontrado.
              Crie um formulário no Meta Business Suite e clique em "Sincronizar".
            </p>
            <Button variant="outline" onClick={() => syncForms()} disabled={isSyncing}>
              {isSyncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Sincronizar Formulários
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Formulários agrupados por página */}
      {pageGroups.filter((g) => g.forms.length > 0).map((group) => (
        <Collapsible
          key={group.pageId}
          open={expandedPages.has(group.pageId)}
          onOpenChange={() => togglePage(group.pageId)}
        >
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedPages.has(group.pageId) ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <CardTitle className="text-base">{group.pageName || `Página ${group.pageId}`}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {group.forms.length} formulário(s) &middot;{' '}
                        {group.forms.reduce((s, f) => s + (f.leads_count || 0), 0)} leads
                      </p>
                    </div>
                  </div>
                  <a
                    href={`https://www.facebook.com/${group.pageId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {group.forms.map((form) => (
                    <FormCard key={form.id} form={form} />
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      ))}

      {/* Páginas sem formulários */}
      {pageGroups.filter((g) => g.forms.length === 0).length > 0 && totalForms > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Páginas sem formulários</h3>
          {pageGroups.filter((g) => g.forms.length === 0).map((group) => (
            <Card key={group.pageId} className="bg-muted/30">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{group.pageName || `Página ${group.pageId}`}</span>
                </div>
                <Badge variant="outline" className="text-xs">Sem formulários</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
