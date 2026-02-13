import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCRM } from "@/hooks/useCRM";
import { useCommercialLeads } from "@/hooks/useCommercialLeads";
import { useUserProfile } from "@/hooks/useUserProfile";
import { INSURANCE_TYPES, PATIENT_GENDERS, HealthInsuranceType, PatientGender } from "@/types/crm";
import { supabase } from "@/integrations/supabase/client";

const conversionSchema = z.object({
  insurance_type: z.enum(["convenio", "particular"]),
  insurance_name: z.string().optional(),
  cpf: z
    .string()
    .min(11, "CPF deve ter pelo menos 11 dígitos")
    .max(14, "CPF inválido")
    .optional()
    .or(z.literal("")),
  gender: z.enum(["masculino", "feminino", "outro", "prefiro_nao_dizer"]).optional(),
  payment_type: z.enum(["adiantado", "na_consulta"]),
});

type ConversionFormData = z.infer<typeof conversionSchema>;

interface ConversionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
  leadEmail?: string | null;
  leadPhone?: string | null;
  estimatedValue?: number | null;
}

export function ConversionModal({
  open,
  onOpenChange,
  leadId,
  leadName,
  leadEmail,
  leadPhone,
  estimatedValue,
}: ConversionModalProps) {
  const { toast } = useToast();
  const { createContact } = useCRM();
  const { convertLead } = useCommercialLeads();
  const { profile } = useUserProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<ConversionFormData>({
    resolver: zodResolver(conversionSchema),
    defaultValues: {
      insurance_type: "particular",
      payment_type: "na_consulta",
    },
  });

  const insuranceType = watch("insurance_type");

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return value;
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setValue("cpf", formatted);
  };

  const onSubmit = async (data: ConversionFormData) => {
    setIsSubmitting(true);

    try {
      // Buscar o lead completo para obter o procedure_id
      const { data: leadData, error: leadError } = await supabase
        .from("commercial_leads")
        .select("*")
        .eq("id", leadId)
        .single();

      if (leadError) {
        console.error("Erro ao buscar lead:", leadError);
      }

      // 1. Criar o contato (paciente) no CRM
      // Preparar custom_fields com procedure_id se existir
      const customFields: any = {};
      if ((leadData as any)?.procedure_id) {
        customFields.procedure_id = (leadData as any).procedure_id;
      }

      const contactData = {
        full_name: leadName,
        email: leadEmail || undefined,
        phone: leadPhone || undefined,
        insurance_type: data.insurance_type as HealthInsuranceType,
        insurance_name: data.insurance_type === "convenio" ? data.insurance_name : null,
        cpf: data.cpf || null,
        gender: data.gender as PatientGender | undefined,
        custom_fields: Object.keys(customFields).length > 0 ? customFields : undefined,
      };

      const newContact = await createContact(contactData);

      // 2. Converter o lead
      await convertLead.mutateAsync({
        leadId,
        contactId: newContact.id,
      });

      // 3. Se pagamento adiantado, criar transação financeira
      if (data.payment_type === "adiantado" && estimatedValue && estimatedValue > 0) {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // Buscar primeira categoria de entrada
          let { data: categories } = await supabase
            .from("financial_categories")
            .select("id")
            .eq("type", "entrada")
            .limit(1);

          // Se não existir categoria de entrada, criar uma automaticamente
          if (!categories || categories.length === 0) {
            if (!profile?.organization_id) {
              console.error('[ConversionModal] Não foi possível criar categoria: organization_id não encontrado');
            } else {
              console.log('[ConversionModal] Nenhuma categoria de entrada encontrada, criando categoria padrão "Receitas"');
              const { data: newCategory, error: categoryError } = await supabase
                .from('financial_categories')
                .insert({
                  name: 'Receitas',
                  type: 'entrada',
                  color: '#10b981', // Verde
                  is_system: false,
                  organization_id: profile.organization_id,
                })
                .select('id')
                .single();

              if (!categoryError && newCategory) {
                categories = [newCategory];
                console.log('[ConversionModal] ✅ Categoria "Receitas" criada automaticamente');
              } else {
                console.error('[ConversionModal] Erro ao criar categoria padrão:', categoryError);
              }
            }
          }

          // Buscar primeira conta
          const { data: accounts } = await supabase
            .from("financial_accounts")
            .select("id")
            .eq("is_active", true)
            .order("is_default", { ascending: false }) // Priorizar conta padrão
            .limit(1);

          if (categories && categories.length > 0 && accounts && accounts.length > 0) {
            await supabase.from("financial_transactions").insert({
              user_id: user.id,
              organization_id: profile?.organization_id,
              contact_id: newContact.id,
              category_id: categories[0].id,
              account_id: accounts[0].id,
              type: "entrada",
              amount: estimatedValue,
              description: `Consulta: ${leadName} (Pagamento Adiantado)`,
              date: new Date().toISOString().split('T')[0],
              status: "concluida",
              payment_method: "pix",
              tags: ["consulta-medica", "pagamento-adiantado"],
              metadata: {
                lead_id: leadId,
                contact_id: newContact.id,
                payment_type: "adiantado",
              },
            });
          }
        }
      }

      toast({
        title: "Paciente convertido com sucesso!",
        description: data.payment_type === "adiantado"
          ? "Pagamento adiantado registrado no financeiro."
          : "Pagamento será registrado após comparecimento na consulta.",
      });

      reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error converting lead:", error);
      toast({
        variant: "destructive",
        title: "Erro ao converter paciente",
        description: error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Converter em Paciente
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do paciente para concluir a conversão
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Informações Básicas (read-only) */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div>
              <span className="text-sm text-muted-foreground">Nome:</span>
              <p className="font-medium">{leadName}</p>
            </div>
            {leadEmail && (
              <div>
                <span className="text-sm text-muted-foreground">Email:</span>
                <p className="font-medium">{leadEmail}</p>
              </div>
            )}
            {leadPhone && (
              <div>
                <span className="text-sm text-muted-foreground">Telefone:</span>
                <p className="font-medium">{leadPhone}</p>
              </div>
            )}
            {estimatedValue && (
              <div>
                <span className="text-sm text-muted-foreground">Valor Estimado da 1ª Consulta:</span>
                <p className="font-medium">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(estimatedValue)}
                </p>
              </div>
            )}
          </div>

          {/* Tipo de Convênio */}
          <div className="space-y-2">
            <Label>Tipo de Atendimento *</Label>
            <RadioGroup
              value={insuranceType}
              onValueChange={(value) => setValue("insurance_type", value as "convenio" | "particular")}
              className="flex gap-4"
            >
              {INSURANCE_TYPES.map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={type.value} id={type.value} />
                  <Label htmlFor={type.value} className="cursor-pointer">
                    {type.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Nome do Convênio (condicional) */}
          {insuranceType === "convenio" && (
            <div className="space-y-2">
              <Label htmlFor="insurance_name">Nome do Convênio</Label>
              <Input
                id="insurance_name"
                {...register("insurance_name")}
                placeholder="Ex: Unimed, Bradesco Saúde..."
              />
            </div>
          )}

          {/* CPF e Gênero */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                {...register("cpf")}
                onChange={handleCPFChange}
                placeholder="000.000.000-00"
                maxLength={14}
              />
              {errors.cpf && (
                <p className="text-sm text-destructive">{errors.cpf.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gênero</Label>
              <Select
                value={watch("gender")}
                onValueChange={(value) => setValue("gender", value as PatientGender)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {PATIENT_GENDERS.map((gender) => (
                    <SelectItem key={gender.value} value={gender.value}>
                      {gender.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tipo de Pagamento */}
          <div className="space-y-2 p-4 border rounded-lg bg-primary/5">
            <Label className="text-base font-semibold">Forma de Pagamento *</Label>
            <RadioGroup
              value={watch("payment_type")}
              onValueChange={(value) => setValue("payment_type", value as "adiantado" | "na_consulta")}
              className="space-y-3"
            >
              <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-background cursor-pointer">
                <RadioGroupItem value="adiantado" id="adiantado" />
                <div className="flex-1">
                  <Label htmlFor="adiantado" className="cursor-pointer font-medium">
                    Pagamento Adiantado
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    O valor será lançado imediatamente no financeiro como pago
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-background cursor-pointer">
                <RadioGroupItem value="na_consulta" id="na_consulta" />
                <div className="flex-1">
                  <Label htmlFor="na_consulta" className="cursor-pointer font-medium">
                    Pagamento na Consulta
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    O valor será lançado no financeiro após confirmação de comparecimento
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Botões */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Convertendo...
                </>
              ) : (
                "Converter em Paciente"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
