import * as React from "react";
import { Input } from "@/components/ui/input";

interface MoneyInputProps
    extends Omit<React.ComponentProps<"input">, "value" | "onChange"> {
    value?: number;
    onChange?: (value: number) => void;
}

const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
    ({ className, value, onChange, ...props }, ref) => {
        // Format numeric value to BRL currency string
        const formatCurrency = (val: number) => {
            return new Intl.NumberFormat("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(val);
        };

        // Initial display value
        const [displayValue, setDisplayValue] = React.useState(
            value !== undefined ? formatCurrency(value) : ""
        );

        // Sync external value changes to display value
        React.useEffect(() => {
            if (value !== undefined) {
                setDisplayValue(formatCurrency(value));
            } else {
                setDisplayValue("");
            }
        }, [value]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const inputValue = e.target.value;

            // Remove all non-numeric characters
            const numericString = inputValue.replace(/\D/g, "");

            if (!numericString) {
                setDisplayValue("");
                if (onChange) onChange(0);
                return;
            }

            // Convert to number (cents)
            const numericValue = parseInt(numericString, 10) / 100;

            // Update parent
            if (onChange) {
                onChange(numericValue);
            }

            // Update local display immediately for smooth typing
            setDisplayValue(formatCurrency(numericValue));
        };

        return (
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    R$
                </span>
                <Input
                    type="text"
                    inputMode="numeric"
                    className={`pl-9 ${className}`}
                    value={displayValue}
                    onChange={handleChange}
                    ref={ref}
                    {...props}
                />
            </div>
        );
    }
);
MoneyInput.displayName = "MoneyInput";

export { MoneyInput };
