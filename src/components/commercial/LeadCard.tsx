import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MessageSquare, UserPlus, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommercialLead } from "@/types/commercial";
import { COMMERCIAL_LEAD_STATUS_LABELS, COMMERCIAL_LEAD_ORIGIN_LABELS } from "@/types/commercial";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCommercialLeads } from "@/hooks/useCommercialLeads";
import { useState } from "react";
import { LeadDetailsModal } from "./LeadDetailsModal";

interface LeadCardProps {
  lead: CommercialLead;
}

export function LeadCard({ lead }: LeadCardProps) {
  const { deleteLead, convertLead } = useCommercialLeads();
  const [showDetails, setShowDetails] = useState(false);

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

  const handleConvert = async () => {
    // This would typically open a form to create contact
    // For now, we'll just show a message
    alert("Funcionalidade de conversão será implementada em breve");
  };

  return (
    <>
      <Card className="bg-gradient-card shadow-card border-border hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-card-foreground truncate">{lead.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {COMMERCIAL_LEAD_STATUS_LABELS[lead.status]}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {COMMERCIAL_LEAD_ORIGIN_LABELS[lead.origin]}
                </Badge>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowDetails(true)}>
                  Ver Detalhes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleConvert} disabled={lead.status === 'converted'}>
                  Converter em Paciente
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => deleteLead.mutate(lead.id)}
                  className="text-destructive"
                >
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            {lead.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span className="truncate">{lead.email}</span>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>{lead.phone}</span>
              </div>
            )}
            {lead.estimated_value && (
              <div className="font-medium text-card-foreground">
                {formatCurrency(lead.estimated_value)}
              </div>
            )}
            <div className="text-xs">
              {format(new Date(lead.created_at), "dd/MM/yyyy", { locale: ptBR })}
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            {lead.phone && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCall}
                  className="flex-1"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Ligar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleWhatsApp}
                  className="flex-1"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
              </>
            )}
            {lead.email && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEmail}
                className="flex-1"
              >
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <LeadDetailsModal
        open={showDetails}
        onOpenChange={setShowDetails}
        lead={lead}
      />
    </>
  );
}






