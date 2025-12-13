import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Settings, Globe, Lock } from "lucide-react";
import { ScriptCard, CardType, ProspectingScript } from "@/types/prospecting";
import { useProspectingScripts } from "@/hooks/useProspectingScripts";
import { useAuth } from "@/hooks/useAuth";

interface ScriptConfigurationProps {
  trigger?: React.ReactNode;
  script?: ProspectingScript;
  onSuccess?: (scriptId: string) => void;
}

export function ScriptConfiguration({ trigger, script, onSuccess }: ScriptConfigurationProps) {
  const [open, setOpen] = useState(false);
  const [scriptName, setScriptName] = useState(script?.name || "");
  const [isPublic, setIsPublic] = useState(script?.is_public || false);
  const [cardCount, setCardCount] = useState(script ? (script.cards as unknown as ScriptCard[]).length : 5);
  const [cards, setCards] = useState<ScriptCard[]>(
    script 
      ? (script.cards as unknown as ScriptCard[])
      : Array.from({ length: 5 }, (_, i) => ({
          id: `card-${i}`,
          type: 'script' as CardType,
          content: '',
          order: i,
        }))
  );

  const { user } = useAuth();
  const { createScript, updateScript, isCreating, isUpdating } = useProspectingScripts();
  
  // Verificar se o usuário é dono do script (para mostrar toggle público/privado)
  const isOwner = !script || script.user_id === user?.id;
  const isCopy = script?.is_copy || false;

  const handleCardCountChange = (count: number) => {
    setCardCount(count);
    
    if (count > cards.length) {
      // Adicionar cards
      const newCards = [...cards];
      for (let i = cards.length; i < count; i++) {
        newCards.push({
          id: `card-${i}`,
          type: 'script' as CardType,
          content: '',
          order: i,
        });
      }
      setCards(newCards);
    } else if (count < cards.length) {
      // Remover cards
      setCards(cards.slice(0, count));
    }
  };

  const handleCardChange = (index: number, field: keyof ScriptCard, value: any) => {
    const newCards = [...cards];
    newCards[index] = { ...newCards[index], [field]: value };
    setCards(newCards);
  };

  const handleSave = async () => {
    if (!scriptName.trim()) {
      return;
    }

    try {
      if (script) {
        // Atualizar script existente
        await updateScript({
          scriptId: script.id,
          data: {
            name: scriptName,
            cards: cards as any,
            is_public: isOwner && !isCopy ? isPublic : undefined, // Apenas donos de scripts originais podem alterar visibilidade
          },
        });
      } else {
        // Criar novo script
        const newScript = await createScript({
          name: scriptName,
          cards,
          is_public: isPublic,
        });
        onSuccess?.(newScript.id);
      }
      
      setOpen(false);
      
      // Reset form
      if (!script) {
        setScriptName("");
        setIsPublic(false);
        setCardCount(5);
        setCards(Array.from({ length: 5 }, (_, i) => ({
          id: `card-${i}`,
          type: 'script' as CardType,
          content: '',
          order: i,
        })));
      }
    } catch (error) {
      console.error('Error saving script:', error);
    }
  };

  const isLoading = isCreating || isUpdating;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configurar Roteiro
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {script ? 'Editar Roteiro' : 'Criar Novo Roteiro'}
          </DialogTitle>
          <DialogDescription>
            Configure seu roteiro de prospecção com scripts e objeções
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-4 max-h-[calc(90vh-180px)]">
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="script-name">Nome do Roteiro *</Label>
              <Input
                id="script-name"
                placeholder="Ex: Prospecção Fria, Follow-up, etc."
                value={scriptName}
                onChange={(e) => setScriptName(e.target.value)}
              />
            </div>

            {/* Toggle Público/Privado - apenas para donos de scripts originais */}
            {isOwner && !isCopy && (
              <div className="flex items-center justify-between p-4 border border-gray-700 rounded-lg bg-black">
                <div className="flex items-center gap-3">
                  {isPublic ? (
                    <Globe className="w-5 h-5 text-blue-400" />
                  ) : (
                    <Lock className="w-5 h-5 text-gray-400" />
                  )}
                  <div className="space-y-0.5">
                    <Label htmlFor="is-public" className="text-sm font-medium text-white cursor-pointer">
                      {isPublic ? 'Roteiro Público' : 'Roteiro Privado'}
                    </Label>
                    <p className="text-xs text-gray-300">
                      {isPublic 
                        ? 'Todos os funcionários podem ver e usar este roteiro' 
                        : 'Apenas você pode ver e usar este roteiro'}
                    </p>
                  </div>
                </div>
                <Switch
                  id="is-public"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
              </div>
            )}

            {/* Aviso para cópias */}
            {isCopy && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  💡 Esta é sua cópia pessoal do roteiro. Você pode editá-la livremente.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="card-count">Quantidade de Cards (3-10) *</Label>
              <Select
                value={cardCount.toString()}
                onValueChange={(value) => handleCardCountChange(parseInt(value))}
              >
                <SelectTrigger id="card-count">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 8 }, (_, i) => i + 3).map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} cards
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label className="text-white">Cards do Roteiro</Label>
              {cards.map((card, index) => (
                <div key={card.id} className="p-4 border border-gray-700 rounded-lg space-y-3 bg-gray-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">Card {index + 1}</span>
                    <Select
                      value={card.type}
                      onValueChange={(value: CardType) => handleCardChange(index, 'type', value)}
                    >
                      <SelectTrigger className="w-[180px] bg-white text-black">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="script">Script</SelectItem>
                        <SelectItem value="objection">Objeção</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Textarea
                    placeholder={
                      card.type === 'script'
                        ? 'Digite o script que o vendedor deve falar...'
                        : 'Digite uma possível objeção do cliente...'
                    }
                    value={card.content}
                    onChange={(e) => handleCardChange(index, 'content', e.target.value)}
                    className="min-h-[100px] bg-white text-black placeholder:text-gray-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !scriptName.trim()}
          >
            {isLoading ? 'Salvando...' : script ? 'Atualizar' : 'Criar Roteiro'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

