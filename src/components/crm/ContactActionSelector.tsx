import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ContactForm } from "./ContactForm";
import { ExistingContactSelector } from "./ExistingContactSelector";
import { Plus, UserPlus, Users, ChevronDown } from "lucide-react";
import { CRMPipelineStage } from "@/types/crm";
import { useCRM } from "@/hooks/useCRM";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface ContactActionSelectorProps {
  stage: CRMPipelineStage;
  stageConfig: {
    bgColor: string;
    textColor: string;
    label: string;
  };
  onContactAdded?: (dealId: string) => void;
  onExistingContactSelected?: (contactId: string, stage: CRMPipelineStage) => void;
}

export function ContactActionSelector({ 
  stage, 
  stageConfig, 
  onContactAdded,
  onExistingContactSelected 
}: ContactActionSelectorProps) {
  const [showNewContactForm, setShowNewContactForm] = useState(false);
  const [showExistingContactSelector, setShowExistingContactSelector] = useState(false);
  const { createDeal, contacts } = useCRM();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleNewContact = () => {
    setShowNewContactForm(true);
  };

  const handleExistingContact = () => {
    setShowExistingContactSelector(true);
  };

  const handleContactFormSuccess = (dealId?: string) => {
    setShowNewContactForm(false);
    if (dealId) {
      onContactAdded?.(dealId);
    }
  };

  const handleExistingContactSelected = async (contactId: string) => {
    setShowExistingContactSelector(false);
    
    try {
      // Buscar dados do contato para criar o deal
      const contact = contacts.find(c => c.id === contactId);
      if (!contact) {
        throw new Error('Contato não encontrado');
      }

      // Criar deal automaticamente
      const newDeal = await createDeal({
        contact_id: contactId,
        title: contact.full_name,
        description: `Contato adicionado ao estágio ${stageConfig.label}`,
        stage: stage,
        value: contact.service_value || null,
        probability: 0,
      });

      // Invalidar cache de deals para garantir que apareça imediatamente no pipeline
      queryClient.invalidateQueries({ 
        queryKey: ['crm-deals'],
        exact: false 
      });

      toast({
        title: "Contato adicionado ao pipeline",
        description: `${contact.full_name} foi adicionado ao estágio ${stageConfig.label}.`,
      });

      onContactAdded?.(newDeal.id);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao adicionar contato ao pipeline",
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`w-full mt-3 text-sm ${stageConfig.bgColor} ${stageConfig.textColor} hover:bg-opacity-20 border border-border/30 hover:border-current/30 transition-all duration-200 rounded-lg font-medium`}
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Contato
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-56">
          <DropdownMenuItem onClick={handleNewContact} className="cursor-pointer">
            <UserPlus className="w-4 h-4 mr-2" />
            <div className="flex flex-col">
              <span className="font-medium">Novo Contato</span>
              <span className="text-xs text-muted-foreground">
                Criar um novo contato
              </span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExistingContact} className="cursor-pointer">
            <Users className="w-4 h-4 mr-2" />
            <div className="flex flex-col">
              <span className="font-medium">Contato Existente</span>
              <span className="text-xs text-muted-foreground">
                Selecionar da lista de contatos
              </span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modal para novo contato */}
      <ContactForm
        initialStage={stage}
        onSuccess={handleContactFormSuccess}
        forceOpen={showNewContactForm}
        onCancel={() => setShowNewContactForm(false)}
        trigger={<button style={{ display: 'none' }} />}
      />

      {/* Modal para contato existente */}
      {showExistingContactSelector && (
        <ExistingContactSelector
          stage={stage}
          stageLabel={stageConfig.label}
          onContactSelected={handleExistingContactSelected}
          onClose={() => setShowExistingContactSelector(false)}
        />
      )}
    </>
  );
}
