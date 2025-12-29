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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus, UserPlus, Phone } from "lucide-react";
import { useCRM } from "@/hooks/useCRM";
import { useToast } from "@/hooks/use-toast";
import { CRMContact, CRMPipelineStage } from "@/types/crm";
import { useCommercialProcedures } from "@/hooks/useCommercialProcedures";
import {
  formatCurrencyInput,
  parseCurrencyToNumber,
  formatInitialCurrencyValue,
  formatCurrency,
} from "@/lib/currency";
import {
  formatPhoneInput,
  parsePhoneToNumber,
  formatPhone,
} from "@/lib/phone";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const contactSchema = z.object({
  full_name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  service: z.string().optional(),
  service_value: z.string().optional().transform((val) => parseCurrencyToNumber(val)),
  tags: z.array(z.string()).default([]),
  create_deal: z.boolean().default(false),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactFormProps {
  contact?: CRMContact;
  trigger?: React.ReactNode;
  initialStage?: CRMPipelineStage;
  onSuccess?: (dealId?: string) => void;
  onContactCreated?: (contactId: string) => void;
  forceOpen?: boolean;
  onCancel?: () => void;
  initialData?: {
    full_name?: string;
    email?: string;
    phone?: string;
    notes?: string;
  };
}

export function ContactForm({ contact, trigger, initialStage, onSuccess, onContactCreated, forceOpen, onCancel, initialData }: ContactFormProps) {
  const [open, setOpen] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const { createContact, updateContact, createDeal, isCreatingContact, isUpdatingContact } = useCRM();
  const { procedures, isLoading: isLoadingProcedures } = useCommercialProcedures();
  const { toast } = useToast();

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      full_name: contact?.full_name || initialData?.full_name || "",
      email: contact?.email || initialData?.email || "",
      phone: formatPhone(contact?.phone || initialData?.phone || ""),
      company: contact?.company || "",
      position: contact?.position || "",
      service: contact?.service || (contact?.custom_fields as any)?.procedure_id || "none",
      service_value: (contact?.service_value?.toString() || "") as any,
      tags: contact?.tags || [],
      create_deal: !!initialStage,
    },
  });

  // Abrir automaticamente quando forceOpen é true
  useEffect(() => {
    console.log('🔄 ContactForm useEffect - forceOpen:', forceOpen);
    if (forceOpen !== undefined) {
      console.log('📂 Abrindo dialog com forceOpen:', forceOpen);
      setOpen(forceOpen);
    }
  }, [forceOpen]);

  // Atualizar form quando initialData mudar
  useEffect(() => {
    if (initialData && open && !contact) {
      form.reset({
        full_name: initialData.full_name || "",
        email: initialData.email || "",
        phone: initialData.phone ? formatPhone(initialData.phone) : "",
        company: "",
        position: "",
        service: "none",
        service_value: "" as any,
        tags: [],
        create_deal: !!initialStage,
      });
    }
  }, [initialData, open, contact, initialStage, form]);

  const watchedTags = form.watch("tags");
  const watchedService = form.watch("service");
  
  // Atualizar valor automaticamente quando um procedimento for selecionado
  useEffect(() => {
    if (watchedService && watchedService !== "none") {
      const selectedProcedure = procedures?.find(p => p.id === watchedService);
      if (selectedProcedure && selectedProcedure.price) {
        const currentValue = form.getValues("service_value");
        // Só atualizar se o campo estiver vazio
        if (!currentValue || currentValue === "") {
          // Formatar o preço como moeda usando formatCurrency
          const formattedPrice = formatCurrency(selectedProcedure.price);
          form.setValue("service_value", formattedPrice);
        }
      }
    }
  }, [watchedService, procedures, form]);

  const onSubmit = async (data: ContactFormData) => {
    console.log('📝 ContactForm onSubmit chamado com data:', data);
    
    // Função auxiliar para criar timeout em promises
    const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
        ),
      ]);
    };

    try {
      const { create_deal, ...contactData } = data;
      
      // Buscar o procedimento selecionado para obter o valor
      const selectedProcedure = procedures?.find(p => p.id === contactData.service);
      const serviceValue = contactData.service_value || (selectedProcedure ? Number(selectedProcedure.price) : null);
      
      // Preparar custom_fields com procedure_id se houver procedimento selecionado
      console.log('🔍 ContactForm - Preparando custom_fields:', {
        contactData_service: contactData.service,
        contactData_service_type: typeof contactData.service,
        contact_custom_fields: contact?.custom_fields,
        contact_custom_fields_type: typeof contact?.custom_fields,
      });
      
      // Inicializar customFields a partir do contato existente ou objeto vazio
      const existingCustomFields = contact?.custom_fields as any;
      const customFields: any = existingCustomFields && typeof existingCustomFields === 'object' 
        ? { ...existingCustomFields } 
        : {};
      
      console.log('🔍 ContactForm - customFields inicial:', customFields);
      
      // Adicionar ou remover procedure_id baseado na seleção
      if (contactData.service && contactData.service !== "none") {
        customFields.procedure_id = contactData.service;
        console.log('✅ ContactForm - Adicionando procedure_id:', contactData.service);
      } else {
        delete customFields.procedure_id;
        console.log('🗑️ ContactForm - Removendo procedure_id (service é "none" ou vazio)');
      }
      
      console.log('🔍 ContactForm - customFields final:', customFields);
      console.log('🔍 ContactForm - customFields keys:', Object.keys(customFields));
      
      // Remover campos que não existem na tabela crm_contacts
      // (service e service_value não são campos do crm_contacts, apenas do formulário)
      const { service, service_value, ...contactDataForDB } = contactData;
      
      // Remover formatação do telefone antes de salvar (manter apenas números)
      if (contactDataForDB.phone) {
        contactDataForDB.phone = parsePhoneToNumber(contactDataForDB.phone);
      }
      
      // Adicionar custom_fields com procedure_id
      contactDataForDB.custom_fields = customFields;
      
      console.log('💾 ContactForm - Salvando contato com custom_fields:', {
        customFields,
        procedure_id: customFields.procedure_id,
        custom_fields_to_save: contactDataForDB.custom_fields,
        custom_fields_to_save_type: typeof contactDataForDB.custom_fields,
        custom_fields_to_save_keys: Object.keys(contactDataForDB.custom_fields || {}),
        full_contactDataForDB: contactDataForDB,
      });
      
      if (contact) {
        console.log('✏️ Atualizando contato existente:', contact.id);
        // Atualizar contato existente
        // IMPORTANTE: Garantir que custom_fields seja incluído explicitamente
        const updateData = {
          ...contactDataForDB,
          custom_fields: contactDataForDB.custom_fields, // Garantir que custom_fields está presente
          updated_at: new Date().toISOString(),
        };
        console.log('📤 ContactForm - Enviando dados para updateContact:', {
          updateData,
          custom_fields: updateData.custom_fields,
          custom_fields_type: typeof updateData.custom_fields,
          custom_fields_keys: updateData.custom_fields ? Object.keys(updateData.custom_fields) : [],
        });
        
        try {
          await withTimeout(
            updateContact({
              contactId: contact.id,
              data: updateData,
            }),
            30000, // 30 segundos de timeout
            "Timeout ao atualizar contato. Tente novamente."
          );
          
          toast({
            title: "Contato atualizado",
            description: "O contato foi atualizado com sucesso.",
          });
          
          setOpen(false);
          form.reset();
          onSuccess?.();
        } catch (updateError) {
          console.error('❌ Erro ao atualizar contato:', updateError);
          throw updateError;
        }
      } else {
        console.log('➕ Criando novo contato...');
        // Criar novo contato (sem service e service_value)
        // IMPORTANTE: Garantir que custom_fields seja incluído explicitamente
        // A tabela crm_contacts usa 'full_name', não 'name'
        const createData = {
          ...contactDataForDB,
          custom_fields: contactDataForDB.custom_fields, // Garantir que custom_fields está presente
        };
        console.log('💾 ContactForm - Dados que serão enviados para createContact:', {
          createData,
          custom_fields: createData.custom_fields,
          custom_fields_type: typeof createData.custom_fields,
          custom_fields_keys: createData.custom_fields ? Object.keys(createData.custom_fields) : [],
        });
        
        let newContact: CRMContact | null = null;
        
        try {
          // Criar contato com timeout
          newContact = await withTimeout(
            createContact(createData as any),
            30000, // 30 segundos de timeout
            "Timeout ao criar contato. Tente novamente."
          );
          
          console.log('✅ Contato criado:', {
            id: newContact.id,
            custom_fields: newContact.custom_fields,
            custom_fields_type: typeof newContact.custom_fields,
          });
        } catch (contactError) {
          console.error('❌ Erro ao criar contato:', contactError);
          // Fechar o formulário mesmo em caso de erro para não travar a UI
          setOpen(false);
          form.reset();
          throw contactError;
        }
        
        // Criar contrato automaticamente se solicitado
        if (create_deal && newContact) {
          console.log('📄 Criando deal automático...');
          const dealStage = initialStage || "lead_novo";
          
          try {
            // Criar deal com timeout
            const newDeal = await withTimeout(
              createDeal({
                contact_id: newContact.id,
                title: contactData.full_name,
                description: `Contato adicionado automaticamente ao estágio`,
                stage: dealStage,
                value: serviceValue || null,
                probability: 0,
              }),
              30000, // 30 segundos de timeout
              "Timeout ao criar contrato. O contato foi criado, mas o contrato não pôde ser adicionado ao pipeline."
            );
            
            console.log('✅ Deal criado:', newDeal);
            
            toast({
              title: "Contato e Contrato criados",
              description: `O contato foi criado e adicionado ao pipeline.`,
            });
            
            setOpen(false);
            form.reset();
            console.log('🔔 Chamando onSuccess com dealId:', newDeal.id);
            // Chamar callback com contactId quando contato for criado (mesmo com deal)
            if (newContact?.id) {
              console.log('🔔 Chamando onContactCreated com contactId:', newContact.id);
              onContactCreated?.(newContact.id);
            }
            onSuccess?.(newDeal.id);
            return;
          } catch (dealError) {
            console.error('❌ Erro ao criar deal:', dealError);
            // O contato foi criado, mas o deal falhou
            // Ainda assim, fechar o formulário e mostrar mensagem
            toast({
              variant: "destructive",
              title: "Contato criado, mas erro ao criar contrato",
              description: dealError instanceof Error 
                ? dealError.message 
                : "O contato foi criado, mas não foi possível adicioná-lo ao pipeline. Tente adicionar manualmente.",
            });
            
            setOpen(false);
            form.reset();
            // Chamar callback com contactId mesmo se o deal falhou
            if (newContact?.id) {
              onContactCreated?.(newContact.id);
            }
            onSuccess?.();
            return;
          }
        } else {
          console.log('ℹ️ Deal não será criado (create_deal:', create_deal, ')');
          toast({
            title: "Contato criado",
            description: "O contato foi criado com sucesso.",
          });
        }
        
        // Chamar callback com contactId quando contato for criado
        if (newContact?.id) {
          console.log('🔔 Chamando onContactCreated com contactId:', newContact.id);
          onContactCreated?.(newContact.id);
        }
        
        setOpen(false);
        form.reset();
        console.log('🔔 Chamando onSuccess sem dealId');
        onSuccess?.();
      }
    } catch (error) {
      console.error('❌ Erro no onSubmit:', error);
      
      // Garantir que o formulário sempre feche mesmo em caso de erro
      // para não travar a UI
      setOpen(false);
      form.reset();
      
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar contato",
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

  const isLoading = isCreatingContact || isUpdatingContact;

  const handleOpenChange = (newOpen: boolean) => {
    console.log('🔧 handleOpenChange chamado - newOpen:', newOpen, 'forceOpen:', forceOpen);
    
    // Se forceOpen é true e está tentando fechar, chamar onCancel se disponível
    // mas ainda permitir fechar se onCancel foi fornecido (para controle externo)
    if (forceOpen && !newOpen) {
      console.log('⚠️ Tentativa de fechar Dialog com forceOpen=true');
      if (onCancel) {
        console.log('📞 Chamando onCancel para controle externo');
        onCancel();
        return; // Deixar o componente pai controlar o estado
      }
      console.log('⚠️ Bloqueando fechamento - forceOpen sem onCancel');
      return;
    }
    
    setOpen(newOpen);
    if (!newOpen) {
      console.log('🧹 Fechando dialog e limpando formulário');
      // Limpar o formulário quando fechar
      form.reset();
      if (onCancel) {
        console.log('📞 Chamando onCancel');
        onCancel();
      }
    }
  };

  // Log para debug
  useEffect(() => {
    console.log('🔍 ContactForm estado - open:', open, 'forceOpen:', forceOpen, 'Dialog open:', forceOpen || open);
  }, [open, forceOpen]);

  return (
    <Dialog open={forceOpen || open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            {contact ? "Editar Contato" : "Novo Contato"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {contact ? "Editar Contato" : "Novo Contato"}
          </DialogTitle>
          <DialogDescription>
            {contact 
              ? "Atualize as informações do contato existente." 
              : "Preencha as informações para criar um novo contato no CRM."
            }
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="email@exemplo.com" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-blue-500" />
                      Telefone
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="(21) 99940-9021" 
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          const formatted = formatPhoneInput(e.target.value);
                          field.onChange(formatted);
                        }}
                        className="border-blue-200 focus:border-blue-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="service"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Procedimento de Interesse</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={isLoadingProcedures}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingProcedures ? "Carregando procedimentos..." : "Selecione o procedimento de interesse"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhum procedimento específico</SelectItem>
                      {isLoadingProcedures ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          Carregando procedimentos...
                        </div>
                      ) : procedures && procedures.filter(p => p.is_active).length > 0 ? (
                        procedures.filter(p => p.is_active).map((procedure) => (
                          <SelectItem key={procedure.id} value={procedure.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{procedure.name}</span>
                              {procedure.price && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(procedure.price))}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-muted-foreground">
                          Nenhum procedimento cadastrado. Cadastre procedimentos na aba Comercial.
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="service_value"
              render={({ field }) => {
                const selectedProcedure = procedures?.find(p => p.id === watchedService);
                return (
                  <FormItem>
                    <FormLabel>Valor do Procedimento</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="R$ 0,00"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          const formattedValue = formatCurrencyInput(e.target.value);
                          field.onChange(formattedValue);
                        }}
                      />
                    </FormControl>
                    {selectedProcedure && selectedProcedure.price && (
                      <p className="text-xs text-muted-foreground">
                        Valor sugerido: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(selectedProcedure.price))}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

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

            {!contact && (
              <FormField
                control={form.control}
                name="create_deal"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Criar contrato automaticamente
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Adicionar este contato como "Lead Novo" no pipeline de vendas
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-2 pt-4">
              {!forceOpen && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
              )}
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : contact ? "Atualizar" : "Criar Contato"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
