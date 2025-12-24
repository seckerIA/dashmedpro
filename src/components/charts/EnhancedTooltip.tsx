import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface EnhancedTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    dataKey?: string;
    color?: string;
    payload?: any;
  }>;
  label?: string;
  formatter?: (value: number, name: string) => [string, string];
  showComparison?: boolean;
  comparisonValue?: number;
  valueFormatter?: (value: number) => string;
  labelFormatter?: (label: string) => string;
}

export function EnhancedTooltip({
  active,
  payload,
  label,
  formatter,
  showComparison = false,
  comparisonValue,
  valueFormatter,
  labelFormatter,
}: EnhancedTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const formatValue = (value: number, dataKey?: string): string => {
    if (valueFormatter) {
      return valueFormatter(value);
    }
    
    // Detectar se é valor monetário baseado no dataKey ou valor
    if (dataKey?.includes('revenue') || dataKey?.includes('value') || dataKey?.includes('amount') || value > 100) {
      return formatCurrency(value);
    }
    
    // Se for percentual (0-1)
    if (value <= 1 && value >= 0) {
      return `${(value * 100).toFixed(1)}%`;
    }
    
    return value.toLocaleString('pt-BR');
  };

  const displayLabel = labelFormatter ? labelFormatter(label || '') : label || '';

  return (
    <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-xl p-3 min-w-[200px]">
      {displayLabel && (
        <p className="text-sm font-semibold text-foreground mb-2 pb-2 border-b border-border">
          {displayLabel}
        </p>
      )}
      
      <div className="space-y-2">
        {payload.map((entry, index) => {
          const value = entry.value || 0;
          const formattedValue = formatter 
            ? formatter(value, entry.name || entry.dataKey || '')
            : [formatValue(value, entry.dataKey), entry.name || entry.dataKey || 'Valor'];
          
          const [displayValue, displayName] = Array.isArray(formattedValue) 
            ? formattedValue 
            : [formatValue(value, entry.dataKey), entry.name || 'Valor'];

          // Calcular percentual se houver total
          const total = payload.reduce((sum, p) => sum + (p.value || 0), 0);
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';

          return (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: entry.color || '#6366f1' }}
                  />
                  <span className="text-sm text-muted-foreground truncate">
                    {displayName}:
                  </span>
                </div>
                <span className="text-sm font-bold text-foreground whitespace-nowrap">
                  {displayValue}
                </span>
              </div>
              
              {/* Mostrar percentual se houver múltiplos valores */}
              {payload.length > 1 && (
                <div className="text-xs text-muted-foreground ml-5">
                  {percentage}% do total
                </div>
              )}
              
              {/* Comparação com período anterior */}
              {showComparison && comparisonValue !== undefined && (
                <div className={cn(
                  "text-xs ml-5 flex items-center gap-1",
                  value > comparisonValue ? "text-green-600 dark:text-green-400" : 
                  value < comparisonValue ? "text-red-600 dark:text-red-400" : 
                  "text-muted-foreground"
                )}>
                  <span>
                    {value > comparisonValue ? '↑' : value < comparisonValue ? '↓' : '='}
                  </span>
                  <span>
                    {Math.abs(((value - comparisonValue) / (comparisonValue || 1)) * 100).toFixed(1)}% vs período anterior
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}




