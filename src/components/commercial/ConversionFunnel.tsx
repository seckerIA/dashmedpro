import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
}

interface ConversionFunnelProps {
  data: FunnelStage[];
}

export function ConversionFunnel({ data }: ConversionFunnelProps) {
  const maxCount = useMemo(() => {
    return Math.max(...data.map(d => d.count), 1);
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>Nenhum dado disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((stage, index) => {
        const widthPercentage = (stage.count / maxCount) * 100;
        
        return (
          <div key={stage.stage} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-card-foreground">{stage.stage}</span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{stage.count}</span>
                <span className="text-primary font-semibold">{stage.percentage}%</span>
              </div>
            </div>
            <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-500 rounded-lg",
                  index === 0 && "bg-blue-500/20",
                  index === 1 && "bg-blue-500/40",
                  index === 2 && "bg-blue-500/60",
                  index === 3 && "bg-blue-500/80",
                  index >= 4 && "bg-primary"
                )}
                style={{ width: `${widthPercentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

