import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useMedicalAppointments } from '@/hooks/useMedicalAppointments';
import { useSinalReceipts } from '@/hooks/useSinalReceipts';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/currency';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Receipt,
  Clock,
  CheckCircle2,
  Eye,
  Upload,
  CircleDollarSign,
  AlertCircle,
  Calendar,
  User,
  Search,
  X,
  Loader2,
  FileImage,
  Download,
  Trash2,
} from 'lucide-react';

type SinalFilter = 'all' | 'pending' | 'paid';

export function SinalTab() {
  const { appointments, updateAppointment, isLoading } = useMedicalAppointments();
  const { uploadReceipt, isUploading, getSignedUrl } = useSinalReceipts();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [filter, setFilter] = useState<SinalFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewReceiptUrl, setViewReceiptUrl] = useState<string | null>(null);
  const [viewReceiptOpen, setViewReceiptOpen] = useState(false);
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  // Filtrar consultas com sinal
  const appointmentsWithSinal = useMemo(() => {
    return appointments.filter(
      (a) => a.sinal_amount && a.sinal_amount > 0
    );
  }, [appointments]);

  // Separar por status
  const pendingSinal = useMemo(() => {
    return appointmentsWithSinal.filter((a) => !a.sinal_paid);
  }, [appointmentsWithSinal]);

  const paidSinal = useMemo(() => {
    return appointmentsWithSinal.filter((a) => a.sinal_paid);
  }, [appointmentsWithSinal]);

  // Totais
  const totalPending = useMemo(() => {
    return pendingSinal.reduce((sum, a) => sum + (a.sinal_amount || 0), 0);
  }, [pendingSinal]);

  const totalPaid = useMemo(() => {
    return paidSinal.reduce((sum, a) => sum + (a.sinal_amount || 0), 0);
  }, [paidSinal]);

  // Filtrar lista por status e busca
  const filteredAppointments = useMemo(() => {
    let list = appointmentsWithSinal;

    if (filter === 'pending') {
      list = pendingSinal;
    } else if (filter === 'paid') {
      list = paidSinal;
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (a) =>
          a.contact?.full_name?.toLowerCase().includes(term) ||
          a.title.toLowerCase().includes(term)
      );
    }

    // Ordenar por data
    return list.sort((a, b) => {
      const dateA = new Date(a.start_time).getTime();
      const dateB = new Date(b.start_time).getTime();
      return dateB - dateA;
    });
  }, [appointmentsWithSinal, pendingSinal, paidSinal, filter, searchTerm]);

  // Visualizar comprovante
  const handleViewReceipt = async (receiptUrl: string | null | undefined) => {
    if (!receiptUrl) return;

    // Se for uma URL assinada, usar diretamente
    // Caso contrário, gerar uma URL assinada
    if (receiptUrl.includes('token=')) {
      setViewReceiptUrl(receiptUrl);
    } else {
      const filePath = receiptUrl.split('/').pop();
      if (filePath) {
        const signedUrl = await getSignedUrl(filePath);
        setViewReceiptUrl(signedUrl);
      } else {
        setViewReceiptUrl(receiptUrl);
      }
    }
    setViewReceiptOpen(true);
  };

  // Marcar sinal como pago
  const handleMarkAsPaid = async () => {
    if (!selectedAppointmentId) return;

    // Usar a URL já carregada no upload imediato se disponível
    let finalReceiptUrl = receiptUrl;

    // Se ainda não foi feito o upload, faz agora
    if (receiptFile && !finalReceiptUrl) {
      finalReceiptUrl = await uploadReceipt(receiptFile, selectedAppointmentId);
    }

    // Atualizar consulta
    await updateAppointment.mutateAsync({
      id: selectedAppointmentId,
      updates: {
        sinal_paid: true,
        sinal_paid_at: new Date().toISOString(),
        ...(finalReceiptUrl && { sinal_receipt_url: finalReceiptUrl }),
      },
    });

    // Fechar modal e limpar
    setMarkPaidOpen(false);
    setSelectedAppointmentId(null);
    setReceiptFile(null);
    setReceiptUrl(null);
  };

  const handleDownloadReceipt = async () => {
    if (!viewReceiptUrl) return;

    try {
      const response = await fetch(viewReceiptUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comprovante-sinal-${selectedAppointmentId || 'download'}.png`;

      const fileName = viewReceiptUrl.split('/').pop()?.split('?')[0] || 'comprovante';
      a.download = fileName;

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao baixar comprovante:', error);
    }
  };

  // Abrir modal para marcar como pago
  const openMarkPaidModal = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
    setReceiptFile(null);
    setMarkPaidOpen(true);
  };

  // Deletar sinal (zera o valor e remove transação financeira associada)
  const handleDeleteSinal = async (appointmentId: string) => {
    if (!confirm('Tem certeza que deseja excluir este sinal? A transação financeira associada também será removida.')) return;

    try {
      // 1. Deletar transação financeira de sinal associada
      await supabase
        .from('financial_transactions')
        .delete()
        .eq('metadata->>appointment_id', appointmentId)
        .eq('metadata->>is_sinal', 'true');

      // 2. Resetar campos de sinal na consulta
      await updateAppointment.mutateAsync({
        id: appointmentId,
        updates: {
          sinal_amount: 0,
          sinal_paid: false,
          sinal_paid_at: null as any,
          sinal_receipt_url: null as any,
        },
      });

      // 3. Invalidar queries
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['financial-accounts'] });

      toast({
        title: 'Sinal excluído',
        description: 'O sinal e a transação financeira associada foram removidos.',
      });
    } catch (error) {
      console.error('[SinalTab] Erro ao excluir sinal:', error);
      toast({
        title: 'Erro ao excluir sinal',
        description: 'Não foi possível excluir o sinal. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sinais Pendentes</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {formatCurrency(totalPending)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {pendingSinal.length} consulta{pendingSinal.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sinais Recebidos</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(totalPaid)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {paidSinal.length} consulta{paidSinal.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <CircleDollarSign className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Sinais</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(totalPending + totalPaid)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {appointmentsWithSinal.length} consulta{appointmentsWithSinal.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Todos ({appointmentsWithSinal.length})
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('pending')}
            className={filter === 'pending' ? 'bg-orange-500 hover:bg-orange-600' : ''}
          >
            <Clock className="h-4 w-4 mr-1" />
            Pendentes ({pendingSinal.length})
          </Button>
          <Button
            variant={filter === 'paid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('paid')}
            className={filter === 'paid' ? 'bg-green-500 hover:bg-green-600' : ''}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Recebidos ({paidSinal.length})
          </Button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar paciente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Gerenciamento de Sinais
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum sinal encontrado</p>
              {searchTerm && (
                <p className="text-sm">Tente buscar com outros termos</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Data Consulta</TableHead>
                    <TableHead className="text-right">Valor Consulta</TableHead>
                    <TableHead className="text-right">Sinal</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Comprovante</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {appointment.contact?.full_name || 'Sem nome'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {appointment.title}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {format(parseISO(appointment.start_time), "dd/MM/yyyy 'às' HH:mm", {
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(appointment.estimated_value || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(appointment.sinal_amount || 0)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {appointment.sinal_paid ? (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Pago
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-600 border-orange-300">
                            <Clock className="h-3 w-3 mr-1" />
                            Pendente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {appointment.sinal_receipt_url ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewReceipt(appointment.sinal_receipt_url)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4 text-blue-500" />
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {!appointment.sinal_paid && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openMarkPaidModal(appointment.id)}
                              className="h-8"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Marcar Pago
                            </Button>
                          )}
                          {appointment.sinal_paid && appointment.sinal_paid_at && (
                            <span className="text-xs text-muted-foreground">
                              {format(parseISO(appointment.sinal_paid_at), "dd/MM/yyyy", {
                                locale: ptBR,
                              })}
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSinal(appointment.id)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para visualizar comprovante */}
      <Dialog open={viewReceiptOpen} onOpenChange={setViewReceiptOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5" />
              Comprovante de Pagamento
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center min-h-[300px] bg-muted/30 rounded-lg">
            {viewReceiptUrl ? (
              viewReceiptUrl.endsWith('.pdf') ? (
                <iframe
                  src={viewReceiptUrl}
                  className="w-full h-[500px] rounded-lg"
                  title="Comprovante PDF"
                />
              ) : (
                <img
                  src={viewReceiptUrl}
                  alt="Comprovante"
                  className="max-w-full max-h-[500px] object-contain rounded-lg"
                />
              )
            ) : (
              <p className="text-muted-foreground">Carregando...</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewReceiptOpen(false)}>
              Fechar
            </Button>
            {viewReceiptUrl && (
              <>
                <Button variant="secondary" className="gap-2" onClick={handleDownloadReceipt}>
                  <Download className="h-4 w-4" />
                  Baixar
                </Button>
                <Button asChild>
                  <a href={viewReceiptUrl} target="_blank" rel="noopener noreferrer">
                    Abrir em nova aba
                  </a>
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para marcar como pago */}
      <Dialog open={markPaidOpen} onOpenChange={setMarkPaidOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Confirmar Pagamento do Sinal
            </DialogTitle>
            <DialogDescription>
              Marque o sinal como pago e opcionalmente anexe um comprovante.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="receipt">Comprovante de Pagamento (opcional)</Label>
              <Input
                id="receipt"
                type="file"
                accept="image/*,application/pdf"
                onChange={async (e) => {
                  const file = e.target.files?.[0] || null;
                  setReceiptFile(file);
                  if (file && selectedAppointmentId) {
                    const url = await uploadReceipt(file, selectedAppointmentId);
                    setReceiptUrl(url);
                  }
                }}
              />
              {receiptFile && (
                <div className="flex flex-col gap-1 mt-2">
                  <p className={cn(
                    "text-xs flex items-center gap-1.5",
                    receiptUrl ? "text-green-600" : "text-amber-600"
                  )}>
                    {isUploading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : receiptUrl ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <Upload className="h-3 w-3" />
                    )}
                    <span className="truncate max-w-[200px]">{receiptFile.name}</span>
                    • {isUploading ? "Enviando..." : receiptUrl ? "Upload concluído" : "Pronto para enviar"}
                  </p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: JPG, PNG, PDF (máx. 5MB)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMarkPaidOpen(false)}
              disabled={isUploading || updateAppointment.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleMarkAsPaid}
              disabled={isUploading || updateAppointment.isPending}
              className="bg-green-500 hover:bg-green-600"
            >
              {(isUploading || updateAppointment.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
