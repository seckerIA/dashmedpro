import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScriptCard as ScriptCardType } from "@/types/prospecting";
import { useState } from "react";

interface ScriptCardProps {
  card: ScriptCardType;
  isCompleted: boolean;
  onComplete: () => void;
  onEdit?: (content: string) => void;
  isEditable?: boolean;
}

export function ScriptCard({ card, isCompleted, onComplete, onEdit, isEditable = false }: ScriptCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(card.content);

  const handleSave = () => {
    if (onEdit) {
      onEdit(content);
    }
    setIsEditing(false);
  };

  return (
    <Card className="bg-white shadow-2xl rounded-3xl p-8 max-w-2xl w-full border-2 border-gray-100 transition-all duration-300 hover:shadow-3xl">
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                Script {card.order + 1}
              </span>
            </div>
            
            {isEditing ? (
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="text-lg leading-relaxed min-h-[150px]"
                autoFocus
              />
            ) : (
              <p className="text-lg leading-relaxed text-gray-800 font-medium">
                {card.content}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
          {isEditable && (
            <>
              {isEditing ? (
                <>
                  <Button 
                    onClick={handleSave}
                    size="sm"
                    className="flex-1"
                  >
                    Salvar
                  </Button>
                  <Button 
                    onClick={() => {
                      setContent(card.content);
                      setIsEditing(false);
                    }}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => setIsEditing(true)}
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  Editar
                </Button>
              )}
            </>
          )}
          
          {!isEditing && (
            <Button
              onClick={onComplete}
              disabled={isCompleted}
              className={`flex-1 ${isCompleted ? 'bg-green-500' : ''}`}
              size="lg"
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              {isCompleted ? 'Concluído' : 'Marcar como Concluído'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

