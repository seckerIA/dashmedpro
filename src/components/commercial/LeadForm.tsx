import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCommercialLeads } from "@/hooks/useCommercialLeads";
import { useCommercialProcedures } from "@/hooks/useCommercialProcedures";
import { CommercialLead, CommercialLeadInsert } from "@/types/commercial";
import { COMMERCIAL_LEAD_STATUS_LABELS, COMMERCIAL_LEAD_ORIGIN_LABELS } from "@/types/commercial";
import { formatCurrencyInput, parseCurrencyToNumber, formatCurrency } from "@/lib/currency";
import { Loader2 } from "lucide-react";

const leadSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  origin: z.enum(['google', 'instagram', 'facebook', 'indication', 'website', 'other']),
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']),
  procedure_id: z.string().optional(),
  estimated_value: z.string().optional().transform((val) => val ? parseCurrencyToNumber(val) : undefined),
  notes: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface LeadFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: CommercialLead | null;
}

export function LeadForm({ open, onOpenChange, lead }: LeadFormProps) {
  const { createLead, updateLead } = useCommercialLeads();
  const { procedures, isLoading: isLoadingProcedures } = useCommercialProcedures();
  const isEditing = !!lead;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      origin: "other",
      status: "new",
      procedure_id: "",
      estimated_value: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (lead && open) {
      reset({
        name: lead.name,
        email: lead.email || "",
        phone: lead.phone || "",
        origin: lead.origin,
        status: lead.status,
        procedure_id: lead.procedure_id || "",
        estimated_value: lead.estimated_value ? formatCurrency(lead.estimated_value) : "",
        notes: lead.notes || "",
      });
    } else if (!lead && open) {
      reset({
        name: "",
        email: "",
        phone: "",
        origin: "other",
        status: "new",
        procedure_id: "",
        estimated_value: "",
        notes: "",
      });
    }
  }, [lead, open, reset]);

  const onSubmit = async (data: LeadFormData) => {
    try {
      // Buscar o procedimento selecionado para obter o valor estimado se não foi preenchido
      const selectedProcedure = procedures?.find(p => p.id === data.procedure_id);
      const estimatedValue = data.estimated_value || (selectedProcedure ? Number(selectedProcedure.price) : null);
      
      const leadData: CommercialLeadInsert = {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        origin: data.origin,
        status: data.status,
        procedure_id: data.procedure_id && data.procedure_id !== "none" ? data.procedure_id : null,
        estimated_value: estimatedValue,
        notes: data.notes || null,
      };

      if (isEditing && lead) {
        await updateLead.mutateAsync({ id: lead.id, updates: leadData });
      } else {
        await createLead.mutateAsync(leadData);
      }

      onOpenChange(false);
      reset();
    } catch (error) {
      console.error("Error submitting lead:", error);
    }
  };

  const handleEstimatedValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value);
    setValue("estimated_value", formatted, { shouldValidate: true });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Paciente" : "Novo Paciente"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Nome do paciente"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="email@exemplo.com"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="origin">Origem *</Label>
              <Select
                value={watch("origin")}
                onValueChange={(value) => setValue("origin", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(COMMERCIAL_LEAD_ORIGIN_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={watch("status")}
                onValueChange={(value) => setValue("status", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(COMMERCIAL_LEAD_STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="procedure_id">Procedimento de Interesse</Label>
              <Select
                value={watch("procedure_id") || "none"}
                onValueChange={(value) => {
                  setValue("procedure_id", value);
                  // Preencher valor estimado automaticamente se procedimento foi selecionado
                  const selectedProcedure = procedures?.find(p => p.id === value);
                  if (selectedProcedure && selectedProcedure.price) {
                    const currentValue = watch("estimated_value");
                    // Só preencher se o campo estiver vazio
                    if (!currentValue || currentValue.trim() === "") {
                      // Formatar o preço como moeda usando formatCurrency
                      const formattedPrice = formatCurrency(selectedProcedure.price);
                      setValue("estimated_value", formattedPrice);
                    }
                  }
                }}
                disabled={isLoadingProcedures}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingProcedures ? "Carregando..." : "Selecione o procedimento"} />
                </SelectTrigger>
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
                      Nenhum procedimento cadastrado
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimated_value">Valor Estimado da 1ª Consulta</Label>
            <Input
              id="estimated_value"
              type="text"
              value={watch("estimated_value") || ""}
              onChange={handleEstimatedValueChange}
              placeholder="R$ 0,00"
            />
            {watch("procedure_id") && watch("procedure_id") !== "none" && procedures?.find(p => p.id === watch("procedure_id"))?.price && (
              <p className="text-xs text-muted-foreground">
                Valor sugerido: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(procedures.find(p => p.id === watch("procedure_id"))?.price))}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Observações sobre o lead..."
              rows={4}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              isEditing ? "Salvar Alterações" : "Criar Paciente"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}









