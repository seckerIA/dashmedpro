import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Meh, TrendingDown } from 'lucide-react';
import { getNPSScoreColor, getNPSLabel, type NPSCalculation } from '@/types/followUp';
import { Skeleton } from '@/components/ui/skeleton';

interface NPSMetricsCardProps {
  nps: NPSCalculation;
  loading?: boolean;
}

export function NPSMetricsCard({ nps, loading }: NPSMetricsCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>NPS Score</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-12 w-24" />
        </CardContent>
      </Card>
    );
  }

  const scoreColor = getNPSScoreColor(nps.nps_score);
  const label = getNPSLabel(nps.nps_score);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          NPS Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-4xl font-bold ${scoreColor}`}>
          {nps.nps_score.toFixed(0)}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-muted-foreground">Promotores</span>
            </div>
            <span className="font-medium text-green-600">{nps.promoters}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <Meh className="h-3 w-3 text-yellow-600" />
              <span className="text-muted-foreground">Neutros</span>
            </div>
            <span className="font-medium text-yellow-600">{nps.passives}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-red-600" />
              <span className="text-muted-foreground">Detratores</span>
            </div>
            <span className="font-medium text-red-600">{nps.detractors}</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Total Respostas</span>
            </div>
            <span className="font-medium">{nps.total_responses}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
