import * as React from "react";
import { format, parseISO, setMonth, setYear, startOfMonth, addYears, subYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MonthPickerProps {
  value: string; // format 'yyyy-MM'
  onChange: (value: string) => void;
  className?: string;
}

const MONTHS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

export function MonthPicker({ value, onChange, className }: MonthPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [currentDate, setCurrentDate] = React.useState(() => parseISO(`${value}-01`));

  // Sync internal state with prop value when it changes externally
  React.useEffect(() => {
    setCurrentDate(parseISO(`${value}-01`));
  }, [value]);

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = setMonth(currentDate, monthIndex);
    setCurrentDate(newDate);
    onChange(format(newDate, 'yyyy-MM'));
    setIsOpen(false);
  };

  const handlePreviousYear = () => {
    setCurrentDate(subYears(currentDate, 1));
  };

  const handleNextYear = () => {
    setCurrentDate(addYears(currentDate, 1));
  };

  const currentYear = currentDate.getFullYear();
  const selectedMonthIndex = parseISO(`${value}-01`).getMonth();
  const selectedYear = parseISO(`${value}-01`).getFullYear();

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className={cn(
          "relative group flex items-center overflow-hidden rounded-xl bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-md border border-white/5 dark:border-primary/20 shadow-sm hover:shadow-glow hover:border-primary/50 transition-all duration-300 text-left outline-none",
          className
        )}>
          {/* Glow effect behind */}
          <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
          
          <div className="flex items-center px-4 py-2.5 relative z-10 w-full">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 mr-3 text-primary group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5 opacity-80">
                Período de Análise
              </span>
              <span className="text-sm font-semibold text-foreground capitalize">
                {format(parseISO(`${value}-01`), "MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>
          </div>
        </button>
      </PopoverTrigger>
      
      <PopoverContent className="w-64 p-3 rounded-xl border-white/10 shadow-xl bg-card/95 backdrop-blur-xl" align="end">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handlePreviousYear}
            className="h-7 w-7 bg-muted/50 hover:bg-primary/20 hover:text-primary transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="font-semibold text-sm">{currentYear}</div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleNextYear}
            className="h-7 w-7 bg-muted/50 hover:bg-primary/20 hover:text-primary transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          {MONTHS.map((month, index) => {
            const isSelected = index === selectedMonthIndex && currentYear === selectedYear;
            const isCurrentMonth = index === new Date().getMonth() && currentYear === new Date().getFullYear();
            
            return (
              <Button
                key={month}
                variant={isSelected ? "default" : "ghost"}
                className={cn(
                  "h-10 w-full text-sm font-medium transition-all duration-200",
                  isSelected ? "bg-primary text-primary-foreground shadow-glow" : "hover:bg-primary/10 hover:text-primary",
                  isCurrentMonth && !isSelected && "border border-primary/30 text-primary"
                )}
                onClick={() => handleMonthSelect(index)}
              >
                {month}
              </Button>
            );
          })}
        </div>
        
        <div className="mt-4 pt-3 border-t border-white/5 flex justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              const now = new Date();
              setCurrentDate(now);
              onChange(format(now, 'yyyy-MM'));
              setIsOpen(false);
            }}
          >
            Este mês
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
