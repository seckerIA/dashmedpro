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
import { AVAILABLE_SERVICES } from "@/constants/services";
import {
  formatCurrencyInput,
  parseCurrencyToNumber,
  formatInitialCurrencyValue,
} from "@/lib/currency";
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
  forceOpen?: boolean;
  onCancel?: () => void;
}

export function ContactForm({ contact, trigger, initialStage, onSuccess, forceOpen, onCancel }: ContactFormProps) {
  const [open, setOpen] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const { createContact, updateContact, createDeal, isCreatingContact, isUpdatingContact } = useCRM();
  const { toast } = useToast();

  // Abrir automaticamente quando forceOpen é true
  useEffect(() => {
    console.log('🔄 ContactForm useEffect - forceOpen:', forceOpen);
    if (forceOpen !== undefined) {
      console.log('📂 Abrindo dialog com forceOpen:', forceOpen);
      setOpen(forceOpen);
    }
  }, [forceOpen]);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      full_name: contact?.full_name || "",
      email: contact?.email || "",
      phone: contact?.phone || "",
      company: contact?.company || "",
      position: contact?.position || "",
      service: contact?.service || "none",
      service_value: (contact?.service_value?.toString() || "") as any,
      tags: contact?.tags || [],
      create_deal: !!initialStage,
    },
  });

  const watchedTags = form.watch("tags");

  const onSubmit = async (data: ContactFormData) => {
    console.log('📝 ContactForm onSubmit chamado com data:', data);
    try {
      const { create_deal, ...contactData } = data;
      
      // Converter "none" para null para o banco de dados
      if (contactData.service === "none") {
        contactData.service = undefined;
      }
      
      // Extrair service_value antes de remover (será usado para criar o deal)
      const serviceValue = contactData.service_value;
      
      // Remover campos que não existem na tabela crm_contacts
      // (service e service_value não são campos do crm_contacts, apenas do formulário)
      const { service, service_value, ...contactDataForDB } = contactData;
      
      if (contact) {
        console.log('✏️ Atualizando contato existente:', contact.id);
        // Atualizar contato existente
        await updateContact({
          contactId: contact.id,
          data: {
            ...contactDataForDB,
            updated_at: new Date().toISOString(),
          },
        });
        toast({
          title: "Contato atualizado",
          description: "O contato foi atualizado com sucesso.",
        });
      } else {
        console.log('➕ Criando novo contato...');
        // Criar novo contato (sem service e service_value)
        const newContact = await createContact(contactDataForDB as any);
        console.log('✅ Contato criado:', newContact);
        
        // Criar contrato automaticamente se solicitado
        if (create_deal && newContact) {
          console.log('📄 Criando deal automático...');
          const dealStage = initialStage || "lead_novo";
          const newDeal = await createDeal({
            contact_id: newContact.id,
            title: contactData.full_name,
            description: `Contato adicionado automaticamente ao estágio`,
            stage: dealStage,
            value: serviceValue || null,
            probability: 0,
          });
          console.log('✅ Deal criado:', newDeal);
          
          toast({
            title: "Contato e Contrato criados",
            description: `O contato foi criado e adicionado ao pipeline.`,
          });
          
          setOpen(false);
          form.reset();
          console.log('🔔 Chamando onSuccess com dealId:', newDeal.id);
          onSuccess?.(newDeal.id);
          return;
        } else {
          console.log('ℹ️ Deal não será criado (create_deal:', create_deal, ')');
          toast({
            title: "Contato criado",
            description: "O contato foi criado com sucesso.",
          });
        }
      }
      
      setOpen(false);
      form.reset();
      console.log('🔔 Chamando onSuccess sem dealId');
      onSuccess?.();
    } catch (error) {
      console.error('❌ Erro no onSubmit:', error);
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
    
    // Se forceOpen é true, não permitir fechar
    if (forceOpen && !newOpen) {
      console.log('⚠️ Tentativa de fechar Dialog com forceOpen=true - bloqueando');
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
                        placeholder="(11) 99999-9999" 
                        {...field}
                        className="border-blue-200 focus:border-blue-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da empresa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo</FormLabel>
                    <FormControl>
                      <Input placeholder="Cargo na empresa" {...field} />
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
                  <FormLabel>Serviço de Interesse</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o serviço de interesse" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhum serviço específico</SelectItem>
                      {AVAILABLE_SERVICES.map((service) => (
                        <SelectItem key={service.value} value={service.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${service.color}`} />
                            {service.label}
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
              name="service_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor do Serviço</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="R$ 0,00"
                      {...field}
                      onChange={(e) => {
                        const formattedValue = formatCurrencyInput(e.target.value);
                        field.onChange(formattedValue);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
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
