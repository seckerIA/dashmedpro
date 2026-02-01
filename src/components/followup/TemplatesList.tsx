import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Edit, Trash2, Clock } from 'lucide-react';
import type { FollowUpTemplate } from '@/types/followUp';
import { TRIGGER_TYPE_LABELS, CHANNEL_CONFIG, formatDelay } from '@/types/followUp';
import { useAutomatedFollowUps } from '@/hooks/useAutomatedFollowUps';

interface TemplatesListProps {
  templates: FollowUpTemplate[];
}

export function TemplatesList({ templates }: TemplatesListProps) {
  const { deleteTemplate, updateTemplate } = useAutomatedFollowUps();

  const handleToggleActive = async (template: FollowUpTemplate) => {
    await updateTemplate({
      id: template.id,
      updates: { is_active: !template.is_active },
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir este template?')) {
      await deleteTemplate(id);
    }
  };

  if (templates.length === 0) {
    return (
      <Card className="p-12 text-center">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhum template configurado</h3>
        <p className="text-muted-foreground">
          Crie templates para automatizar o envio de follow-ups
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {templates.map((template) => {
        const channelConfig = CHANNEL_CONFIG[template.channel];

        return (
          <Card key={template.id} className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold">{template.name}</h3>
                  {template.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {template.description}
                    </p>
                  )}
                </div>
                <Badge variant={template.is_active ? 'default' : 'secondary'}>
                  {template.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {TRIGGER_TYPE_LABELS[template.trigger_type]}
                </Badge>
                <Badge variant="outline" className={channelConfig.color}>
                  {channelConfig.label}
                </Badge>
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDelay(template.delay_minutes)}
                </Badge>
              </div>

              <div className="p-3 bg-muted/50 rounded-md text-sm">
                {template.message_template.substring(0, 150)}
                {template.message_template.length > 150 && '...'}
              </div>

              {template.include_nps && (
                <div className="text-xs text-muted-foreground">
                  ✓ Inclui pergunta NPS
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleActive(template)}
                >
                  {template.is_active ? 'Desativar' : 'Ativar'}
                </Button>
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(template.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
