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
import { useCommercialSales } from "@/hooks/useCommercialSales";
import { useCommercialProcedures } from "@/hooks/useCommercialProcedures";
import { useCRM } from "@/hooks/useCRM";
import { CommercialSale, CommercialSaleInsert } from "@/types/commercial";
import { COMMERCIAL_SALE_STATUS_LABELS, COMMERCIAL_PAYMENT_METHOD_LABELS } from "@/types/commercial";
import { formatCurrencyInput, parseCurrencyToNumber } from "@/lib/currency";
import { Loader2 } from "lucide-react";

const saleSchema = z.object({
  contact_id: z.string().uuid().optional().or(z.literal("")),
  procedure_id: z.string().uuid().optional().or(z.literal("")),
  value: z.string().min(1, "Valor é obrigatório").transform((val) => parseCurrencyToNumber(val)),
  status: z.enum(['quote', 'confirmed', 'completed', 'cancelled']),
  payment_method: z.enum(['cash', 'credit_card', 'debit_card', 'pix', 'bank_transfer', 'installment']).optional().or(z.literal("")),
  installments: z.number().min(1).optional(),
  sale_date: z.string().optional(),
  notes: z.string().optional(),
});

type SaleFormData = z.infer<typeof saleSchema>;

interface SaleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale?: CommercialSale | null;
}

export function SaleForm({ open, onOpenChange, sale }: SaleFormProps) {
  const { createSale, updateSale } = useCommercialSales();
  const { procedures } = useCommercialProcedures();
  const { contacts } = useCRM();
  const isEditing = !!sale;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      contact_id: "",
      procedure_id: "",
      value: "",
      status: "quote",
      payment_method: "",
      installments: 1,
      sale_date: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (sale && open) {
      reset({
        contact_id: sale.contact_id || "",
        procedure_id: sale.procedure_id || "",
        value: sale.value.toString(),
        status: sale.status,
        payment_method: sale.payment_method || "",
        installments: sale.installments || 1,
        sale_date: sale.sale_date ? sale.sale_date.split('T')[0] : "",
        notes: sale.notes || "",
      });
    } else if (!sale && open) {
      reset({
        contact_id: "",
        procedure_id: "",
        value: "",
        status: "quote",
        payment_method: "",
        installments: 1,
        sale_date: new Date().toISOString().split('T')[0],
        notes: "",
      });
    }
  }, [sale, open, reset]);

  const onSubmit = async (data: SaleFormData) => {
    try {
      const saleData: CommercialSaleInsert = {
        contact_id: data.contact_id || null,
        procedure_id: data.procedure_id || null,
        value: data.value,
        status: data.status,
        payment_method: data.payment_method || null,
        installments: data.installments,
        sale_date: data.sale_date ? new Date(data.sale_date).toISOString() : null,
        notes: data.notes || null,
      };

      if (isEditing && sale) {
        await updateSale.mutateAsync({ id: sale.id, updates: saleData });
      } else {
        await createSale.mutateAsync(saleData);
      }

      onOpenChange(false);
      reset();
    } catch (error) {
      console.error("Error submitting sale:", error);
    }
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value);
    setValue("value", formatted, { shouldValidate: true });
  };

  const selectedProcedure = procedures.find(p => p.id === watch("procedure_id"));
  useEffect(() => {
    if (selectedProcedure && !watch("value")) {
      setValue("value", selectedProcedure.price.toString(), { shouldValidate: true });
    }
  }, [selectedProcedure, setValue, watch]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Venda" : "Nova Venda"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_id">Paciente</Label>
              <Select
                value={watch("contact_id") || ""}
                onValueChange={(value) => setValue("contact_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o paciente" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map(contact => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="procedure_id">Procedimento</Label>
              <Select
                value={watch("procedure_id") || ""}
                onValueChange={(value) => setValue("procedure_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o procedimento" />
                </SelectTrigger>
                <SelectContent>
                  {procedures.filter(p => p.is_active).map(procedure => (
                    <SelectItem key={procedure.id} value={procedure.id}>
                      {procedure.name} - {formatCurrency(procedure.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">Valor *</Label>
              <Input
                id="value"
                type="text"
                value={watch("value") || ""}
                onChange={handleValueChange}
                placeholder="R$ 0,00"
              />
              {errors.value && (
                <p className="text-sm text-destructive">{errors.value.message}</p>
              )}
            </div>

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
                  {Object.entries(COMMERCIAL_SALE_STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment_method">Forma de Pagamento</Label>
              <Select
                value={watch("payment_method") || ""}
                onValueChange={(value) => setValue("payment_method", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(COMMERCIAL_PAYMENT_METHOD_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="installments">Parcelas</Label>
              <Input
                id="installments"
                type="number"
                {...register("installments", { valueAsNumber: true })}
                min={1}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sale_date">Data da Venda</Label>
            <Input
              id="sale_date"
              type="date"
              {...register("sale_date")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Observações sobre a venda..."
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
              isEditing ? "Salvar Alterações" : "Criar Venda"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}







