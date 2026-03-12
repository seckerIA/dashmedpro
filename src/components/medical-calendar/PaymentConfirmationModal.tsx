import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MedicalAppointmentWithRelations } from '@/types/medicalAppointments';
import { formatCurrency } from '@/lib/currency';
import { DollarSign, CheckCircle2, XCircle, AlertCircle, Package, Loader2, Stethoscope, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCommercialProcedures } from '@/hooks/useCommercialProcedures';
import { CommercialProcedure } from '@/types/commercial';

interface StockUsageItem {
  id: string;
  quantity: number;
  deducted: boolean;
  inventory_items: {
    name: string;
    unit: string;
  } | null;
}

export interface ProcedureSelection {
  procedure: CommercialProcedure;
  value: number;
}

interface PaymentConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: MedicalAppointmentWithRelations | null;
  onConfirm: (paid: boolean, procedureData?: ProcedureSelection) => void;
  isProcessing?: boolean;
}

export function PaymentConfirmationModal({
  open,
  onOpenChange,
  appointment,
  onConfirm,
  isProcessing = false,
}: PaymentConfirmationModalProps) {
  const [stockUsageItems, setStockUsageItems] = useState<StockUsageItem[]>([]);
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [hadProcedure, setHadProcedure] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState<CommercialProcedure | null>(null);
  const [procedureSearch, setProcedureSearch] = useState('');
  const { procedures } = useCommercialProcedures();

  const filteredProcedures = useMemo(() => {
    if (!procedureSearch.trim()) return procedures.filter(p => p.is_active && p.category !== 'consultation');
    const search = procedureSearch.toLowerCase();
    return procedures.filter(p => p.is_active && p.category !== 'consultation' && p.name.toLowerCase().includes(search));
  }, [procedures, procedureSearch]);

  useEffect(() => {
    if (open && appointment?.id) {
      fetchStockUsage();
      setHadProcedure(false);
      setSelectedProcedure(null);
      setProcedureSearch('');
    }
  }, [open, appointment?.id]);

  const fetchStockUsage = async () => {
    if (!appointment?.id) return;

    setIsLoadingStock(true);
    try {
      const { data, error } = await (supabase
        .from('appointment_stock_usage' as any) as any)
        .select(`
          id,
          quantity,
          deducted,
          inventory_items:inventory_item_id(name, unit)
        `)
        .eq('appointment_id', appointment.id)
        .eq('deducted', false);

      if (error) throw error;
      setStockUsageItems((data as unknown as StockUsageItem[]) || []);
    } catch (error) {
      console.error('Erro ao buscar itens de estoque:', error);
      setStockUsageItems([]);
    } finally {
      setIsLoadingStock(false);
    }
  };

  if (!appointment) return null;

  const estimatedValue = appointment.estimated_value || 0;
  const hasValue = estimatedValue > 0;
  const paymentStatus = appointment.payment_status;
  const alreadyPaid = paymentStatus === 'paid' || paymentStatus === 'partial';
  const sinalPaid = appointment.sinal_paid === true;

  const procedureData = hadProcedure && selectedProcedure
    ? { procedure: selectedProcedure, value: selectedProcedure.price }
    : undefined;

  const totalValue = estimatedValue + (procedureData?.value || 0);

  const handleConfirmPaid = () => {
    onConfirm(true, procedureData);
  };

  const handleConfirmNotPaid = () => {
    onConfirm(false, procedureData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Confirmação de Pagamento
          </DialogTitle>
          <DialogDescription>
            O paciente compareceu à consulta. Por favor, confirme se o pagamento foi realizado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Informações do paciente */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Paciente</p>
            <p className="font-medium">{appointment.contact?.full_name || 'Sem nome'}</p>
          </div>

          {/* Valor da consulta */}
          {hasValue && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Valor da Consulta</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(estimatedValue)}</p>
            </div>
          )}

          {/* Status atual de pagamento */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Status Atual de Pagamento</p>
            <div className="flex flex-wrap gap-2 items-center">
              <PaymentStatusBadge status={paymentStatus} showIcon />
              {sinalPaid && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Sinal Pago
                </Badge>
              )}
            </div>
            {sinalPaid && appointment.sinal_amount && (
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-2 flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Valor do sinal recebido: {formatCurrency(appointment.sinal_amount)}
              </p>
            )}
          </div>

          {/* Alert se já está pago */}
          {alreadyPaid && (
            <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Pagamento já confirmado
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  A transação financeira será criada automaticamente.
                </p>
              </div>
            </div>
          )}

          {/* Alert se não tem valor */}
          {!hasValue && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Consulta sem valor definido
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  Nenhuma transação financeira será criada.
                </p>
              </div>
            </div>
          )}

          {/* Itens de estoque vinculados */}
          {isLoadingStock ? (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground ml-2">Carregando estoque...</span>
            </div>
          ) : stockUsageItems.length > 0 && (
            <div className="border border-orange-200 dark:border-orange-800 rounded-lg p-3 bg-orange-50 dark:bg-orange-950/20">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  Itens do Estoque a Descontar
                </p>
              </div>
              <ul className="space-y-1.5">
                {stockUsageItems.map((item) => (
                  <li key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-orange-700 dark:text-orange-300">
                      {item.inventory_items?.name || 'Item desconhecido'}
                    </span>
                    <Badge variant="outline" className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700">
                      {item.quantity} {item.inventory_items?.unit || 'un'}
                    </Badge>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                Ao confirmar, estes itens serão descontados do estoque automaticamente.
              </p>
            </div>
          )}

          {/* Procedimento realizado na consulta */}
          <div className="border border-purple-200 dark:border-purple-800 rounded-lg p-3 bg-purple-50/50 dark:bg-purple-950/20">
            <div className="flex items-center gap-2">
              <Checkbox
                id="had-procedure"
                checked={hadProcedure}
                onCheckedChange={(checked) => {
                  setHadProcedure(checked === true);
                  if (!checked) {
                    setSelectedProcedure(null);
                    setProcedureSearch('');
                  }
                }}
              />
              <Label htmlFor="had-procedure" className="text-sm font-medium text-purple-800 dark:text-purple-200 cursor-pointer flex items-center gap-1.5">
                <Stethoscope className="h-4 w-4" />
                Teve procedimento nesta consulta
              </Label>
            </div>

            {hadProcedure && (
              <div className="mt-3 space-y-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar procedimento..."
                    value={procedureSearch}
                    onChange={(e) => setProcedureSearch(e.target.value)}
                    className="pl-8 h-9 text-sm"
                  />
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {filteredProcedures.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2 text-center">Nenhum procedimento encontrado</p>
                  ) : (
                    filteredProcedures.map((proc) => (
                      <button
                        key={proc.id}
                        type="button"
                        onClick={() => setSelectedProcedure(proc)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                          selectedProcedure?.id === proc.id
                            ? 'bg-purple-100 dark:bg-purple-900/40 border border-purple-300 dark:border-purple-700'
                            : 'hover:bg-muted/50 border border-transparent'
                        }`}
                      >
                        <span className="font-medium truncate">{proc.name}</span>
                        <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 shrink-0 ml-2">
                          {formatCurrency(proc.price)}
                        </span>
                      </button>
                    ))
                  )}
                </div>

                {selectedProcedure && (
                  <div className="flex items-center justify-between pt-2 border-t border-purple-200 dark:border-purple-700">
                    <span className="text-xs text-muted-foreground">Total (Consulta + Procedimento)</span>
                    <span className="text-lg font-bold text-purple-700 dark:text-purple-300">
                      {formatCurrency(totalValue)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          {hasValue && !alreadyPaid && (
            <>
              <Button
                variant="outline"
                onClick={handleConfirmNotPaid}
                disabled={isProcessing}
                className="w-full sm:w-auto border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Não Pagou
              </Button>
              <Button
                onClick={handleConfirmPaid}
                disabled={isProcessing}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Pagou
              </Button>
            </>
          )}
          {(!hasValue || alreadyPaid) && (
            <Button
              onClick={() => onConfirm(alreadyPaid, procedureData)}
              disabled={isProcessing}
              className="w-full sm:w-auto"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirmar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
