import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { useSecretarySinalMetrics } from '@/hooks/useSecretarySinalMetrics';
import { useMedicalAppointments } from '@/hooks/useMedicalAppointments';
import { useSinalReceipts } from '@/hooks/useSinalReceipts';
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
  ArrowLeft,
  DollarSign,
  Download,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';

type SinalFilter = 'all' | 'pending' | 'paid';

export default function SecretaryFinancial() {
  const navigate = useNavigate();
  const { isSecretaria } = useUserProfile();
  const { data: sinalMetrics, isLoading: isLoadingMetrics } = useSecretarySinalMetrics();
  const { updateAppointment } = useMedicalAppointments();
  const { uploadReceipt, isUploading, getSignedUrl } = useSinalReceipts();

  const [filter, setFilter] = useState<SinalFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewReceiptUrl, setViewReceiptUrl] = useState<string | null>(null);
  const [viewReceiptOpen, setViewReceiptOpen] = useState(false);
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  // Redirecionar se não for secretária
  if (!isSecretaria) {
    navigate('/');
    return null;
  }

  // Filtrar lista por status e busca
  const filteredAppointments = useMemo(() => {
    if (!sinalMetrics) return [];

    let list = sinalMetrics.appointments;

    if (filter === 'pending') {
      list = list.filter(a => !a.sinalPaid);
    } else if (filter === 'paid') {
      list = list.filter(a => a.sinalPaid);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (a) =>
          a.patientName.toLowerCase().includes(term) ||
          a.doctorName.toLowerCase().includes(term)
      );
    }

    // Ordenar por data
    return list.sort((a, b) => {
      const dateA = new Date(a.appointmentDate).getTime();
      const dateB = new Date(b.appointmentDate).getTime();
      return dateB - dateA;
    });
  }, [sinalMetrics, filter, searchTerm]);

  // Visualizar comprovante
  const handleViewReceipt = async (receiptUrl: string | null | undefined) => {
    if (!receiptUrl) return;

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

    let receiptUrl: string | null = null;

    if (receiptFile) {
      receiptUrl = await uploadReceipt(receiptFile, selectedAppointmentId);
    }

    await updateAppointment.mutateAsync({
      id: selectedAppointmentId,
      updates: {
        sinal_paid: true,
        sinal_paid_at: new Date().toISOString(),
        ...(receiptUrl && { sinal_receipt_url: receiptUrl }),
      },
    });

    setMarkPaidOpen(false);
    setSelectedAppointmentId(null);
    setReceiptFile(null);
  };

  const handleDownloadReceipt = async () => {
    if (!viewReceiptUrl) return;

    try {
      const response = await fetch(viewReceiptUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comprovante-sinal-${selectedAppointmentId || 'download'}.png`; // Tenta adivinhar extensão ou usa default

      // Tenta pegar o nome do arquivo da URL
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

  const openMarkPaidModal = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
    setReceiptFile(null);
    setMarkPaidOpen(true);
  };

  if (isLoadingMetrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!sinalMetrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
        <p className="ml-2 text-muted-foreground">Erro ao carregar dados</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-background font-sans px-3 sm:px-4 lg:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Receipt className="h-6 w-6" />
              Mini Financeiro - Sinais
            </h1>
            <p className="text-sm text-muted-foreground">
              Gerencie os sinais das consultas
            </p>
          </div>
        </div>
      </div>

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
                  {formatCurrency(sinalMetrics.totalPending)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {sinalMetrics.pendingCount} consulta{sinalMetrics.pendingCount !== 1 ? 's' : ''}
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
                  {formatCurrency(sinalMetrics.totalPaid)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {sinalMetrics.paidCount} consulta{sinalMetrics.paidCount !== 1 ? 's' : ''}
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
                  {formatCurrency(sinalMetrics.totalSinal)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {sinalMetrics.totalCount} consulta{sinalMetrics.totalCount !== 1 ? 's' : ''}
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
            Todos ({sinalMetrics.totalCount})
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('pending')}
            className={filter === 'pending' ? 'bg-orange-500 hover:bg-orange-600' : ''}
          >
            <Clock className="h-4 w-4 mr-1" />
            Pendentes ({sinalMetrics.pendingCount})
          </Button>
          <Button
            variant={filter === 'paid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('paid')}
            className={filter === 'paid' ? 'bg-green-500 hover:bg-green-600' : ''}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Recebidos ({sinalMetrics.paidCount})
          </Button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar paciente ou médico..."
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
            Consultas com Sinal
          </CardTitle>
          <CardDescription>
            Lista de consultas com sinal configurado. Informações sobre pagamento e valores.
          </CardDescription>
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
                    <TableHead>Médico</TableHead>
                    <TableHead>Data Consulta</TableHead>
                    <TableHead className="text-right">Valor Consulta</TableHead>
                    <TableHead className="text-right">Sinal</TableHead>
                    <TableHead className="text-right">Falta Cobrar</TableHead>
                    <TableHead className="text-center">Status Sinal</TableHead>
                    <TableHead className="text-center">Status Pagamento</TableHead>
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
                            <p className="font-medium">{appointment.patientName}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{appointment.doctorName}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {format(parseISO(appointment.appointmentDate), "dd/MM/yyyy 'às' HH:mm", {
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(appointment.estimatedValue)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(appointment.sinalAmount)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={appointment.remainingAmount > 0 ? 'font-medium text-orange-600' : 'text-muted-foreground'}>
                          {formatCurrency(appointment.remainingAmount)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {appointment.sinalPaid ? (
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
                        <Badge variant="outline">
                          {appointment.paymentStatus === 'paid' ? 'Pago' :
                            appointment.paymentStatus === 'partial' ? 'Parcial' :
                              appointment.paymentStatus === 'cancelled' ? 'Cancelado' : 'Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          {appointment.sinalReceiptUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewReceipt(appointment.sinalReceiptUrl)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4 text-blue-500" />
                            </Button>
                          )}
                          {!appointment.sinalPaid && (
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
                          {appointment.sinalPaid && appointment.sinalPaidAt && (
                            <span className="text-xs text-muted-foreground">
                              {format(parseISO(appointment.sinalPaidAt), "dd/MM/yyyy", {
                                locale: ptBR,
                              })}
                            </span>
                          )}
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
              <label htmlFor="receipt" className="text-sm font-medium">Comprovante de Pagamento (opcional)</label>
              <Input
                id="receipt"
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
              />
              {receiptFile && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <Upload className="h-3 w-3" />
                  {receiptFile.name}
                </p>
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

