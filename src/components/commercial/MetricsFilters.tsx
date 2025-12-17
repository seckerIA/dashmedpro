import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { PeriodFilter } from "@/types/metrics";
import { cn } from "@/lib/utils";

interface MetricsFiltersProps {
  period: PeriodFilter;
  onPeriodChange: (period: PeriodFilter) => void;
  customRange?: { start: Date; end: Date };
  onCustomRangeChange?: (range: { start: Date; end: Date }) => void;
}

export function MetricsFilters({
  period,
  onPeriodChange,
  customRange,
  onCustomRangeChange,
}: MetricsFiltersProps) {
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  const periodOptions: { value: PeriodFilter; label: string }[] = [
    { value: 'today', label: 'Hoje' },
    { value: 'week', label: 'Esta Semana' },
    { value: 'month', label: 'Este Mês' },
    { value: 'quarter', label: 'Este Trimestre' },
    { value: 'year', label: 'Este Ano' },
    { value: 'custom', label: 'Personalizado' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Período:</span>
        <div className="flex flex-wrap gap-2">
          {periodOptions.map((option) => (
            <Button
              key={option.value}
              variant={period === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => {
                onPeriodChange(option.value);
                if (option.value !== 'custom') {
                  setIsCustomOpen(false);
                }
              }}
              className={cn(
                "text-xs",
                period === option.value && "bg-primary text-primary-foreground"
              )}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {period === 'custom' && onCustomRangeChange && (
        <Popover open={isCustomOpen} onOpenChange={setIsCustomOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "w-[280px] justify-start text-left font-normal",
                !customRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {customRange ? (
                <>
                  {format(customRange.start, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                  {format(customRange.end, "dd/MM/yyyy", { locale: ptBR })}
                </>
              ) : (
                <span>Selecione o período</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              defaultMonth={customRange?.start}
              selected={{
                from: customRange?.start,
                to: customRange?.end,
              }}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  onCustomRangeChange({
                    start: range.from,
                    end: range.to,
                  });
                  setIsCustomOpen(false);
                }
              }}
              numberOfMonths={2}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

