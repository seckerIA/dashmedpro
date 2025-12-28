import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CommercialLead } from "@/types/commercial";
import { COMMERCIAL_LEAD_STATUS_LABELS, COMMERCIAL_LEAD_ORIGIN_LABELS } from "@/types/commercial";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MessageSquare, Edit } from "lucide-react";
import { useCommercialLeads } from "@/hooks/useCommercialLeads";
import { useState } from "react";
import { LeadForm } from "./LeadForm";

interface LeadDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: CommercialLead;
}

export function LeadDetailsModal({ open, onOpenChange, lead }: LeadDetailsModalProps) {
  const [showEditForm, setShowEditForm] = useState(false);

  const handleCall = () => {
    if (lead.phone) {
      window.open(`tel:${lead.phone}`, '_blank');
    }
  };

  const handleEmail = () => {
    if (lead.email) {
      window.open(`mailto:${lead.email}`, '_blank');
    }
  };

  const handleWhatsApp = () => {
    if (lead.phone) {
      const phone = lead.phone.replace(/\D/g, '');
      window.open(`https://wa.me/55${phone}`, '_blank');
    }
  };

  if (showEditForm) {
    return (
      <LeadForm
        open={showEditForm}
        onOpenChange={(open) => {
          setShowEditForm(open);
          if (!open) {
            onOpenChange(false);
          }
        }}
        lead={lead}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{lead.name}</DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditForm(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium">{COMMERCIAL_LEAD_STATUS_LABELS[lead.status]}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Origem</p>
              <p className="font-medium">{COMMERCIAL_LEAD_ORIGIN_LABELS[lead.origin]}</p>
            </div>
          </div>

          {lead.email && (
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{lead.email}</p>
            </div>
          )}

          {lead.phone && (
            <div>
              <p className="text-sm text-muted-foreground">Telefone</p>
              <p className="font-medium">{lead.phone}</p>
            </div>
          )}

          {lead.estimated_value && (
            <div>
              <p className="text-sm text-muted-foreground">Valor Estimado da 1ª Consulta</p>
              <p className="font-medium">{formatCurrency(lead.estimated_value)}</p>
            </div>
          )}

          {lead.notes && (
            <div>
              <p className="text-sm text-muted-foreground">Observações</p>
              <p className="font-medium whitespace-pre-wrap">{lead.notes}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Criado em</p>
              <p className="font-medium">
                {format(new Date(lead.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
            {lead.converted_at && (
              <div>
                <p className="text-sm text-muted-foreground">Convertido em</p>
                <p className="font-medium">
                  {format(new Date(lead.converted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4 border-t">
            {lead.phone && (
              <>
                <Button variant="outline" onClick={handleCall} className="flex-1">
                  <Phone className="h-4 w-4 mr-2" />
                  Ligar
                </Button>
                <Button variant="outline" onClick={handleWhatsApp} className="flex-1">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
              </>
            )}
            {lead.email && (
              <Button variant="outline" onClick={handleEmail} className="flex-1">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
















