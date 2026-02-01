import { useEffect, useState } from "react";
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
import { Loader2, Stethoscope, Clock, DollarSign, FileText, Tag, User, Sparkles, Undo } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useDoctors } from "@/hooks/useDoctors";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const procedureSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  category: z.enum(['consultation', 'procedure', 'exam', 'surgery', 'other']),
  description: z.string().optional(),
  price: z.string().min(1, "Preço é obrigatório").transform((val) => parseCurrencyToNumber(val)),
  duration_minutes: z.number().min(15, "Mínimo 15 minutos").max(480, "Máximo 480 minutos"),
  is_active: z.boolean(),
});

interface ProcedureFormInput {
  name: string;
  category: 'consultation' | 'procedure' | 'exam' | 'surgery' | 'other';
  description: string;
  price: string;
  duration_minutes: number;
  is_active: boolean;
}

type ProcedureFormOutput = z.infer<typeof procedureSchema>;

interface ProcedureFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  procedure?: CommercialProcedure | null;
  required?: boolean; // Se true, não permite fechar o modal até cadastrar
  initialData?: Partial<CommercialProcedureInsert>; // Dados iniciais para pré-preencher
  onSuccess?: (procedure: CommercialProcedure | null) => void; // Callback quando cadastrado com sucesso
}

export function ProcedureForm({ open, onOpenChange, procedure, required = false, initialData, onSuccess }: ProcedureFormProps) {
  const { isSecretaria } = useUserProfile();
  const { doctors } = useDoctors();
  const { createProcedure, updateProcedure } = useCommercialProcedures();
  const { toast } = useToast();
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [previousDescription, setPreviousDescription] = useState<string | null>(null);
  const isEditing = !!procedure;

  // Estado para médico selecionado (usado apenas por secretária)
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");

  // Filtrar apenas médicos, admin e dono
  const availableDoctors = doctors.filter(
    (d) => d.role === 'medico' || d.role === 'admin' || d.role === 'dono'
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProcedureFormInput>({
    resolver: zodResolver(procedureSchema),
    defaultValues: {
      name: "",
      category: "consultation",
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
      // Se editando, definir o médico do procedimento
      if (isSecretaria && procedure.user_id) {
        setSelectedDoctorId(procedure.user_id);
      }
    } else if (!procedure && open) {
      reset({
        name: initialData?.name || "",
        category: initialData?.category || "consultation",
        description: initialData?.description || "",
        price: initialData?.price ? formatCurrencyInput(initialData.price.toString()) : "",
        duration_minutes: initialData?.duration_minutes || 30,
        is_active: initialData?.is_active !== undefined ? initialData.is_active : true,
      });
      setSelectedDoctorId("");
    }
  }, [procedure, open, reset, isSecretaria, initialData]);

  const onSubmit = async (data: any) => {
    // Cast data because zodResolver returns the transformed output type (ProcedureFormOutput)
    const validatedData = data as ProcedureFormOutput;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData.session?.user?.id;

      if (!currentUserId) {
        toast({
          title: "Erro de autenticação",
          description: "Sessão expirada. Por favor, faça login novamente.",
          variant: "destructive",
        });
        return;
      }

      // Se secretária, validar que um médico foi selecionado
      if (isSecretaria && !selectedDoctorId && !isEditing) {
        toast({
          title: "Médico não selecionado",
          description: "Por favor, selecione para qual médico deseja cadastrar este procedimento.",
          variant: "destructive",
        });
        return;
      }

      const procedureData: CommercialProcedureInsert = {
        name: validatedData.name,
        category: validatedData.category,
        description: validatedData.description || null,
        price: validatedData.price,
        duration_minutes: validatedData.duration_minutes,
        is_active: validatedData.is_active,
        // user_id é obrigatório. Se for médico, usa o seu próprio. Se secretaria, o selecionado.
        user_id: isSecretaria ? selectedDoctorId : currentUserId,
      };

      let newProcedure: CommercialProcedure | null = null;
      if (isEditing && procedure) {
        await updateProcedure.mutateAsync({ id: procedure.id, updates: procedureData });
        newProcedure = { ...procedure, ...procedureData } as CommercialProcedure;
      } else {
        newProcedure = await createProcedure.mutateAsync(procedureData);
      }

      // Chamar callback de sucesso antes de fechar
      onSuccess?.(newProcedure);

      onOpenChange(false);
      reset();
      setSelectedDoctorId("");
    } catch (error) {
      console.error("Error submitting procedure:", error);
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value);
    setValue("price", formatted, { shouldValidate: true });
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  const handleAIEnhance = async () => {
    const name = watch("name");
    const category = watch("category");
    const currentDescription = watch("description");

    setPreviousDescription(currentDescription || "");

    if (!name) {
      toast({
        title: "Nome necessário",
        description: "Por favor, digite o nome do procedimento para que a IA possa analisá-lo.",
        variant: "destructive",
      });
      return;
    }

    setIsEnhancing(true);

    // Configurar timeout de 10 segundos para não travar o usuário
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      // O SDK do Supabase pode não suportar 'signal' em todas as versões.
      // Vamos usar o timeout apenas para destravar o estado da UI.
      const { data, error } = await supabase.functions.invoke('ai-enhance-procedure', {
        body: { name, category, currentDescription }
      });

      clearTimeout(timeoutId);

      if (error) throw error;

      if (data?.enhancedDescription) {
        setValue("description", data.enhancedDescription, { shouldValidate: true });
        toast({
          title: "Descrição Aprimorada!",
          description: "A IA gerou uma explicação profissional para este procedimento.",
        });
      }
    } catch (err: any) {
      console.error("Error enhancing description:", err);

      const isTimeout = err.name === 'AbortError' || err.message === 'timeout' || err.name === 'TimeoutError';

      toast({
        title: isTimeout ? "Tempo Excedido" : "Erro na IA",
        description: isTimeout
          ? "A IA demorou mais de 10s para responder. Tente novamente."
          : "Não foi possível aprimorar a descrição agora.",
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(false);
      clearTimeout(timeoutId);
    }
  };

  const handleUndoAI = () => {
    if (previousDescription !== null) {
      setValue("description", previousDescription, { shouldValidate: true });
      setPreviousDescription(null);
      toast({
        title: "Alteração desfeita",
        description: "A descrição voltou ao que era antes da análise.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-card border-border">
        <DialogHeader className="pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Stethoscope className="h-5 w-5 text-primary" />
            {isEditing ? "Editar Procedimento" : "Novo Procedimento"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
          {/* Seletor de Médico - Apenas para Secretária */}
          {isSecretaria && (
            <div className="space-y-2 p-4 bg-primary/5 rounded-xl border border-primary/20">
              <Label htmlFor="doctor" className="flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4 text-primary" />
                Médico Responsável *
              </Label>
              <Select
                value={selectedDoctorId}
                onValueChange={setSelectedDoctorId}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione o médico..." />
                </SelectTrigger>
                <SelectContent>
                  {availableDoctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.full_name || doctor.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!selectedDoctorId && !isEditing && (
                <p className="text-xs text-muted-foreground">
                  Selecione o médico para o qual este procedimento será cadastrado
                </p>
              )}
            </div>
          )}

          {/* Nome do Procedimento */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Nome do Procedimento *
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Ex: Consulta Dermatológica"
              className="bg-background"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Categoria e Duração - 2 colunas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="flex items-center gap-2 text-sm font-medium">
                <Tag className="h-4 w-4 text-muted-foreground" />
                Categoria *
              </Label>
              <Select
                value={watch("category")}
                onValueChange={(value) => setValue("category", value as any)}
              >
                <SelectTrigger className="bg-background">
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
              <Label htmlFor="duration_minutes" className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Duração (minutos) *
              </Label>
              <Input
                id="duration_minutes"
                type="number"
                {...register("duration_minutes", { valueAsNumber: true })}
                min={15}
                max={480}
                className="bg-background"
              />
              {errors.duration_minutes && (
                <p className="text-sm text-destructive">{errors.duration_minutes.message}</p>
              )}
            </div>
          </div>

          {/* Preço e Status - 2 colunas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price" className="flex items-center gap-2 text-sm font-medium">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                Preço *
              </Label>
              <Input
                id="price"
                type="text"
                value={watch("price") || ""}
                onChange={handlePriceChange}
                placeholder="R$ 0,00"
                className="bg-background"
              />
              {errors.price && (
                <p className="text-sm text-destructive">{errors.price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                Status
              </Label>
              <div className="flex items-center gap-3 h-10 px-3 rounded-md border border-input bg-background">
                <Switch
                  id="is_active"
                  checked={watch("is_active")}
                  onCheckedChange={(checked) => setValue("is_active", checked)}
                />
                <Label htmlFor="is_active" className="text-sm cursor-pointer">
                  {watch("is_active") ? "Ativo" : "Inativo"}
                </Label>
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description" className="text-sm font-medium">
                Descrição (opcional)
              </Label>
              <div className="flex items-center gap-2">
                {previousDescription !== null && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[10px] gap-1.5 text-muted-foreground hover:text-foreground font-bold px-2 rounded-full border border-border"
                    onClick={handleUndoAI}
                  >
                    <Undo className="h-3 w-3" />
                    Desfazer
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px] gap-1.5 text-primary hover:text-primary hover:bg-primary/10 font-bold px-2 rounded-full border border-primary/20"
                  onClick={handleAIEnhance}
                  disabled={isEnhancing}
                >
                  {isEnhancing ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3" />
                      Aprimorar com IA
                    </>
                  )}
                </Button>
              </div>
            </div>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Descrição detalhada do procedimento..."
              rows={4}
              className="bg-background resize-none border-border/60 focus:border-primary/50"
            />
            <p className="text-[10px] text-muted-foreground">
              Dica: Digite o nome do procedimento e clique em "Aprimorar com IA" para gerar uma explicação perfeita.
            </p>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting || (isSecretaria && !selectedDoctorId && !isEditing)}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                isEditing ? "Salvar Alterações" : "Criar Procedimento"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
