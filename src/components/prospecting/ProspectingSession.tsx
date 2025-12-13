import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Settings, X, ChevronLeft, ChevronRight } from "lucide-react";
import { ScriptCard as ScriptCardComponent } from "./ScriptCard";
import { ObjectionCard } from "./ObjectionCard";
import { SessionResults } from "./SessionResults";
import { ScriptConfiguration } from "./ScriptConfiguration";
import { ScriptCard, ProspectingScript } from "@/types/prospecting";
import { Progress } from "@/components/ui/progress";
import { useProspectingScripts } from "@/hooks/useProspectingScripts";

interface ProspectingSessionProps {
  script: ProspectingScript | null;
  onExit: () => void;
  onFinish: (result: 'atendimento_encerrado' | 'contato_decisor') => void;
}

export function ProspectingSession({ script, onExit, onFinish }: ProspectingSessionProps) {
  const cards = (script?.cards as unknown as ScriptCard[]) || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedCards, setCompletedCards] = useState<Set<number>>(new Set());
  const [showResults, setShowResults] = useState(false);
  const [localCards, setLocalCards] = useState<ScriptCard[]>(cards);
  const { updateScript } = useProspectingScripts();

  // Separar scripts e objeções
  const scriptCards = localCards.filter(c => c.type === 'script');
  const objectionCards = localCards.filter(c => c.type === 'objection');
  
  // Pegar o script e objeção atuais (1 script por vez)
  const currentScript = scriptCards[currentIndex];
  const currentObjection = objectionCards[currentIndex];
  
  const totalScripts = scriptCards.length;
  const progress = totalScripts > 0 ? ((currentIndex + 1) / totalScripts) * 100 : 0;

  const handleCardComplete = (cardOrder: number) => {
    const newCompleted = new Set(completedCards);
    newCompleted.add(cardOrder);
    setCompletedCards(newCompleted);
  };

  const handleNext = () => {
    if (currentIndex < totalScripts - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleFinalize = () => {
    setShowResults(true);
  };

  const handleEditCard = async (cardId: string, newContent: string) => {
    // Atualizar estado local imediatamente
    const updatedCards = localCards.map(card =>
      card.id === cardId ? { ...card, content: newContent } : card
    );
    setLocalCards(updatedCards);

    // Salvar no banco de dados se for um script do usuário (não uma cópia pública)
    if (script && script.user_id && script.id) {
      try {
        await updateScript({
          scriptId: script.id,
          data: {
            cards: updatedCards as any
          }
        });
      } catch (error) {
        console.error('Erro ao salvar alterações do script:', error);
        // Reverter alteração local se falhar ao salvar
        setLocalCards(localCards);
      }
    }
  };

  const isLastScript = currentIndex === totalScripts - 1;
  const currentScriptCompleted = currentScript ? completedCards.has(currentScript.order) : false;

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header fixo */}
      <div className="fixed top-0 right-0 left-0 z-50 p-6 flex justify-between items-start">
        <Button
          onClick={onExit}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10"
        >
          <X className="w-4 h-4 mr-2" />
          Sair
        </Button>

        <div className="flex gap-2">
          {script && (
            <ScriptConfiguration
              script={script}
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configurar
                </Button>
              }
            />
          )}
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col items-center justify-start p-6 pt-24 space-y-8">
        {/* Progresso - Agora faz scroll junto */}
        <div className="w-full max-w-md">
          <div className="space-y-2">
            <Progress value={progress} className="h-2 bg-white/20" />
            <p className="text-white/60 text-xs text-center">
              {Math.round(progress)}% concluído
            </p>
          </div>
        </div>

        <div className="w-full max-w-3xl space-y-6">
          {/* Card de script */}
          {currentScript && (
            <div className="flex justify-center">
              <ScriptCardComponent
                card={currentScript}
                isCompleted={completedCards.has(currentScript.order)}
                onComplete={() => handleCardComplete(currentScript.order)}
                onEdit={(content) => handleEditCard(currentScript.id, content)}
                isEditable={true}
              />
            </div>
          )}

          {/* Card de objeção */}
          {currentObjection && (
            <div className="flex justify-center">
              <ObjectionCard
                card={currentObjection}
                onEdit={(content) => handleEditCard(currentObjection.id, content)}
                isEditable={true}
              />
            </div>
          )}

          {/* Navegação */}
          <div className="flex justify-center items-center gap-4 pt-6">
            <Button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              variant="outline"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>

            {!isLastScript ? (
              <Button
                onClick={handleNext}
                disabled={!currentScriptCompleted}
                className="bg-white text-black hover:bg-white/90"
              >
                Próximo
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleFinalize}
                disabled={!currentScriptCompleted}
                className="bg-green-600 text-white hover:bg-green-700"
                size="lg"
              >
                Finalizar Atendimento
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Botão lateral de finalizar (sempre visível) */}
      <div className="fixed right-6 top-1/2 transform -translate-y-1/2">
        <Button
          onClick={handleFinalize}
          className="bg-green-600 hover:bg-green-700 text-white shadow-2xl"
          size="lg"
        >
          Finalizar
        </Button>
      </div>

      {/* Modal de resultados */}
      <SessionResults
        open={showResults}
        onOpenChange={setShowResults}
        onAtendimentoEncerrado={() => {
          setShowResults(false);
          onFinish('atendimento_encerrado');
        }}
        onContatoDecisor={() => {
          setShowResults(false);
          onFinish('contato_decisor');
        }}
      />
    </div>
  );
}

