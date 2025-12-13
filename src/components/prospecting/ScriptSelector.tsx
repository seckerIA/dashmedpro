import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Play, Edit, Trash2, FileText, Globe, Copy, User, Lock } from "lucide-react";
import { useProspectingScripts } from "@/hooks/useProspectingScripts";
import { ProspectingScript, ProspectingScriptWithCreator, ScriptCard } from "@/types/prospecting";
import { ScriptConfiguration } from "./ScriptConfiguration";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ScriptSelectorProps {
  onSelectScript: (script: ProspectingScript) => void;
  onCreateNew: () => void;
}

export function ScriptSelector({ onSelectScript, onCreateNew }: ScriptSelectorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { scripts, isLoading, deleteScript, isDeleting, duplicateScript, isDuplicating } = useProspectingScripts();

  const handleDuplicateScript = async (scriptId: string, scriptName: string) => {
    try {
      await duplicateScript(scriptId);
    } catch (error) {
      console.error('Error duplicating script:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando roteiros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Guia de Prospecção</h2>
        <p className="text-muted-foreground">
          Selecione um roteiro salvo ou crie um novo
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card de criar novo */}
        <Card className="border-dashed border-2 hover:border-primary transition-colors cursor-pointer group">
          <CardContent className="flex flex-col items-center justify-center min-h-[200px] p-6">
            <ScriptConfiguration
              trigger={
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                    <Plus className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Criar Novo Roteiro</p>
                    <p className="text-xs text-muted-foreground">
                      Configure um roteiro personalizado
                    </p>
                  </div>
                </div>
              }
              onSuccess={(scriptId) => {
                // Após criar, recarregar a lista (o React Query faz isso automaticamente)
                console.log('Script created:', scriptId);
              }}
            />
          </CardContent>
        </Card>

        {/* Cards dos roteiros salvos */}
        {scripts.map((script) => {
          const cards = script.cards as unknown as ScriptCard[];
          const scriptCount = cards.filter(c => c.type === 'script').length;
          const objectionCount = cards.filter(c => c.type === 'objection').length;
          const isOwner = script.user_id === user?.id;
          const creatorInfo = script.creator;

          return (
            <Card key={script.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="line-clamp-1">{script.name}</span>
                  </CardTitle>
                  <div className="flex gap-1 flex-shrink-0">
                    {/* Badge Público/Privado */}
                    {isOwner && !script.is_copy && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge 
                              variant={script.is_public ? "default" : "secondary"}
                              className="gap-1"
                            >
                              {script.is_public ? (
                                <Globe className="w-3 h-3" />
                              ) : (
                                <Lock className="w-3 h-3" />
                              )}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{script.is_public ? 'Público' : 'Privado'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    
                    {/* Badge Cópia */}
                    {script.is_copy && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline" className="gap-1">
                              <Copy className="w-3 h-3" />
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Sua cópia pessoal</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>{scriptCount} scripts · {objectionCount} objeções</div>
                  {!isOwner && creatorInfo && (
                    <div className="flex items-center gap-1 text-xs">
                      <User className="w-3 h-3" />
                      <span>Por: {creatorInfo.full_name || creatorInfo.email}</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs text-muted-foreground">
                  {cards.length} cards no total
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => onSelectScript(script)}
                    className="flex-1"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Iniciar
                  </Button>
                  
                  {/* Mostrar botão de editar apenas para donos ou cópias */}
                  {(isOwner || script.is_copy) && (
                    <ScriptConfiguration
                      script={script}
                      trigger={
                        <Button variant="outline" size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                      }
                    />
                  )}
                  
                  {/* Botão de copiar para scripts públicos de outros usuários */}
                  {!isOwner && script.is_public && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDuplicateScript(script.id, script.name)}
                            disabled={isDuplicating}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Criar cópia para editar</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  
                  {/* Mostrar botão de deletar apenas para donos */}
                  {isOwner && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon" disabled={isDeleting}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Roteiro</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o roteiro "{script.name}"? 
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteScript(script.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {scripts.length >= 5 && (
        <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Você atingiu o limite máximo de 5 roteiros salvos. 
            Exclua um roteiro existente para criar um novo.
          </p>
        </div>
      )}
    </div>
  );
}





