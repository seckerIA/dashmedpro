/**
 * Gerenciador de labels da conversa
 */

import { useState, useCallback } from 'react';
import {
  Tag,
  Plus,
  Check,
  X,
  Trash2,
  Edit2,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useWhatsAppLabels, useConversationLabels } from '@/hooks/useWhatsAppLabels';
// WhatsAppConversationLabel is not exported from types, define inline
interface WhatsAppConversationLabel {
  id: string;
  name: string;
  color: string;
}

// Cores pré-definidas para labels
const LABEL_COLORS = [
  '#EF4444', // red
  '#F97316', // orange
  '#EAB308', // yellow
  '#22C55E', // green
  '#06B6D4', // cyan
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#EC4899', // pink
];

interface LabelManagerProps {
  conversationId: string;
}

export function LabelManager({ conversationId }: LabelManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);
  const [deletingLabel, setDeletingLabel] = useState<WhatsAppConversationLabel | null>(null);

  const {
    labels: allLabels,
    isLoading: isLoadingLabels,
    createLabel,
    isCreating: isCreatingLabel,
    deleteLabel,
    isDeleting,
  } = useWhatsAppLabels();

  const {
    conversationLabels,
    isLoading: isLoadingConversationLabels,
    toggleLabel,
    isToggling,
  } = useConversationLabels(conversationId);

  const assignedLabelIds = new Set(conversationLabels.map(l => l.id));

  const handleCreateLabel = useCallback(async () => {
    if (!newLabelName.trim()) return;

    await createLabel({
      name: newLabelName.trim(),
      color: newLabelColor,
    });

    setNewLabelName('');
    setNewLabelColor(LABEL_COLORS[0]);
    setIsCreating(false);
  }, [newLabelName, newLabelColor, createLabel]);

  const handleDeleteLabel = useCallback(async () => {
    if (!deletingLabel) return;
    await deleteLabel(deletingLabel.id);
    setDeletingLabel(null);
  }, [deletingLabel, deleteLabel]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-blue-500" />
          <h4 className="text-sm font-medium">Labels</h4>
        </div>

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7">
              <Plus className="h-3 w-3 mr-1" />
              Gerenciar
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 p-3">
            <div className="space-y-3">
              <div className="font-medium text-sm">Gerenciar labels</div>

              {/* Lista de labels */}
              {isLoadingLabels ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : allLabels.length === 0 && !isCreating ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Nenhuma label criada
                </p>
              ) : (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {allLabels.map(label => {
                    const isAssigned = assignedLabelIds.has(label.id);
                    return (
                      <div
                        key={label.id}
                        className="flex items-center gap-2 p-1.5 rounded hover:bg-muted group"
                      >
                        <button
                          className="flex items-center gap-2 flex-1 min-w-0"
                          onClick={() => toggleLabel(label.id, isAssigned)}
                          disabled={isToggling}
                        >
                          <div
                            className={cn(
                              'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0',
                              isAssigned
                                ? 'bg-current border-current'
                                : 'border-muted-foreground/30'
                            )}
                            style={{ color: label.color }}
                          >
                            {isAssigned && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <span
                            className="text-sm truncate"
                            style={{ color: label.color }}
                          >
                            {label.name}
                          </span>
                        </button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0 text-red-500 hover:text-red-600"
                          onClick={() => setDeletingLabel(label)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              <Separator />

              {/* Criar nova label */}
              {isCreating ? (
                <div className="space-y-2">
                  <Input
                    value={newLabelName}
                    onChange={e => setNewLabelName(e.target.value)}
                    placeholder="Nome da label"
                    className="h-8 text-sm"
                    autoFocus
                  />

                  {/* Seletor de cor */}
                  <div className="flex gap-1">
                    {LABEL_COLORS.map(color => (
                      <button
                        key={color}
                        className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center',
                          newLabelColor === color && 'ring-2 ring-offset-2 ring-offset-background'
                        )}
                        style={{ backgroundColor: color, outlineColor: color }}
                        onClick={() => setNewLabelColor(color)}
                      >
                        {newLabelColor === color && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setIsCreating(false);
                        setNewLabelName('');
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={handleCreateLabel}
                      disabled={!newLabelName.trim() || isCreatingLabel}
                    >
                      {isCreatingLabel ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Criar'
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setIsCreating(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova label
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Labels atribuídas */}
      {isLoadingConversationLabels ? (
        <div className="flex justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : conversationLabels.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Nenhuma label atribuída
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {conversationLabels.map(label => (
            <Badge
              key={label.id}
              variant="secondary"
              className="gap-1 pr-1"
              style={{
                backgroundColor: `${label.color}20`,
                color: label.color,
              }}
            >
              {label.name}
              <button
                className="ml-0.5 p-0.5 rounded-full hover:bg-black/10"
                onClick={() => toggleLabel(label.id, true)}
                disabled={isToggling}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Dialog de confirmação de delete */}
      <AlertDialog
        open={!!deletingLabel}
        onOpenChange={() => setDeletingLabel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover label?</AlertDialogTitle>
            <AlertDialogDescription>
              A label "{deletingLabel?.name}" será removida de todas as conversas.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLabel}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
