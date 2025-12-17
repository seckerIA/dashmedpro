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
import { CommercialLead, CommercialLeadInsert } from "@/types/commercial";
import { COMMERCIAL_LEAD_STATUS_LABELS, COMMERCIAL_LEAD_ORIGIN_LABELS } from "@/types/commercial";
import { formatCurrencyInput, parseCurrencyToNumber } from "@/lib/currency";
import { Loader2 } from "lucide-react";

const leadSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  origin: z.enum(['google', 'instagram', 'facebook', 'indication', 'website', 'other']),
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']),
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
        estimated_value: lead.estimated_value ? lead.estimated_value.toString() : "",
        notes: lead.notes || "",
      });
    } else if (!lead && open) {
      reset({
        name: "",
        email: "",
        phone: "",
        origin: "other",
        status: "new",
        estimated_value: "",
        notes: "",
      });
    }
  }, [lead, open, reset]);

  const onSubmit = async (data: LeadFormData) => {
    try {
      const leadData: CommercialLeadInsert = {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        origin: data.origin,
        status: data.status,
        estimated_value: data.estimated_value || null,
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
              <Label htmlFor="estimated_value">Valor Estimado da 1ª Consulta</Label>
              <Input
                id="estimated_value"
                type="text"
                value={watch("estimated_value") || ""}
                onChange={handleEstimatedValueChange}
                placeholder="R$ 0,00"
              />
            </div>
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






