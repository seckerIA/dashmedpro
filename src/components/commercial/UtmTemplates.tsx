import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Edit, Trash2, Plus } from "lucide-react";
import { useUtmTemplates, useCreateUtmTemplate, useUpdateUtmTemplate, useDeleteUtmTemplate } from "@/hooks/useUtmTemplates";
import { useAuth } from "@/hooks/useAuth";
import { UtmTemplate } from "@/types/adPlatforms";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const templateSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  base_url: z.string().url("URL inválida"),
  utm_source: z.string().min(1, "UTM Source é obrigatório"),
  utm_medium: z.string().min(1, "UTM Medium é obrigatório"),
  utm_campaign: z.string().min(1, "UTM Campaign é obrigatório"),
  utm_term: z.string().optional(),
  utm_content: z.string().optional(),
  is_active: z.boolean(),
});

type TemplateFormData = z.infer<typeof templateSchema>;

export function UtmTemplates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: templates, isLoading } = useUtmTemplates();
  const createTemplate = useCreateUtmTemplate();
  const updateTemplate = useUpdateUtmTemplate();
  const deleteTemplate = useDeleteUtmTemplate();
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<UtmTemplate | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      base_url: "",
      utm_source: "",
      utm_medium: "",
      utm_campaign: "",
      utm_term: "",
      utm_content: "",
      is_active: true,
    },
  });

  const handleEdit = (template: UtmTemplate) => {
    setEditingTemplate(template);
    setValue('name', template.name);
    setValue('base_url', template.base_url);
    setValue('utm_source', template.utm_source);
    setValue('utm_medium', template.utm_medium);
    setValue('utm_campaign', template.utm_campaign);
    setValue('utm_term', template.utm_term || '');
    setValue('utm_content', template.utm_content || '');
    setValue('is_active', template.is_active);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este template?')) {
      try {
        await deleteTemplate.mutateAsync(id);
        toast({
          title: 'Template excluído',
          description: 'O template foi excluído com sucesso.',
        });
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: error.message || 'Erro ao excluir template.',
        });
      }
    }
  };

  const onSubmit = async (data: TemplateFormData) => {
    if (!user) return;

    try {
      if (editingTemplate) {
        await updateTemplate.mutateAsync({
          id: editingTemplate.id,
          updates: data,
        });
        toast({
          title: 'Template atualizado',
          description: 'O template foi atualizado com sucesso.',
        });
      } else {
        await createTemplate.mutateAsync({
          user_id: user.id,
          ...data,
        } as any);
        toast({
          title: 'Template criado',
          description: 'O template foi criado com sucesso.',
        });
      }
      setShowForm(false);
      setEditingTemplate(null);
      reset();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Erro ao salvar template.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Templates de UTM</h2>
          <p className="text-sm text-muted-foreground">
            Crie templates para gerar links com UTMs rapidamente
          </p>
        </div>
        <Button onClick={() => {
          setEditingTemplate(null);
          reset();
          setShowForm(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Template
        </Button>
      </div>

      {templates && templates.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              Nenhum template criado. Crie um template para começar.
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates?.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <Badge variant={template.is_active ? 'default' : 'secondary'}>
                    {template.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm space-y-1">
                  <div>
                    <span className="text-muted-foreground">URL:</span>{' '}
                    <span className="font-mono text-xs">{template.base_url}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Source:</span> {template.utm_source}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Medium:</span> {template.utm_medium}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Campaign:</span> {template.utm_campaign}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(template)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Editar Template' : 'Novo Template'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Template *</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="base_url">URL Base *</Label>
              <Input id="base_url" {...register('base_url')} placeholder="https://seusite.com.br" />
              {errors.base_url && <p className="text-sm text-destructive">{errors.base_url.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="utm_source">UTM Source *</Label>
                <Input id="utm_source" {...register('utm_source')} />
                {errors.utm_source && <p className="text-sm text-destructive">{errors.utm_source.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="utm_medium">UTM Medium *</Label>
                <Input id="utm_medium" {...register('utm_medium')} />
                {errors.utm_medium && <p className="text-sm text-destructive">{errors.utm_medium.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="utm_campaign">UTM Campaign *</Label>
              <Input id="utm_campaign" {...register('utm_campaign')} />
              {errors.utm_campaign && <p className="text-sm text-destructive">{errors.utm_campaign.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="utm_term">UTM Term (opcional)</Label>
                <Input id="utm_term" {...register('utm_term')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="utm_content">UTM Content (opcional)</Label>
                <Input id="utm_content" {...register('utm_content')} />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={watch('is_active')}
                onCheckedChange={(checked) => setValue('is_active', checked)}
              />
              <Label htmlFor="is_active" className="cursor-pointer">Template ativo</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  editingTemplate ? 'Atualizar' : 'Criar'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}


