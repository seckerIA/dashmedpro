import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ReactivationTemplate, DEFAULT_REACTIVATION_TEMPLATE, DEFAULT_REACTIVATION_TEMPLATE_B } from "@/types/reactivation";
import { Eye, Copy, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReactivationTemplateEditorProps {
  templates: ReactivationTemplate[];
  onChange: (templates: ReactivationTemplate[]) => void;
  onPreview?: (template: ReactivationTemplate) => void;
}

export function ReactivationTemplateEditor({
  templates,
  onChange,
  onPreview,
}: ReactivationTemplateEditorProps) {
  const { toast } = useToast();
  const [localTemplates, setLocalTemplates] = useState<ReactivationTemplate[]>(templates);

  useEffect(() => {
    setLocalTemplates(templates);
  }, [templates]);

  const handleTemplateChange = (index: number, field: keyof ReactivationTemplate, value: any) => {
    const updated = [...localTemplates];
    updated[index] = { ...updated[index], [field]: value };
    setLocalTemplates(updated);
    onChange(updated);
  };

  const handleAddTemplate = () => {
    const newVariant = localTemplates.length === 0 
      ? 'variant_a' 
      : localTemplates[0].variant === 'variant_a' 
        ? 'variant_b' 
        : 'variant_a';
    
    const newTemplate: ReactivationTemplate = newVariant === 'variant_a'
      ? { ...DEFAULT_REACTIVATION_TEMPLATE }
      : { ...DEFAULT_REACTIVATION_TEMPLATE_B };
    
    const updated = [...localTemplates, newTemplate];
    setLocalTemplates(updated);
    onChange(updated);
  };

  const handleRemoveTemplate = (index: number) => {
    if (localTemplates.length <= 1) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "É necessário ter pelo menos um template.",
      });
      return;
    }
    const updated = localTemplates.filter((_, i) => i !== index);
    setLocalTemplates(updated);
    onChange(updated);
  };

  const handlePreview = (template: ReactivationTemplate) => {
    if (onPreview) {
      onPreview(template);
    } else {
      // Preview simples substituindo variáveis
      let preview = template.content;
      preview = preview.replace(/\{\{nome\}\}/g, 'João Silva');
      preview = preview.replace(/\{\{ultima_visita\}\}/g, 'há 8 meses');
      preview = preview.replace(/\{\{link_agendamento\}\}/g, 'https://app.dashmedpro.com/calendar');
      
      toast({
        title: "Preview do Template",
        description: preview,
        duration: 10000,
      });
    }
  };

  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{\{(\w+)\}\}/g);
    return matches ? [...new Set(matches)] : [];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Templates de Mensagem</h3>
          <p className="text-sm text-muted-foreground">
            Crie variantes para A/B testing. Use variáveis: {`{{nome}}`}, {`{{ultima_visita}}`}, {`{{link_agendamento}}`}
          </p>
        </div>
        <Button onClick={handleAddTemplate} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Variante
        </Button>
      </div>

      {localTemplates.map((template, index) => {
        const variables = extractVariables(template.content);
        
        return (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Variante {template.variant === 'variant_a' ? 'A' : 'B'}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreview(template)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  {localTemplates.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveTemplate(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Conteúdo da Mensagem</Label>
                <Textarea
                  value={template.content}
                  onChange={(e) => handleTemplateChange(index, 'content', e.target.value)}
                  placeholder="Olá {{nome}}, ficamos com saudade!..."
                  rows={6}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Variáveis detectadas: {variables.length > 0 ? variables.join(', ') : 'Nenhuma'}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

