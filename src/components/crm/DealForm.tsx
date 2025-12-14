import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { X, Plus, HandCoins, Phone, Mail, Copy, MoreVertical, Settings, Trash2, Archive, User, Edit3, Save } from "lucide-react";
import { useCRM } from "@/hooks/useCRM";
import { useToast } from "@/hooks/use-toast";
import { CRMDeal, CRMContact, PIPELINE_STAGES } from "@/types/crm";
import { formatCurrency, formatCurrencyInput } from "@/lib/currency";

const dealSchema = z.object({
  title: z.string().min(2, "Título deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  value: z.string().optional().transform((val) => {
    if (!val) return null;
    const num = parseFloat(val.replace(/[^\d,.-]/g, "").replace(",", "."));
    return isNaN(num) ? null : num;
  }),
  stage: z.enum([
    "lead_novo",
    "qualificado", 
    "apresentacao",
    "proposta",
    "negociacao",
    "fechado_ganho",
    "fechado_perdido"
  ] as const),
  expected_close_date: z.string().optional(),
  contact_id: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

type DealFormData = z.infer<typeof dealSchema>;

interface DealFormProps {
  deal?: CRMDeal;
  contact?: CRMContact;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  onClose?: () => void;
}

export function DealForm({ deal, contact, trigger, onSuccess, onClose }: DealFormProps) {
  const [open, setOpen] = useState(!!deal);
  const [tagInput, setTagInput] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [contactFormData, setContactFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    company: '',
    service: '',
    service_value: ''
  });
  const { 
    createDeal, 
    updateDeal, 
    contacts, 
    isCreatingDeal, 
    isUpdatingDeal,
    updateContact
  } = useCRM();
  const { toast } = useToast();

  const form = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      title: deal?.title || "",
      description: deal?.description || "",
      value: deal?.value ? formatCurrency(deal.value) : ("" as any),
      stage: deal?.stage || "lead_novo",
      expected_close_date: deal?.expected_close_date 
        ? new Date(deal.expected_close_date).toISOString().split('T')[0]
        : "",
      contact_id: deal?.contact_id || contact?.id || "none",
      tags: deal?.tags || [],
    },
  });

  const watchedTags = form.watch("tags");

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    toast({
      title: "Telefone copiado!",
      description: `${phone} copiado para a área de transferência.`,
    });
  };

  // Obter contato selecionado - movido para depois da inicialização do form
  const selectedContactId = form.watch("contact_id");
  const selectedContact = contacts.find(c => c.id === selectedContactId);

  // Inicializar dados do contato quando o contato selecionado mudar
  useEffect(() => {
    if (selectedContact && selectedContact.id !== 'none') {
      setContactFormData({
        full_name: selectedContact.full_name || '',
        email: selectedContact.email || '',
        phone: selectedContact.phone || '',
        company: selectedContact.company || '',
        service: selectedContact.service || '',
        service_value: selectedContact.service_value?.toString() || ''
      });
    }
  }, [selectedContact]);

  // Abrir modal automaticamente quando um deal é passado para edição
  useEffect(() => {
    if (deal) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [deal]);

  // Função para fechar o modal
  const handleClose = () => {
    setOpen(false);
    setShowSidebar(false);
    form.reset();
    onClose?.(); // Notificar o componente pai
  };

  const handleDeleteDeal = async () => {
    if (deal && window.confirm('Tem certeza que deseja excluir este contrato?')) {
      try {
        // Aqui você pode implementar a lógica de exclusão
        toast({
          title: "Contrato excluído",
          description: "O contrato foi excluído com sucesso.",
        });
        handleClose();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Erro ao excluir o contrato.",
        });
      }
    }
  };

  const handleSaveContact = async () => {
    if (!selectedContact) return;
    
    try {
      // Converter service_value de string para number
      const dataToUpdate = {
        ...contactFormData,
        service_value: contactFormData.service_value 
          ? parseFloat(contactFormData.service_value.replace(/[^\d,.-]/g, "").replace(",", "."))
          : undefined
      };

      await updateContact({ 
        contactId: selectedContact.id, 
        data: dataToUpdate 
      });
      toast({
        title: "Contato atualizado",
        description: "As informações do contato foram salvas com sucesso.",
      });
      setEditingContact(false);
    } catch (error) {
      console.error('Erro ao salvar contato:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao salvar as informações do contato.",
      });
    }
  };

  const handleContactAction = (action: 'call' | 'whatsapp' | 'email') => {
    if (!selectedContact) return;

    switch (action) {
      case 'call':
        if (selectedContact.phone) {
          window.open(`tel:${selectedContact.phone}`, '_self');
        } else {
          toast({
            variant: "destructive",
            title: "Telefone não encontrado",
            description: "Este contato não possui um telefone cadastrado.",
          });
        }
        break;
      case 'whatsapp':
        if (selectedContact.phone) {
          const cleanPhone = selectedContact.phone.replace(/\D/g, '');
          window.open(`https://wa.me/55${cleanPhone}`, '_blank');
        } else {
          toast({
            variant: "destructive",
            title: "Telefone não encontrado",
            description: "Este contato não possui um telefone cadastrado.",
          });
        }
        break;
      case 'email':
        if (selectedContact.email) {
          window.open(`mailto:${selectedContact.email}`, '_self');
        } else {
          toast({
            variant: "destructive",
            title: "Email não encontrado",
            description: "Este contato não possui um email cadastrado.",
          });
        }
        break;
    }
  };

  const onSubmit = async (data: DealFormData) => {
    try {
      const dealData = {
        ...data,
        value: data.value,
        expected_close_date: data.expected_close_date || null,
        contact_id: data.contact_id === "none" ? null : data.contact_id || null,
        probability: 0,
        updated_at: new Date().toISOString(),
      };

      if (deal) {
        // Atualizar deal existente
        await updateDeal({
          dealId: deal.id,
          data: dealData,
        });
        toast({
          title: "Contrato atualizado",
          description: "O contrato foi atualizado com sucesso.",
        });
      } else {
        // Criar novo deal
        await createDeal(dealData as any);
        toast({
          title: "Contrato criado",
          description: "O contrato foi criado com sucesso.",
        });
      }
      
      setOpen(false);
      form.reset();
      onSuccess?.();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar contrato",
      });
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !watchedTags.includes(tagInput.trim())) {
      form.setValue("tags", [...watchedTags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    form.setValue("tags", watchedTags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const handleValueChange = (value: string) => {
    // Usar formatCurrencyInput do lib/currency para formatação correta
    const formatted = formatCurrencyInput(value);
    form.setValue("value", formatted as any);
  };

  const isLoading = isCreatingDeal || isUpdatingDeal;

  return (
    <Dialog open={open || !!deal} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen && deal) {
        onSuccess?.();
      }
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <HandCoins className="w-4 h-4 mr-2" />
            {deal ? "Editar Contrato" : "Novo Contrato"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HandCoins className="w-5 h-5" />
              <DialogTitle>
                {deal ? "Editar Contrato" : "Novo Contrato"}
              </DialogTitle>
            </div>
            {deal && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowSidebar(true)}>
                    <Settings className="w-4 h-4 mr-2" />
                    Mais Opções
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Archive className="w-4 h-4 mr-2" />
                    Arquivar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleDeleteDeal}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <DialogDescription>
            {deal 
              ? "Atualize as informações do contrato existente." 
              : "Preencha as informações para criar um novo contrato no CRM."
            }
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título do Contrato *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Venda de Software para Empresa X" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva os detalhes do contrato..."
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="R$ 0,00"
                      value={field.value || ""}
                      onChange={(e) => {
                        handleValueChange(e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estágio *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o estágio" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PIPELINE_STAGES.map((stage) => (
                          <SelectItem key={stage.value} value={stage.value}>
                            <div className="flex items-center gap-2">
                              <stage.icon className="w-4 h-4" />
                              {stage.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expected_close_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Esperada de Fechamento</FormLabel>
                    <FormControl>
                      <Input 
                        type="date"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="contact_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contato</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um contato" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhum contato</SelectItem>
                      {contacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{contact.full_name}</span>
                            {contact.company && (
                              <span className="text-sm text-muted-foreground">
                                {contact.company}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Informações do Contato Selecionado - Telefone e Email */}
            {selectedContact && selectedContact.id !== 'none' && (
              <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-2 border-emerald-300 dark:border-emerald-600 rounded-xl p-4 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-emerald-800 dark:text-emerald-200 uppercase tracking-wide">📞 Informações do Contato</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingContact(!editingContact)}
                    className="h-7 px-2 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:text-emerald-200 dark:hover:bg-emerald-900/30"
                  >
                    <Edit3 className="w-3 h-3 mr-1" />
                    {editingContact ? 'Cancelar' : 'Editar'}
                  </Button>
                </div>

                {editingContact ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Nome Completo</label>
                        <Input
                          value={contactFormData.full_name}
                          onChange={(e) => setContactFormData(prev => ({ ...prev, full_name: e.target.value }))}
                          placeholder="Nome do contato"
                          className="text-sm border-emerald-200 dark:border-emerald-700 focus:border-emerald-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Telefone</label>
                        <Input
                          value={contactFormData.phone}
                          onChange={(e) => setContactFormData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="(11) 99999-9999"
                          className="text-sm border-emerald-200 dark:border-emerald-700 focus:border-emerald-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Email</label>
                        <Input
                          value={contactFormData.email}
                          onChange={(e) => setContactFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="email@exemplo.com"
                          type="email"
                          className="text-sm border-emerald-200 dark:border-emerald-700 focus:border-emerald-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Empresa</label>
                        <Input
                          value={contactFormData.company}
                          onChange={(e) => setContactFormData(prev => ({ ...prev, company: e.target.value }))}
                          placeholder="Nome da empresa"
                          className="text-sm border-emerald-200 dark:border-emerald-700 focus:border-emerald-500"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Valor do Serviço (R$)</label>
                      <Input
                        value={contactFormData.service_value}
                        onChange={(e) => setContactFormData(prev => ({ ...prev, service_value: e.target.value }))}
                        placeholder="0,00"
                        className="text-sm border-emerald-200 dark:border-emerald-700 focus:border-emerald-500"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={handleSaveContact}
                      size="sm"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Save className="w-3 h-3 mr-1" />
                      Salvar Alterações do Contato
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedContact.phone && (
                      <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-3 border-2 border-emerald-200 dark:border-emerald-700 shadow-sm">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-sm font-bold text-emerald-800 dark:text-emerald-200">{selectedContact.phone}</span>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-emerald-500/30 border border-emerald-300 dark:border-emerald-600"
                          onClick={(e) => {
                            e.preventDefault();
                            handleCopyPhone(selectedContact.phone!);
                          }}
                        >
                          <Copy className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </Button>
                      </div>
                    )}

                    {selectedContact.email && (
                      <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-3 border-2 border-emerald-200 dark:border-emerald-700 shadow-sm">
                        <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{selectedContact.email}</span>
                      </div>
                    )}

                    {selectedContact.company && (
                      <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-3 border-2 border-emerald-200 dark:border-emerald-700 shadow-sm">
                        <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{selectedContact.company}</span>
                      </div>
                    )}

                    {selectedContact.service_value && (
                      <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-3 border-2 border-emerald-200 dark:border-emerald-700 shadow-sm">
                        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                          💰 Valor: {formatCurrency(selectedContact.service_value)}
                        </span>
                      </div>
                    )}

                    {!selectedContact.phone && !selectedContact.email && !selectedContact.company && (
                      <div className="text-sm text-emerald-600 dark:text-emerald-400 text-center py-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-700">
                        ⚠️ Nenhuma informação de contato cadastrada
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <FormField
              control={form.control}
              name="tags"
              render={() => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Adicionar tag"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addTag}
                        disabled={!tagInput.trim()}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {watchedTags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {watchedTags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : deal ? "Atualizar" : "Criar Contrato"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>

      {/* Barra Lateral com Mais Opções */}
      <Sheet open={showSidebar} onOpenChange={setShowSidebar}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Mais Opções - {deal?.title}
            </SheetTitle>
            <SheetDescription>
              Opções avançadas e configurações adicionais para este contrato.
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-6">
            {/* Edição de Contato */}
            {selectedContact && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Informações do Contato
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingContact(!editingContact)}
                    className="h-7 px-2"
                  >
                    <Edit3 className="w-3 h-3 mr-1" />
                    {editingContact ? 'Cancelar' : 'Editar'}
                  </Button>
                </div>

                {editingContact ? (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-foreground">Nome Completo</label>
                      <Input
                        value={contactFormData.full_name}
                        onChange={(e) => setContactFormData(prev => ({ ...prev, full_name: e.target.value }))}
                        placeholder="Nome do contato"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-foreground">Email</label>
                      <Input
                        value={contactFormData.email}
                        onChange={(e) => setContactFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="email@exemplo.com"
                        type="email"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-foreground">Telefone</label>
                      <Input
                        value={contactFormData.phone}
                        onChange={(e) => setContactFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="(11) 99999-9999"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-foreground">Empresa</label>
                      <Input
                        value={contactFormData.company}
                        onChange={(e) => setContactFormData(prev => ({ ...prev, company: e.target.value }))}
                        placeholder="Nome da empresa"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-foreground">Valor do Serviço (R$)</label>
                      <Input
                        value={contactFormData.service_value}
                        onChange={(e) => setContactFormData(prev => ({ ...prev, service_value: e.target.value }))}
                        placeholder="0,00"
                        className="text-sm"
                      />
                    </div>
                    <Button
                      onClick={handleSaveContact}
                      size="sm"
                      className="w-full"
                    >
                      <Save className="w-3 h-3 mr-1" />
                      Salvar Alterações
                    </Button>
                  </div>
                ) : (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Nome:</span>
                      <span className="text-sm font-medium">{selectedContact.full_name}</span>
                    </div>
                    {selectedContact.email && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Email:</span>
                        <span className="text-sm">{selectedContact.email}</span>
                      </div>
                    )}
                    {selectedContact.phone && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Telefone:</span>
                        <span className="text-sm font-mono">{selectedContact.phone}</span>
                      </div>
                    )}
                    {selectedContact.company && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Empresa:</span>
                        <span className="text-sm">{selectedContact.company}</span>
                      </div>
                    )}
                    {selectedContact.service_value && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Valor do Serviço:</span>
                        <span className="text-sm font-semibold text-green-600">
                          {formatCurrency(selectedContact.service_value)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Ações Rápidas do Contato */}
            {selectedContact && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">⚡ Ações Rápidas</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleContactAction('call')}
                    className="justify-start"
                  >
                    📞 Ligar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleContactAction('whatsapp')}
                    className="justify-start"
                  >
                    💬 WhatsApp
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleContactAction('email')}
                    className="justify-start"
                  >
                    📧 Email
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start">
                    📅 Agendar
                  </Button>
                </div>
              </div>
            )}

            {/* Configurações Avançadas */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">⚙️ Configurações Avançadas</h4>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Archive className="w-4 h-4 mr-2" />
                  Arquivar Contrato
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  📋 Duplicar Contrato
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  📊 Gerar Relatório
                </Button>
              </div>
            </div>

            {/* Informações Técnicas */}
            {deal && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">🔧 Informações Técnicas</h4>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID:</span>
                    <span className="font-mono text-xs">{deal.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Criado em:</span>
                    <span>{new Date(deal.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Atualizado em:</span>
                    <span>{new Date(deal.updated_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </Dialog>
  );
}
