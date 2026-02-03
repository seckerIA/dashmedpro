import { useState, useMemo } from "react";
import { useInventory } from "@/hooks/useInventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Search, Package, AlertCircle, Calendar, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { format, parseISO, isPast, isBefore, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface StockUsageItem {
    inventory_item_id: string;
    quantity: number;
    name: string;
    unit: string;
    total_quantity?: number;
    min_stock?: number;
    nearest_expiry?: string | null;
}

interface StockUsageSelectorProps {
    value: StockUsageItem[];
    onChange: (items: StockUsageItem[]) => void;
    readOnly?: boolean;
}

export function StockUsageSelector({ value, onChange, readOnly = false }: StockUsageSelectorProps) {
    const { items, isLoading } = useInventory();
    const [searchTerm, setSearchTerm] = useState("");
    const [isFocused, setIsFocused] = useState(false);

    const filteredItems = useMemo(() => {
        if (!items) return [];
        return items.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !value.some(v => v.inventory_item_id === item.id)
        );
    }, [items, searchTerm, value]);

    const getNearestExpiry = (batches: any[]) => {
        if (!batches || batches.length === 0) return null;
        const validDates = batches
            .map(b => b.expiration_date)
            .filter(Boolean)
            .map(d => parseISO(d!));

        if (validDates.length === 0) return null;
        return validDates.sort((a, b) => a.getTime() - b.getTime())[0];
    };

    const handleAddItem = (item: any) => {
        const expiry = getNearestExpiry(item.batches || []);
        const newItem: StockUsageItem = {
            inventory_item_id: item.id,
            quantity: 1,
            name: item.name,
            unit: item.unit,
            total_quantity: item.total_quantity,
            min_stock: item.min_stock,
            nearest_expiry: expiry ? expiry.toISOString() : null
        };
        onChange([...value, newItem]);
        setSearchTerm("");
        setIsFocused(false);
    };

    const handleRemoveItem = (id: string) => {
        onChange(value.filter(item => item.inventory_item_id !== id));
    };

    const handleQuantityChange = (id: string, newQty: number) => {
        if (newQty < 0) return;
        onChange(value.map(item =>
            item.inventory_item_id === id ? { ...item, quantity: newQty } : item
        ));
    };

    const formatExpiry = (dateStr: string | null | undefined) => {
        if (!dateStr) return "N/A";
        const date = parseISO(dateStr);
        return format(date, "dd/MM", { locale: ptBR });
    };

    const getExpiryStatusColor = (dateStr: string | null | undefined) => {
        if (!dateStr) return "text-zinc-500";
        const date = parseISO(dateStr);
        if (isPast(date)) return "text-destructive font-bold animate-pulse";
        if (isBefore(date, addMonths(new Date(), 3))) return "text-amber-500 font-medium";
        return "text-emerald-500 font-medium";
    };

    if (readOnly && value.length === 0) {
        return <p className="text-sm text-muted-foreground italic">Nenhum insumo vinculado.</p>;
    }

    return (
        <div className="space-y-4 border border-white/10 rounded-xl p-4 bg-zinc-950/40 backdrop-blur-md shadow-2xl relative overflow-visible">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Package className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm text-zinc-100">Insumos & Medicamentos</h4>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Controle de Saída Automática</p>
                    </div>
                </div>
                {value.length > 0 && (
                    <div className="px-2 py-1 rounded-full bg-primary/20 border border-primary/30">
                        <span className="text-[10px] font-bold text-primary">{value.length} ITEM{value.length > 1 ? 'S' : ''}</span>
                    </div>
                )}
            </div>

            {!readOnly && (
                <div className="relative">
                    <div className={cn(
                        "relative group transition-all duration-300",
                        isFocused ? "scale-[1.01]" : ""
                    )}>
                        <Search className={cn(
                            "absolute left-3 top-2.5 h-4 w-4 transition-colors",
                            isFocused ? "text-primary" : "text-zinc-500"
                        )} />
                        <Input
                            placeholder="Pesquisar no catálogo de estoque..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                            className="pl-10 bg-zinc-900/50 border-white/5 focus:border-primary/50 focus:ring-primary/20 h-10 transition-all text-sm"
                        />
                    </div>

                    <AnimatePresence>
                        {(isFocused && (searchTerm || filteredItems.length > 0)) && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 5, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                className="absolute left-0 right-0 p-1 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10"
                            >
                                {isLoading ? (
                                    <div className="p-4 space-y-3">
                                        <Skeleton className="h-8 w-full bg-white/5" />
                                        <Skeleton className="h-8 w-3/4 bg-white/5" />
                                    </div>
                                ) : searchTerm && filteredItems.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <Package className="h-8 w-8 text-zinc-700 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm text-zinc-500">Nenhum item encontrado para "{searchTerm}"</p>
                                    </div>
                                ) : !searchTerm && filteredItems.length === 0 ? (
                                    <div className="p-1 space-y-1">
                                        <div className="px-3 py-2">
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                                <div className="h-1 w-1 rounded-full bg-primary" />
                                                Catálogo Rápido
                                            </p>
                                        </div>
                                        {items?.slice(0, 5).map(item => {
                                            const expiry = getNearestExpiry(item.batches || []);
                                            const isLow = item.total_quantity <= item.min_stock;
                                            return (
                                                <div
                                                    key={item.id}
                                                    className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-all border border-transparent hover:border-white/5 group"
                                                    onMouseDown={() => handleAddItem(item)}
                                                >
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-semibold text-sm text-zinc-200 group-hover:text-primary transition-colors">{item.name}</span>
                                                        <div className="flex items-center gap-3">
                                                            <span className={cn(
                                                                "text-[10px] flex items-center gap-1",
                                                                isLow ? "text-amber-500" : "text-zinc-500"
                                                            )}>
                                                                {isLow && <AlertCircle className="h-2.5 w-2.5" />}
                                                                {item.total_quantity}/{item.min_stock} {item.unit}
                                                            </span>
                                                            {expiry && (
                                                                <span className={cn("text-[10px] flex items-center gap-1", getExpiryStatusColor(expiry.toISOString()))}>
                                                                    <Calendar className="h-2.5 w-2.5" />
                                                                    {format(expiry, "dd/MM")}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Plus className="h-3 w-3 text-zinc-600 group-hover:text-primary transition-all mr-2" />
                                                </div>
                                            );
                                        })}
                                        {(items?.length || 0) > 5 && (
                                            <div className="p-2 text-center border-t border-white/5">
                                                <p className="text-[10px] text-zinc-600 italic">Digite para ver mais itens...</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-1 space-y-1">
                                        {filteredItems.map(item => {
                                            const expiry = getNearestExpiry(item.batches || []);
                                            const isLow = item.total_quantity <= item.min_stock;

                                            return (
                                                <div
                                                    key={item.id}
                                                    className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-all border border-transparent hover:border-white/5 group"
                                                    onMouseDown={() => handleAddItem(item)}
                                                >
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-semibold text-sm text-zinc-200 group-hover:text-primary transition-colors">{item.name}</span>
                                                        <div className="flex items-center gap-3">
                                                            <span className={cn(
                                                                "text-[10px] flex items-center gap-1",
                                                                isLow ? "text-amber-500" : "text-zinc-500"
                                                            )}>
                                                                {isLow && <AlertCircle className="h-2.5 w-2.5" />}
                                                                Saldo: {item.total_quantity}/{item.min_stock} {item.unit}
                                                            </span>
                                                            {expiry && (
                                                                <span className={cn("text-[10px] flex items-center gap-1", getExpiryStatusColor(expiry.toISOString()))}>
                                                                    <Calendar className="h-2.5 w-2.5" />
                                                                    {format(expiry, "dd/MM/yy")}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="h-6 w-6 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                                        <Plus className="h-3 w-3 text-primary" />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            <div className="space-y-3 relative z-10">
                <AnimatePresence mode="popLayout">
                    {value.map((item) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            key={item.inventory_item_id}
                            className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-all group shadow-sm"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-bold text-zinc-100 truncate">{item.name}</span>
                                    {item.nearest_expiry && (
                                        <div className={cn("px-1.5 py-0.5 rounded text-[10px] bg-white/5 flex items-center gap-1", getExpiryStatusColor(item.nearest_expiry))}>
                                            <Calendar className="h-2.5 w-2.5" />
                                            Val: {formatExpiry(item.nearest_expiry)}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] text-zinc-500 font-medium">
                                        Disp: <span className="text-zinc-300">{item.total_quantity || 0} {item.unit}</span>
                                    </span>
                                    {item.min_stock && (
                                        <span className="text-[10px] text-zinc-500 font-medium">
                                            Min: <span className="text-zinc-300">{item.min_stock}</span>
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pl-3 border-l border-white/5">
                                <div className="flex flex-col items-center gap-1">
                                    <Label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Qtd</Label>
                                    {readOnly ? (
                                        <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg border border-primary/20 min-w-[3rem] text-center">
                                            {item.quantity}
                                        </span>
                                    ) : (
                                        <div className="relative w-20">
                                            <Input
                                                type="number"
                                                min={1}
                                                step={1}
                                                value={item.quantity}
                                                onChange={(e) => handleQuantityChange(item.inventory_item_id, parseInt(e.target.value) || 0)}
                                                onFocus={(e) => e.target.select()}
                                                className="h-8 bg-zinc-900 border-white/10 focus:ring-primary/20 text-xs font-bold text-center pr-2"
                                            />
                                        </div>
                                    )}
                                </div>

                                {!readOnly && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 text-zinc-500 hover:text-destructive hover:bg-destructive/10 transition-all rounded-full group-hover:scale-105"
                                        onClick={() => handleRemoveItem(item.inventory_item_id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {value.length === 0 && !searchTerm && !readOnly && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center p-8 border border-dashed border-white/5 rounded-xl bg-white/[0.02]"
                    >
                        <AlertCircle className="h-6 w-6 text-zinc-700 mb-2" />
                        <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Selecione medicamentos na busca acima</p>
                    </motion.div>
                )}
            </div>

            {/* Visual indicator of "Automático" */}
            <div className="px-3 py-2 bg-primary/5 rounded-lg border border-primary/10 flex items-center justify-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] text-primary/80 font-semibold italic">A baixa será processada automaticamente ao concluir o atendimento</span>
            </div>
        </div>
    );
}
