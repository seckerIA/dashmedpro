import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, MessageSquare, ThumbsUp, Star } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { FollowUpResponseWithRelations } from '@/types/followUp';
import { getNPSColor, getNPSCategory, SENTIMENT_CONFIG } from '@/types/followUp';

interface ResponsesListProps {
  responses: FollowUpResponseWithRelations[];
}

export function ResponsesList({ responses }: ResponsesListProps) {
  if (responses.length === 0) {
    return (
      <Card className="p-12 text-center">
        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhuma resposta ainda</h3>
        <p className="text-muted-foreground">
          As respostas dos pacientes aparecerão aqui
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {responses.map((response: any) => {
        const npsCategory = response.nps_score ? getNPSCategory(response.nps_score) : null;
        const sentimentConfig = response.sentiment ? SENTIMENT_CONFIG[response.sentiment] : null;

        return (
          <Card key={response.id} className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{response.contact?.full_name}</span>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(response.responded_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>

                {sentimentConfig && (
                  <Badge variant="outline" className={sentimentConfig.color}>
                    {sentimentConfig.emoji} {sentimentConfig.label}
                  </Badge>
                )}
              </div>

              {/* NPS Score */}
              {response.nps_score !== null && (
                <div className="flex items-center gap-3">
                  <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">NPS:</span>
                    <span className={`text-2xl font-bold ${getNPSColor(response.nps_score)}`}>
                      {response.nps_score}
                    </span>
                    <Badge variant={
                      npsCategory === 'promoter' ? 'default' :
                      npsCategory === 'passive' ? 'secondary' : 'destructive'
                    }>
                      {npsCategory === 'promoter' ? 'Promotor' :
                       npsCategory === 'passive' ? 'Neutro' : 'Detrator'}
                    </Badge>
                  </div>
                </div>
              )}

              {/* CSAT Score */}
              {response.csat_score !== null && (
                <div className="flex items-center gap-3">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">CSAT:</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= response.csat_score!
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium">{response.csat_score}/5</span>
                  </div>
                </div>
              )}

              {/* Feedback Text */}
              {response.feedback_text && (
                <div className="p-3 bg-muted/50 rounded-md">
                  <p className="text-sm italic">"{response.feedback_text}"</p>
                </div>
              )}

              {/* AI Analysis */}
              {response.ai_analyzed && response.ai_summary && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="flex-1 text-sm">
                      <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">Análise IA</p>
                      <p className="text-blue-700 dark:text-blue-300">{response.ai_summary}</p>
                      {response.requires_follow_up && (
                        <Badge variant="destructive" className="mt-2">
                          Requer Ação
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
