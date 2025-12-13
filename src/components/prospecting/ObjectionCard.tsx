import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from "lucide-react";
import { ScriptCard as ScriptCardType } from "@/types/prospecting";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ObjectionCardProps {
  card: ScriptCardType;
  onEdit?: (content: string) => void;
  isEditable?: boolean;
}

export function ObjectionCard({ card, onEdit, isEditable = false }: ObjectionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(card.content);

  const handleSave = () => {
    if (onEdit) {
      onEdit(content);
    }
    setIsEditing(false);
  };

  return (
    <Card className="bg-white/90 shadow-xl rounded-2xl p-6 max-w-xl w-full border border-gray-200 backdrop-blur-sm">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-orange-500" />
          <span className="text-xs font-medium text-orange-600 uppercase tracking-wide">
            Possível Objeção
          </span>
        </div>
        
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="text-sm min-h-[100px]"
              placeholder="Digite a objeção do cliente..."
              autoFocus
            />
            <div className="flex gap-2">
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
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-gray-700 italic">
              "{card.content}"
            </p>
            {isEditable && (
              <Button 
                onClick={() => setIsEditing(true)}
                size="sm"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
              >
                Editar Objeção
              </Button>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

