import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCRM } from "@/hooks/useCRM";
import { CRMPipelineStage } from "@/types/crm";
import { formatCurrency } from "@/lib/currency";
import { 
  User, 
  Building2, 
  Mail, 
  Phone, 
  DollarSign,
  Search,
  AlertCircle
} from "lucide-react";
import { getServiceConfig } from "@/constants/services";

interface ExistingContactSelectorProps {
  stage: CRMPipelineStage;
  stageLabel: string;
  onContactSelected: (contactId: string) => void;
  onClose: () => void;
}

export function ExistingContactSelector({
  stage,
  stageLabel,
  onContactSelected,
  onClose,
}: ExistingContactSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { contacts, deals } = useCRM();
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  // Mostrar todos os contatos, mas identificar quais já estão no pipeline
  const contactsInPipeline = useMemo(() => {
    return new Set(
      deals
        .filter(deal => !deal.stage.includes('fechado'))
        .map(deal => deal.contact_id)
        .filter(Boolean)
    );
  }, [deals]);

  const availableContacts = contacts;

  // Filtrar contatos baseado na busca
  const filteredContacts = useMemo(() => {
    if (!searchTerm) return availableContacts;

    const term = searchTerm.toLowerCase();
    return availableContacts.filter(contact => 
      contact.full_name.toLowerCase().includes(term) ||
      contact.email?.toLowerCase().includes(term) ||
      contact.company?.toLowerCase().includes(term) ||
      contact.phone?.toLowerCase().includes(term)
    );
  }, [availableContacts, searchTerm]);

  const handleContactSelect = (contactId: string) => {
    onContactSelected(contactId);
  };


  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Selecionar Contato Existente
          </DialogTitle>
          <DialogDescription>
            Escolha um contato para adicionar ao estágio "{stageLabel}". 
            Contatos já no pipeline são marcados com um badge.
          </DialogDescription>
        </DialogHeader>

        <Command className="rounded-lg border shadow-md">
          <CommandInput
            placeholder="Buscar por nome, empresa, email ou telefone..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            <CommandEmpty className="py-6 text-center">
              <div className="flex flex-col items-center gap-2">
                <AlertCircle className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {availableContacts.length === 0 
                    ? "Não há contatos cadastrados."
                    : "Nenhum contato encontrado com os termos de busca."
                  }
                </p>
              </div>
            </CommandEmpty>
            <CommandGroup>
              <ScrollArea className="max-h-[400px]">
                {filteredContacts.map((contact) => {
                  const serviceConfig = contact.service ? getServiceConfig(contact.service) : null;
                  const isInPipeline = contactsInPipeline.has(contact.id);
                  
                  return (
                    <CommandItem
                      key={contact.id}
                      value={`${contact.full_name} ${contact.email || ''} ${contact.company || ''} ${contact.phone || ''}`}
                      onSelect={() => handleContactSelect(contact.id)}
                      className="cursor-pointer p-4 border-b border-border/50 last:border-b-0 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between w-full">
                        <div className="flex-1 space-y-2">
                          {/* Nome e empresa */}
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <div>
                              <p className="font-medium text-foreground">
                                {contact.full_name}
                              </p>
                              {contact.company && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Building2 className="w-3 h-3 text-muted-foreground" />
                                  <p className="text-sm text-muted-foreground">
                                    {contact.company}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Contato */}
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            {contact.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                <span>{contact.email}</span>
                              </div>
                            )}
                            {contact.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                <span>{contact.phone}</span>
                              </div>
                            )}
                          </div>

                          {/* Tags e serviços */}
                          <div className="flex flex-wrap gap-2">
                            {isInPipeline && (
                              <Badge variant="default" className="bg-blue-500 text-white text-xs">
                                No Pipeline
                              </Badge>
                            )}
                            {serviceConfig && (
                              <Badge 
                                variant="secondary" 
                                className={`${serviceConfig.bgColor} ${serviceConfig.textColor} border-0 text-xs`}
                              >
                                {serviceConfig.label}
                              </Badge>
                            )}
                            {contact.tags && contact.tags.length > 0 && (
                              contact.tags.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))
                            )}
                            {contact.tags && contact.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{contact.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Valor do serviço */}
                        {contact.service_value && (
                          <div className="flex items-center gap-1 text-sm font-medium text-green-600 ml-4">
                            <DollarSign className="w-4 h-4" />
                            <span>{formatCurrency(contact.service_value)}</span>
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </ScrollArea>
            </CommandGroup>
          </CommandList>
        </Command>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
