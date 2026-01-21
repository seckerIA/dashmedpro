import { useState, useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { supabase } from "@/integrations/supabase/client";
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
import { X, Plus, UserPlus, Phone, AlertCircle } from "lucide-react";
import { useCRM } from "@/hooks/useCRM";
import { useToast } from "@/hooks/use-toast";
import { CRMContact, CRMPipelineStage } from "@/types/crm";
import { useCommercialProcedures } from "@/hooks/useCommercialProcedures";
import { useCommercialLeads } from "@/hooks/useCommercialLeads";
import { COMMERCIAL_LEAD_ORIGIN_LABELS } from "@/types/commercial";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/hooks/useAuth";
import { useSecretaryDoctors } from "@/hooks/useSecretaryDoctors";
import { ProcedureForm } from "@/components/commercial/ProcedureForm";
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
  origin: z.enum(['google', 'instagram', 'facebook', 'indication', 'website', 'other']).default('other'),
  company: z.string().optional(),
  position: z.string().optional(),
  notes: z.string().optional(),
  service: z.string().optional(),
  service_value: z.string()
    .min(1, "Valor da consulta é obrigatório")
    .refine(
      (val) => {
        const numValue = parseCurrencyToNumber(val);
        return numValue !== null && numValue > 0;
      },
      {
        message: "Valor da consulta deve ser maior que zero",
      }
    ),
  tags: z.array(z.string()).default([]),
  create_deal: z.boolean().default(true),
  assigned_to: z.string().optional(),
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
  const [showProcedureForm, setShowProcedureForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const forceOpenRef = useRef<boolean | undefined>(forceOpen);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { createContact, updateContact, createDeal } = useCRM();
  const { isSecretaria, isAdmin } = useUserProfile();
  const { procedures, isLoading: isLoadingProcedures } = useCommercialProcedures();
  const { createLead } = useCommercialLeads();
  const { toast } = useToast();

  // Get linked doctors
  const { doctors: linkedDoctors } = useSecretaryDoctors();

  // Determine available assignees
  const canAssign = isSecretaria || isAdmin;

  // If secretary has only one doctor, auto-assign
  const defaultAssignedTo = isSecretaria && linkedDoctors.length === 1 ? linkedDoctors[0].id : (user?.id || "");

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      full_name: contact?.full_name || initialData?.full_name || "",
      email: contact?.email || initialData?.email || "",
      phone: formatPhone(contact?.phone || initialData?.phone || ""),
      origin: (contact?.custom_fields as any)?.origin || "other",
      company: contact?.company || "",
      position: contact?.position || "",
      notes: initialData?.notes || (contact?.custom_fields as any)?.notes || "",
      service: contact?.service || (contact?.custom_fields as any)?.procedure_id || "none",
      service_value: (contact?.service_value?.toString() || "") as any,
      tags: contact?.tags || [],
      create_deal: !contact ? true : !!initialStage, // Sempre true para novos contatos
      assigned_to: defaultAssignedTo,
    },
  });

  // Verificar se existe procedimento CONSULTA
  const hasConsultationProcedure = useMemo(() => {
    if (!procedures || procedures.length === 0) return false;
    return procedures.some(
      (p) =>
        p.is_active &&
        (p.name.toUpperCase() === "CONSULTA" || p.category === "consultation")
    );
  }, [procedures]);

  const consultationProcedure = useMemo(() => {
    if (!procedures || procedures.length === 0) return null;
    return (
      procedures.find(
        (p) =>
          p.is_active &&
          (p.name.toUpperCase() === "CONSULTA" || p.category === "consultation")
      ) || null
    );
  }, [procedures]);

  // Abrir automaticamente quando forceOpen é true
  useEffect(() => {
    if (forceOpenRef.current !== forceOpen) {
      forceOpenRef.current = forceOpen;
      if (forceOpen !== undefined) {
        setOpen(forceOpen);
      }
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
        create_deal: true, // Sempre true para novos contatos
      });
    }
  }, [initialData, open, contact, initialStage, form]);

  // Update default assigned_to when doctors load
  useEffect(() => {
    if (isSecretaria && linkedDoctors.length === 1 && !contact) {
      form.setValue('assigned_to', linkedDoctors[0].id);
    } else if (!isSecretaria && user?.id && !contact) {
      // Se não for secretaria (ou seja, medico/admin criando pra si), default é self
      // Mas se for admin e quiser escolher outro, o campo select permitirá
      // Por padrão, já inicializamos com user.id
    }
  }, [linkedDoctors, isSecretaria, user, contact, form]);

  const watchedTags = form.watch("tags");
  const watchedService = form.watch("service");
  const watchedServiceValue = form.watch("service_value");

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

  // Quando procedimento CONSULTA for criado ou aparecer, selecionar automaticamente se não houver seleção
  useEffect(() => {
    if (consultationProcedure && !contact && (!watchedService || watchedService === "none")) {
      form.setValue("service", consultationProcedure.id);
      const currentValue = form.getValues("service_value");
      // Só preencher o valor se o campo estiver vazio e o procedimento tiver preço
      if ((!currentValue || currentValue === "") && consultationProcedure.price && consultationProcedure.price > 0) {
        const formattedPrice = formatCurrency(consultationProcedure.price);
        form.setValue("service_value", formattedPrice);
      }
    }
  }, [consultationProcedure, contact, watchedService, form]);

  const onSubmit = async (data: ContactFormData) => {
    // Bloquear dupla submissão
    if (isSubmitting) {
      console.log('⚠️ ContactForm - Submissão já em andamento, ignorando');
      return;
    }
    setIsSubmitting(true);

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
      // Forçar refresh da sessão antes de salvar (evita stale connection após idle)
      await supabase.auth.refreshSession().catch(() => {});

      // Verificar se procedures carregaram
      if (isLoadingProcedures) {
        toast({
          variant: "destructive",
          title: "Aguarde",
          description: "Carregando procedimentos...",
        });
        return;
      }

      // Validação: verificar se há procedimento CONSULTA para novos contatos
      if (!contact && !hasConsultationProcedure) {
        toast({
          variant: "destructive",
          title: "Valor da consulta não cadastrado",
          description: "É necessário cadastrar o valor da consulta antes de criar um novo paciente.",
        });
        return;
      }

      // Validação já é feita pelo schema Zod, não precisa duplicar aqui

      // Para novos contatos, sempre criar deal
      const create_deal = !contact ? true : data.create_deal;
      const { create_deal: _, ...contactData } = data;

      // Buscar o procedimento selecionado para obter o valor
      const selectedProcedure = procedures?.find(p => p.id === contactData.service);
      const parsedServiceValue = contactData.service_value ? parseCurrencyToNumber(contactData.service_value) : null;
      const serviceValue = parsedServiceValue || (selectedProcedure ? Number(selectedProcedure.price) : null);

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

      // Adicionar origin aos custom_fields
      if (contactData.origin) {
        customFields.origin = contactData.origin;
      }

      // Adicionar notes aos custom_fields
      if (contactData.notes) {
        customFields.notes = contactData.notes;
      }

      console.log('🔍 ContactForm - customFields final:', customFields);
      console.log('🔍 ContactForm - customFields keys:', Object.keys(customFields));

      // Remover campos que não existem na tabela crm_contacts
      // service, service_value, origin, notes e assigned_to não são colunas diretas
      const { service, service_value, origin, notes, assigned_to, ...contactDataForDB } = contactData;

      // Adicionar service_value ao objeto de dados para salvar (esta coluna existe)
      if (serviceValue) {
        (contactDataForDB as any).service_value = serviceValue;
      }

      // Remover formatação do telefone antes de salvar (manter apenas números)
      if (contactDataForDB.phone) {
        contactDataForDB.phone = parsePhoneToNumber(contactDataForDB.phone);
      }

      // Adicionar custom_fields com procedure_id, origin e notes
      (contactDataForDB as any).custom_fields = customFields;

      if (contact) {
        // Atualizar contato existente
        // IMPORTANTE: Garantir que custom_fields seja incluído explicitamente
        const updateData = {
          ...contactDataForDB,
          custom_fields: contactDataForDB.custom_fields, // Garantir que custom_fields está presente
          updated_at: new Date().toISOString(),
        };

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
        // Criar novo contato
        // IMPORTANTE: Garantir que custom_fields e service_value sejam incluídos explicitamente
        // A tabela crm_contacts usa 'full_name', não 'name'
        const createData = {
          ...contactDataForDB,
          custom_fields: contactDataForDB.custom_fields, // Garantir que custom_fields está presente
          service_value: serviceValue || null, // Incluir service_value se houver
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

          // NOTA: Não criamos commercial_lead aqui para evitar duplicação
          // O deal do CRM já representa o lead no pipeline
        } catch (contactError) {
          console.error('❌ Erro ao criar contato:', contactError);
          // Fechar o formulário mesmo em caso de erro para não travar a UI
          setOpen(false);
          form.reset();
          throw contactError;
        }

        // Criar contrato automaticamente (sempre para novos contatos)
        if (create_deal && newContact) {
          console.log('📄 Criando deal automático...');
          // Sempre usar "lead_novo" para novos contatos
          const dealStage = "lead_novo";

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
                assigned_to: data.assigned_to || user.id, // Pass assigned_to
              }),
              30000, // 30 segundos de timeout
              "Timeout ao criar contrato. O contato foi criado, mas o contrato não pôde ser adicionado ao pipeline."
            );

            console.log('✅ Deal criado:', newDeal);

            // Invalidar cache de deals para garantir que apareça imediatamente no pipeline
            queryClient.invalidateQueries({
              queryKey: ['crm-deals'],
              exact: false
            });

            // -------------------------------------------------------------
            // Criar registro em commercial_leads para aparecer na aba "Leads & Conversões"
            // -------------------------------------------------------------
            try {
              console.log('🔄 Criando registro espelho em commercial_leads...');

              // Preparar dados para commercial_leads
              // IMPORTANTE: user_id deve ser o DOUTOR RESPONSÁVEL (assigned_to) se houver,
              // caso contrário o criador (user.id). Se o lead ficar com ID da secretária, o médico não vê.
              const leadOwnerId = data.assigned_to || user.id || newContact.user_id;

              const leadData: any = {
                user_id: leadOwnerId,
                organization_id: newContact.organization_id, // Add organization_id from contact
                name: newContact.full_name,
                email: newContact.email || null,
                phone: newContact.phone || null,
                origin: (customFields.origin || 'other') as any,
                status: 'new', // Status inicial padrão
                contact_id: newContact.id,
                estimated_value: serviceValue || null,
                procedure_id: customFields.procedure_id || null,
                notes: customFields.notes || null,
                created_at: newContact.created_at || new Date().toISOString()
              };

              const { error: leadError } = await supabase
                .from('commercial_leads')
                .insert(leadData);

              if (leadError) {
                console.error('⚠️ Erro ao criar commercial_lead espelho:', leadError);
              } else {
                console.log('✅ commercial_lead espelho criado com sucesso para:', leadOwnerId);
                queryClient.invalidateQueries({ queryKey: ["commercial-leads"] });
                queryClient.invalidateQueries({ queryKey: ["commercial-metrics"] });
              }
            } catch (err) {
              console.error('⚠️ Erro não bloqueante ao criar commercial_lead:', err);
            }
            // -------------------------------------------------------------

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

          // Se não criou deal, ainda assim criar commercial_lead se for novo contato
          if (newContact) {
            try {
              console.log('🔄 Criando registro espelho em commercial_leads (sem deal)...');

              const leadOwnerId = data.assigned_to || user.id || newContact.user_id;

              const leadData: any = {
                user_id: leadOwnerId,
                organization_id: newContact.organization_id, // Add organization_id from contact
                name: newContact.full_name,
                email: newContact.email || null,
                phone: newContact.phone || null,
                origin: (customFields.origin || 'other') as any,
                status: 'new', // Status inicial padrão
                contact_id: newContact.id,
                estimated_value: serviceValue || null,
                procedure_id: customFields.procedure_id || null,
                notes: customFields.notes || null,
                created_at: newContact.created_at || new Date().toISOString()
              };

              const { error: leadError } = await supabase
                .from('commercial_leads')
                .insert(leadData);

              if (leadError) {
                console.error('⚠️ Erro ao criar commercial_lead espelho:', leadError);
              } else {
                console.log('✅ commercial_lead espelho criado com sucesso para:', leadOwnerId);
                queryClient.invalidateQueries({ queryKey: ["commercial-leads"] });
                queryClient.invalidateQueries({ queryKey: ["commercial-metrics"] });
              }
            } catch (err) {
              console.error('⚠️ Erro não bloqueante ao criar commercial_lead:', err);
            }
          }

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
    } finally {
      setIsSubmitting(false);
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

  const isLoading = isSubmitting;

  const handleOpenChange = (newOpen: boolean) => {
    // Se não há procedimento CONSULTA e é um novo contato, avisar mas permitir fechar
    if (!contact && !hasConsultationProcedure && !newOpen) {
      // Se estiver tentando fechar, permitir
    } else if (!contact && !hasConsultationProcedure && newOpen) {
      // Se estiver abrindo e não tem procedimento, mostrar toast e abrir form de procedimento
      // Mas não impedir de abrir o modal principal
      if (!showProcedureForm) {
        setShowProcedureForm(true);
      }
    }

    // Se forceOpen é true e está tentando fechar, chamar onCancel se disponível
    // mas ainda permitir fechar se onCancel foi fornecido (para controle externo)
    if (forceOpen && !newOpen) {
      if (onCancel) {
        onCancel();
        return; // Deixar o componente pai controlar o estado
      }
      return;
    }

    setOpen(newOpen);
    if (!newOpen) {
      // Limpar o formulário quando fechar
      form.reset();
      if (onCancel) {
        onCancel();
      }
    }
  };

  return (
    <Dialog open={forceOpen !== undefined ? forceOpen : open} onOpenChange={handleOpenChange}>
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

            {(canAssign && linkedDoctors.length > 0) && (
              <FormField
                control={form.control}
                name="assigned_to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável (Médico)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o médico responsável" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {linkedDoctors.map((doc) => (
                          <SelectItem key={doc.id} value={doc.id}>
                            {doc.full_name || doc.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="(11) 99999-8888"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          const formatted = formatPhoneInput(e.target.value);
                          field.onChange(formatted);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="origin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Origem *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a origem do lead" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(COMMERCIAL_LEAD_ORIGIN_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                const isEmpty = !field.value || field.value === "";
                const showAlert = !contact && (!hasConsultationProcedure || isEmpty);

                return (
                  <FormItem>
                    <FormLabel>Valor Estimado da 1ª Consulta *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="R$ 0,00"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          const formattedValue = formatCurrencyInput(e.target.value);
                          field.onChange(formattedValue);
                        }}
                        className={showAlert ? "border-red-500 focus:border-red-500" : ""}
                      />
                    </FormControl>
                    {selectedProcedure && selectedProcedure.price && (
                      <p className="text-xs text-muted-foreground">
                        Valor sugerido: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(selectedProcedure.price))}
                      </p>
                    )}
                    {showAlert && (
                      <div className="mt-2 p-3 rounded-lg border-2 border-red-500 bg-red-50 dark:bg-red-950/20">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">
                              É necessário cadastrar o valor da consulta para criar um novo paciente.
                            </p>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                if (!hasConsultationProcedure) {
                                  setShowProcedureForm(true);
                                } else {
                                  // Se já existe procedimento, apenas focar no campo
                                  form.setFocus("service_value");
                                }
                              }}
                            >
                              {!hasConsultationProcedure
                                ? "Cadastrar Valor da Consulta"
                                : "Preencher Valor"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações sobre o paciente..."
                      {...field}
                      rows={3}
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


            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (onCancel) {
                    onCancel();
                  } else {
                    setOpen(false);
                  }
                }}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : contact ? "Atualizar" : "Criar Contato"}
              </Button>
            </div>
          </form>
        </Form>

        {/* Modal para cadastrar procedimento CONSULTA */}
        <ProcedureForm
          open={showProcedureForm}
          onOpenChange={(open) => {
            // Só permitir fechar se já houver procedimento CONSULTA cadastrado
            if (!open && !hasConsultationProcedure && !contact) {
              // Não permitir fechar se não há procedimento e é novo contato
              return;
            }
            setShowProcedureForm(open);
          }}
          procedure={null}
          required={!contact && !hasConsultationProcedure} // Obrigatório se não há procedimento e é novo contato
          initialData={{
            name: "CONSULTA",
            category: "consultation",
            is_active: true,
          }}
          onSuccess={(newProcedure) => {
            // Invalidar cache e atualizar procedimentos
            queryClient.invalidateQueries({ queryKey: ["commercial-procedures"] });
            if (newProcedure) {
              // Selecionar automaticamente o procedimento criado
              form.setValue("service", newProcedure.id);
              if (newProcedure.price) {
                form.setValue("service_value", formatCurrency(newProcedure.price));
              }
              // Fechar o modal de procedimento
              setShowProcedureForm(false);
            }
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
