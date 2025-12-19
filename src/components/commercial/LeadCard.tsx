import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MessageSquare, MoreVertical, Calendar } from "lucide-react";
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
import { useNavigate } from "react-router-dom";
import { LeadDetailsModal } from "./LeadDetailsModal";
import { ConversionModal } from "./ConversionModal";
import { useCRM } from "@/hooks/useCRM";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface LeadCardProps {
  lead: CommercialLead;
}

export function LeadCard({ lead }: LeadCardProps) {
  const { deleteLead, convertLead } = useCommercialLeads();
  const { createContact } = useCRM();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);
  const [showConversion, setShowConversion] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);

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
    setShowConversion(true);
  };

  const handleScheduleAppointment = async () => {
    setIsScheduling(true);
    try {
      let contactId = lead.contact_id;

      // Se o lead ainda não foi convertido, criar contato automaticamente
      if (!contactId) {
        const contactData = {
          full_name: lead.name,
          email: lead.email || undefined,
          phone: lead.phone || undefined,
          insurance_type: 'particular' as const,
        };

        const newContact = await createContact.mutateAsync(contactData);
        contactId = newContact.id;

        // Converter o lead
        await convertLead.mutateAsync({
          leadId: lead.id,
          contactId: newContact.id,
        });
      }

      // Navegar para o calendário com o contactId e abrir formulário de consulta
      const params = new URLSearchParams();
      params.set('convertedFromDeal', 'true');
      params.set('contactId', contactId);
      if (lead.estimated_value) {
        params.set('appointmentValue', lead.estimated_value.toString());
      }
      params.set('paidInAdvance', 'false');
      
      navigate(`/calendar?${params.toString()}`);
    } catch (error) {
      console.error('Erro ao agendar consulta:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao agendar consulta',
        description: error instanceof Error ? error.message : 'Não foi possível criar o contato e agendar a consulta.',
      });
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <>
      <Card className="bg-gradient-card shadow-card border-border hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-card-foreground truncate mb-1">{lead.name}</h3>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {COMMERCIAL_LEAD_STATUS_LABELS[lead.status]}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {COMMERCIAL_LEAD_ORIGIN_LABELS[lead.origin]}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={handleScheduleAppointment}
                disabled={isScheduling}
                className="h-8 px-3 text-xs bg-primary hover:bg-primary/90"
              >
                <Calendar className="h-4 w-4 mr-1.5" />
                {isScheduling ? 'Abrindo...' : 'Agendar Paciente'}
              </Button>
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

      <ConversionModal
        open={showConversion}
        onOpenChange={setShowConversion}
        leadId={lead.id}
        leadName={lead.name}
        leadEmail={lead.email}
        leadPhone={lead.phone}
        estimatedValue={lead.estimated_value}
      />
    </>
  );
}


