import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCommercialProcedures } from "@/hooks/useCommercialProcedures";
import { CommercialProcedure, CommercialProcedureInsert } from "@/types/commercial";
import { COMMERCIAL_PROCEDURE_CATEGORY_LABELS } from "@/types/commercial";
import { formatCurrencyInput, parseCurrencyToNumber } from "@/lib/currency";
import { Loader2 } from "lucide-react";

const procedureSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  category: z.enum(['consultation', 'procedure', 'exam', 'surgery', 'other']),
  description: z.string().optional(),
  price: z.string().min(1, "Preço é obrigatório").transform((val) => parseCurrencyToNumber(val)),
  duration_minutes: z.number().min(15).max(480),
  is_active: z.boolean(),
});

type ProcedureFormData = z.infer<typeof procedureSchema>;

interface ProcedureFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  procedure?: CommercialProcedure | null;
}

export function ProcedureForm({ open, onOpenChange, procedure }: ProcedureFormProps) {
  const { createProcedure, updateProcedure } = useCommercialProcedures();
  const isEditing = !!procedure;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProcedureFormData>({
    resolver: zodResolver(procedureSchema),
    defaultValues: {
      name: "",
      category: "other",
      description: "",
      price: "",
      duration_minutes: 30,
      is_active: true,
    },
  });

  useEffect(() => {
    if (procedure && open) {
      reset({
        name: procedure.name,
        category: procedure.category,
        description: procedure.description || "",
        price: procedure.price.toString(),
        duration_minutes: procedure.duration_minutes,
        is_active: procedure.is_active,
      });
    } else if (!procedure && open) {
      reset({
        name: "",
        category: "other",
        description: "",
        price: "",
        duration_minutes: 30,
        is_active: true,
      });
    }
  }, [procedure, open, reset]);

  const onSubmit = async (data: ProcedureFormData) => {
    try {
      const procedureData: CommercialProcedureInsert = {
        name: data.name,
        category: data.category,
        description: data.description || null,
        price: data.price,
        duration_minutes: data.duration_minutes,
        is_active: data.is_active,
      };

      if (isEditing && procedure) {
        await updateProcedure.mutateAsync({ id: procedure.id, updates: procedureData });
      } else {
        await createProcedure.mutateAsync(procedureData);
      }

      onOpenChange(false);
      reset();
    } catch (error) {
      console.error("Error submitting procedure:", error);
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value);
    setValue("price", formatted, { shouldValidate: true });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
        <DialogHeader>
          <DialogTitle className="text-blue-900 dark:text-blue-100">{isEditing ? "Editar Procedimento" : "Novo Procedimento"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Nome do procedimento"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select
                value={watch("category")}
                onValueChange={(value) => setValue("category", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(COMMERCIAL_PROCEDURE_CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration_minutes">Duração (minutos) *</Label>
              <Input
                id="duration_minutes"
                type="number"
                {...register("duration_minutes", { valueAsNumber: true })}
                min={15}
                max={480}
              />
              {errors.duration_minutes && (
                <p className="text-sm text-destructive">{errors.duration_minutes.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Preço *</Label>
            <Input
              id="price"
              type="text"
              value={watch("price") || ""}
              onChange={handlePriceChange}
              placeholder="R$ 0,00"
            />
            {errors.price && (
              <p className="text-sm text-destructive">{errors.price.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Descrição do procedimento..."
              rows={4}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={watch("is_active")}
              onCheckedChange={(checked) => setValue("is_active", checked)}
            />
            <Label htmlFor="is_active">Ativo</Label>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              isEditing ? "Salvar Alterações" : "Criar Procedimento"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}








