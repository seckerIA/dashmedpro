/**
 * WhatsAppAccountPicker
 * Dialog para selecionar WABA e número de telefone do Business Manager
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  Phone,
  Building2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useMetaOAuth, WhatsAppBusinessAccountBM } from '@/hooks/useMetaOAuth';

interface WhatsAppAccountPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function WhatsAppAccountPicker({ open, onOpenChange, onSuccess }: WhatsAppAccountPickerProps) {
  const {
    fetchWhatsAppAccounts,
    isFetchingWhatsAppAccounts,
    whatsAppAccounts,
    whatsAppAccountsError,
    connectWhatsAppAccount,
    isConnectingWhatsApp,
    startOAuthFlow,
  } = useMetaOAuth();

  const [selectedWabaId, setSelectedWabaId] = useState('');
  const [selectedPhoneId, setSelectedPhoneId] = useState('');

  // Buscar contas quando o dialog abre
  useEffect(() => {
    if (open) {
      setSelectedWabaId('');
      setSelectedPhoneId('');
      fetchWhatsAppAccounts();
    }
  }, [open, fetchWhatsAppAccounts]);

  const handleConnect = async () => {
    if (!selectedWabaId || !selectedPhoneId) return;

    try {
      await connectWhatsAppAccount({ wabaId: selectedWabaId, phoneNumberId: selectedPhoneId });
      onOpenChange(false);
      onSuccess?.();
    } catch {
      // Error handled by mutation onError
    }
  };

  const handlePhoneSelect = (value: string) => {
    // value format: "wabaId|phoneId"
    const [wabaId, phoneId] = value.split('|');
    setSelectedWabaId(wabaId);
    setSelectedPhoneId(phoneId);
  };

  const errorCode = (whatsAppAccountsError as any)?.code;

  const renderQualityBadge = (quality: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      GREEN: { className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'Alta' },
      YELLOW: { className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'Média' },
      RED: { className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'Baixa' },
    };
    const v = variants[quality] || variants.GREEN;
    return <Badge variant="outline" className={v.className}>{v.label}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Configurar WhatsApp Business
          </DialogTitle>
          <DialogDescription>
            Selecione a conta e número que deseja usar para enviar e receber mensagens.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Loading */}
          {isFetchingWhatsAppAccounts && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Buscando contas do Business Manager...</p>
            </div>
          )}

          {/* Error: Token Expired */}
          {!isFetchingWhatsAppAccounts && errorCode === 'TOKEN_EXPIRED' && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-300 dark:border-yellow-800 rounded-lg space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Token expirado</p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    Seu token de acesso expirou. Reconecte sua conta Meta para continuar.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full border-yellow-500"
                onClick={() => {
                  onOpenChange(false);
                  startOAuthFlow();
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Renovar Token
              </Button>
            </div>
          )}

          {/* Error: No Token */}
          {!isFetchingWhatsAppAccounts && errorCode === 'NO_TOKEN' && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Meta não conectado</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    Conecte sua conta Meta primeiro usando o botão "Conectar com Facebook".
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error: Generic */}
          {!isFetchingWhatsAppAccounts && whatsAppAccountsError && !errorCode && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-300 dark:border-red-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">Erro ao buscar contas</p>
                  <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                    {(whatsAppAccountsError as Error).message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isFetchingWhatsAppAccounts && !whatsAppAccountsError && whatsAppAccounts?.length === 0 && (
            <div className="text-center py-8 space-y-2">
              <Phone className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium">Nenhuma conta WhatsApp encontrada</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Verifique se você tem acesso a uma conta WhatsApp Business no Meta Business Manager.
              </p>
            </div>
          )}

          {/* Account List */}
          {!isFetchingWhatsAppAccounts && !whatsAppAccountsError && whatsAppAccounts && whatsAppAccounts.length > 0 && (
            <RadioGroup
              value={selectedWabaId && selectedPhoneId ? `${selectedWabaId}|${selectedPhoneId}` : ''}
              onValueChange={handlePhoneSelect}
              className="space-y-4"
            >
              {whatsAppAccounts.map((waba: WhatsAppBusinessAccountBM) => (
                <div key={waba.id} className="space-y-2">
                  {/* WABA Header */}
                  <div className="flex items-center gap-2 px-1">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{waba.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {waba.phone_numbers.length} número{waba.phone_numbers.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>

                  {/* Phone Numbers */}
                  {waba.phone_numbers.length === 0 ? (
                    <p className="text-xs text-muted-foreground pl-6">Nenhum número registrado</p>
                  ) : (
                    <div className="space-y-2 pl-2">
                      {waba.phone_numbers.map((phone) => (
                        <Label
                          key={phone.id}
                          htmlFor={`phone-${phone.id}`}
                          className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                        >
                          <RadioGroupItem value={`${waba.id}|${phone.id}`} id={`phone-${phone.id}`} />
                          <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{phone.display_phone_number}</p>
                            <p className="text-xs text-muted-foreground truncate">{phone.verified_name}</p>
                          </div>
                          {phone.quality_rating && renderQualityBadge(phone.quality_rating)}
                        </Label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </RadioGroup>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleConnect}
            disabled={!selectedWabaId || !selectedPhoneId || isConnectingWhatsApp}
          >
            {isConnectingWhatsApp ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Conectar este número
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
