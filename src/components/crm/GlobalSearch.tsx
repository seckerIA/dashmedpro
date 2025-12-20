import { useState, useEffect } from "react";
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
  const { deals, contacts, isLoading } = useCRM();

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GlobalSearch.tsx:23',message:'GlobalSearch montado',data:{dealsLength:deals.length,contactsLength:contacts.length,isLoading,open},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
  }, [deals.length, contacts.length, isLoading, open]);
  // #endregion

  // Handler para atalho de teclado Cmd+K (Mac) ou Ctrl+K (Windows/Linux)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Ignorar se o usuário estiver digitando em um input, textarea ou select
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

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

  // #region agent log
  useEffect(() => {
    if (open) {
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GlobalSearch.tsx:67',message:'Dialog aberto',data:{dealsLength:deals.length,contactsLength:contacts.length,isLoading},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
    }
  }, [open, deals.length, contacts.length, isLoading]);
  // #endregion

  return (
    <>
      <Button
        variant="outline"
        className="relative w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
        onClick={() => {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GlobalSearch.tsx:78',message:'Botão clicado',data:{willOpen:!open},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
          setOpen(true);
        }}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Buscar contratos, contatos...</span>
        <span className="inline-flex lg:hidden">Buscar...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">
            {navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl+'}
          </span>K
        </kbd>
      </Button>
      
      <CommandDialog open={open} onOpenChange={(newOpen) => {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GlobalSearch.tsx:93',message:'Dialog onOpenChange',data:{newOpen,currentOpen:open},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        setOpen(newOpen);
      }}>
        <CommandInput 
          placeholder="Digite para buscar contratos, contatos..."
        />
        <CommandList>
          <CommandEmpty>
            {isLoading ? "Carregando..." : `Nenhum resultado encontrado. (${deals.length} contratos, ${contacts.length} contatos)`}
          </CommandEmpty>
          
          {!isLoading && deals.length > 0 && (
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
          
          {!isLoading && contacts.length > 0 && (
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
