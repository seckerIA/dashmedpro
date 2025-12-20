import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { designTokens } from '@/lib/design-tokens';

interface StatsPanelProps {
  distributionData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  className?: string;
}

export function StatsPanel({
  distributionData,
  className,
}: StatsPanelProps) {
  const COLORS = [
    designTokens.chartColors.tertiary,   // Yellow
    designTokens.chartColors.primary,    // Purple
    designTokens.chartColors.secondary,  // Cyan
    designTokens.chartColors.quaternary, // Green
  ];

  return (
    <div className={`space-y-3 sm:space-y-4 lg:space-y-6 ${className}`}>
      {/* Distribution Chart Card */}
      <div className="bg-card rounded-2xl p-3 sm:p-4 lg:p-6 border border-border">
        <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4">
          <h3 className="text-xs sm:text-sm font-semibold text-foreground">
            Distribuição de Vendas
          </h3>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] sm:text-xs text-muted-foreground">Ao vivo</span>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="relative h-[150px] sm:h-[180px] lg:h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={distributionData}
                cx="50%"
                cy="50%"
                innerRadius="40%"
                outerRadius="60%"
                paddingAngle={2}
                dataKey="value"
              >
                {distributionData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color || COLORS[index % COLORS.length]}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Center value */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
                {distributionData.reduce((sum, item) => sum + item.value, 0)}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-3 sm:mt-4 lg:mt-6">
          {distributionData.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color || COLORS[index % COLORS.length] }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {item.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {typeof item.value === 'number' ? item.value.toFixed(2) : item.value}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Online/Offline Visitors */}
      <div className="bg-card rounded-2xl p-3 sm:p-4 lg:p-6 border border-border space-y-2 sm:space-y-3 lg:space-y-4">
        <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-2 sm:mb-3 lg:mb-4">
          Visitantes
        </h3>

        {/* Online */}
        <div>
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="text-xs sm:text-sm text-muted-foreground">Online</span>
            <span className="text-xs sm:text-sm font-semibold text-foreground">20k</span>
          </div>
          <div className="h-1.5 sm:h-2 bg-muted/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full transition-all duration-500"
              style={{ width: '75%' }}
            />
          </div>
        </div>

        {/* Offline */}
        <div>
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="text-xs sm:text-sm text-muted-foreground">Offline</span>
            <span className="text-xs sm:text-sm font-semibold text-foreground">7k</span>
          </div>
          <div className="h-1.5 sm:h-2 bg-muted/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-gray-500 to-gray-400 rounded-full transition-all duration-500"
              style={{ width: '35%' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
