import { useState } from "react";
import { 
  CommandDialog, 
  CommandInput, 
  CommandList, 
  CommandEmpty, 
  CommandGroup, 
  CommandItem 
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Search, User, HandCoins, Calendar, DollarSign } from "lucide-react";
import { useCRM } from "@/hooks/useCRM";
import { CRMDealWithContact, CRMContact } from "@/types/crm";

interface GlobalSearchProps {
  onSelectDeal?: (deal: CRMDealWithContact) => void;
  onSelectContact?: (contact: CRMContact) => void;
}

export function GlobalSearch({ onSelectDeal, onSelectContact }: GlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const { deals, contacts } = useCRM();

  const formatCurrency = (value: string | number | null) => {
    if (!value) return '';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(numValue);
  };

  const handleSelectDeal = (deal: CRMDealWithContact) => {
    setOpen(false);
    onSelectDeal?.(deal);
  };

  const handleSelectContact = (contact: CRMContact) => {
    setOpen(false);
    onSelectContact?.(contact);
  };

  return (
    <>
      <Button
        variant="outline"
        className="relative w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Buscar contratos, contatos...</span>
        <span className="inline-flex lg:hidden">Buscar...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Digite para buscar contratos, contatos..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          
          {deals.length > 0 && (
            <CommandGroup heading="Contratos">
              {deals.map((deal) => (
                <CommandItem
                  key={deal.id}
                  value={`${deal.title} ${deal.contact?.full_name || ''}`}
                  onSelect={() => handleSelectDeal(deal)}
                  className="flex items-center gap-3 p-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <HandCoins className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{deal.title}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {deal.contact?.full_name && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {deal.contact.full_name}
                        </span>
                      )}
                      {deal.value && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {formatCurrency(deal.value)}
                        </span>
                      )}
                      {deal.expected_close_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(deal.expected_close_date).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          
          {contacts.length > 0 && (
            <CommandGroup heading="Contatos">
              {contacts.map((contact) => (
                <CommandItem
                  key={contact.id}
                  value={`${contact.full_name} ${contact.email || ''} ${contact.company || ''}`}
                  onSelect={() => handleSelectContact(contact)}
                  className="flex items-center gap-3 p-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{contact.full_name}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {contact.email && <span>{contact.email}</span>}
                      {contact.company && <span>{contact.company}</span>}
                      {contact.phone && <span>{contact.phone}</span>}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
