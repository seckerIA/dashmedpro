import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CardVariant } from "@/lib/design-tokens";

interface DealsByStage {
  [key: string]: {
    count: number;
    value: number;
  };
}

interface PipelineFunnelCardProps {
  dealsByStage: DealsByStage;
  formatCurrency: (value: number) => string;
}

// Mapear stages para cores do design system
const stageConfig: Record<string, { variant: CardVariant; label: string; gradient: string }> = {
  lead_novo: {
    variant: 'purple',
    label: 'Lead Novo',
    gradient: 'from-purple-500/10 to-purple-600/5'
  },
  qualificado: {
    variant: 'cyan',
    label: 'Qualificado',
    gradient: 'from-cyan-500/10 to-cyan-600/5'
  },
  apresentacao: {
    variant: 'yellow',
    label: 'Apresentação',
    gradient: 'from-yellow-500/10 to-yellow-600/5'
  },
  fechado_ganho: {
    variant: 'green',
    label: 'Cliente Fechado',
    gradient: 'from-green-500/10 to-green-600/5'
  },
  fechado_perdido: {
    variant: 'purple',
    label: 'Cliente Perdido',
    gradient: 'from-gray-500/10 to-gray-600/5'
  }
};

export function PipelineFunnelCard({ dealsByStage, formatCurrency }: PipelineFunnelCardProps) {
  return (
    <Card className="bg-gradient-to-br from-card to-card/50 border-border shadow-card">
      <CardHeader className="p-3 sm:p-4 lg:p-6">
        <CardTitle className="text-sm sm:text-base lg:text-lg text-foreground">Valores e Conversão do Funil</CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 lg:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
          {Object.entries(stageConfig).map(([key, config]) => {
            const stageData = dealsByStage[key] || { count: 0, value: 0 };
            const isLost = key === 'fechado_perdido';

            return (
              <div
                key={key}
                className={cn(
                  "relative overflow-hidden rounded-xl p-3 sm:p-4 transition-all duration-300",
                  "hover:scale-[1.02] hover:shadow-lg",
                  "bg-gradient-to-br",
                  config.gradient,
                  "border border-border/50"
                )}
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.3),transparent)]" />
                </div>

                {/* Content */}
                <div className="relative z-10 space-y-1 sm:space-y-2">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                    {config.label}
                  </p>
                  <p className="text-base sm:text-lg lg:text-xl font-bold text-foreground">
                    {stageData.count} negócio{stageData.count !== 1 ? 's' : ''}
                  </p>
                  <p className={cn(
                    "text-xs sm:text-sm font-semibold",
                    isLost ? "text-negative" : "text-positive"
                  )}>
                    {formatCurrency(stageData.value)}
                  </p>
                </div>

                {/* Indicator Line */}
                <div className={cn(
                  "absolute bottom-0 left-0 right-0 h-1",
                  `bg-gradient-${config.variant}`
                )} />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
