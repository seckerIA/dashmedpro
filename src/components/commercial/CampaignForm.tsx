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
import { useCommercialCampaigns } from "@/hooks/useCommercialCampaigns";
import { CommercialCampaign, CommercialCampaignInsert } from "@/types/commercial";
import { COMMERCIAL_CAMPAIGN_TYPE_LABELS } from "@/types/commercial";
import { formatCurrencyInput, parseCurrencyToNumber } from "@/lib/currency";
import { Loader2 } from "lucide-react";

const campaignSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  type: z.enum(['first_consultation_discount', 'procedure_package', 'seasonal_promotion', 'referral_benefit']),
  discount_percentage: z.string().optional().transform((val) => val ? parseFloat(val) : undefined),
  discount_amount: z.string().optional().transform((val) => val ? parseCurrencyToNumber(val) : undefined),
  start_date: z.string().min(1, "Data de início é obrigatória"),
  end_date: z.string().min(1, "Data de término é obrigatória"),
  target_audience: z.string().optional(),
  promo_code: z.string().optional(),
  is_active: z.boolean(),
  description: z.string().optional(),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

interface CampaignFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: CommercialCampaign | null;
}

export function CampaignForm({ open, onOpenChange, campaign }: CampaignFormProps) {
  const { createCampaign, updateCampaign } = useCommercialCampaigns();
  const isEditing = !!campaign;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      type: "first_consultation_discount",
      discount_percentage: "",
      discount_amount: "",
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      target_audience: "",
      promo_code: "",
      is_active: true,
      description: "",
    },
  });

  useEffect(() => {
    if (campaign && open) {
      reset({
        name: campaign.name,
        type: campaign.type,
        discount_percentage: campaign.discount_percentage?.toString() || "",
        discount_amount: campaign.discount_amount?.toString() || "",
        start_date: campaign.start_date.split('T')[0],
        end_date: campaign.end_date.split('T')[0],
        target_audience: campaign.target_audience || "",
        promo_code: campaign.promo_code || "",
        is_active: campaign.is_active,
        description: campaign.description || "",
      });
    } else if (!campaign && open) {
      reset({
        name: "",
        type: "first_consultation_discount",
        discount_percentage: "",
        discount_amount: "",
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        target_audience: "",
        promo_code: "",
        is_active: true,
        description: "",
      });
    }
  }, [campaign, open, reset]);

  const onSubmit = async (data: CampaignFormData) => {
    try {
      const campaignData: CommercialCampaignInsert = {
        name: data.name,
        type: data.type,
        discount_percentage: data.discount_percentage || null,
        discount_amount: data.discount_amount || null,
        start_date: new Date(data.start_date).toISOString(),
        end_date: new Date(data.end_date).toISOString(),
        target_audience: data.target_audience || null,
        promo_code: data.promo_code || null,
        is_active: data.is_active,
        description: data.description || null,
      };

      if (isEditing && campaign) {
        await updateCampaign.mutateAsync({ id: campaign.id, updates: campaignData });
      } else {
        await createCampaign.mutateAsync(campaignData);
      }

      onOpenChange(false);
      reset();
    } catch (error) {
      console.error("Error submitting campaign:", error);
    }
  };

  const handleDiscountAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value);
    setValue("discount_amount", formatted, { shouldValidate: true });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Campanha" : "Nova Campanha"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Nome da campanha"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select
                value={watch("type")}
                onValueChange={(value) => setValue("type", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(COMMERCIAL_CAMPAIGN_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="promo_code">Código Promocional</Label>
              <Input
                id="promo_code"
                {...register("promo_code")}
                placeholder="Ex: PRIMEIRA2024"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discount_percentage">Desconto (%)</Label>
              <Input
                id="discount_percentage"
                type="number"
                {...register("discount_percentage")}
                placeholder="Ex: 20"
                min={0}
                max={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount_amount">Desconto (R$)</Label>
              <Input
                id="discount_amount"
                type="text"
                value={watch("discount_amount") || ""}
                onChange={handleDiscountAmountChange}
                placeholder="R$ 0,00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Data de Início *</Label>
              <Input
                id="start_date"
                type="date"
                {...register("start_date")}
              />
              {errors.start_date && (
                <p className="text-sm text-destructive">{errors.start_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Data de Término *</Label>
              <Input
                id="end_date"
                type="date"
                {...register("end_date")}
              />
              {errors.end_date && (
                <p className="text-sm text-destructive">{errors.end_date.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_audience">Público-Alvo</Label>
            <Input
              id="target_audience"
              {...register("target_audience")}
              placeholder="Ex: Novos pacientes"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Descrição da campanha..."
              rows={4}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={watch("is_active")}
              onCheckedChange={(checked) => setValue("is_active", checked)}
            />
            <Label htmlFor="is_active">Ativa</Label>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              isEditing ? "Salvar Alterações" : "Criar Campanha"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

