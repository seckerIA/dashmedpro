
import { useState, useMemo } from 'react';
import { useInventory } from '@/hooks/useInventory';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, AlertTriangle, Package, Clock, DollarSign } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProductConsumption } from '@/types/inventory';
import { format, parseISO, differenceInDays } from 'date-fns';

interface StockConsumptionProps {
    value: ProductConsumption[];
    onChange: (value: ProductConsumption[]) => void;
}

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function StockConsumption({ value = [], onChange }: StockConsumptionProps) {
    const { items } = useInventory();
    const [selectedItemId, setSelectedItemId] = useState<string>('');
    const [quantity, setQuantity] = useState<number>(1);

    // Derived state
    const selectedItem = items?.find(i => i.id === selectedItemId);

    // Sort batches by expiration date (FEFO) - First Expirie First Out logic helper
    const sortedBatches = useMemo(() => {
        if (!selectedItem?.batches) return [];
        return [...selectedItem.batches]
            .filter(b => b.quantity > 0 && b.is_active)
            .sort((a, b) => {
                const dateA = a.expiration_date ? new Date(a.expiration_date).getTime() : 9999999999999;
                const dateB = b.expiration_date ? new Date(b.expiration_date).getTime() : 9999999999999;
                return dateA - dateB;
            });
    }, [selectedItem]);

    // Auto-select best batch
    const bestBatch = sortedBatches[0];

    // Calculate total cost of consumed items
    const totalCost = useMemo(() => {
        return value.reduce((sum, item) => {
            const itemPrice = item.price || 0;
            return sum + (item.quantity * itemPrice);
        }, 0);
    }, [value]);

    // Check if best batch is expiring soon
    const isExpiringSoon = useMemo(() => {
        if (!bestBatch?.expiration_date) return false;
        const days = differenceInDays(parseISO(bestBatch.expiration_date), new Date());
        return days <= 30;
    }, [bestBatch]);

    const handleAdd = () => {
        if (selectedItemId && quantity > 0 && bestBatch) {
            onChange([...value, {
                itemId: selectedItemId,
                batchId: bestBatch.id,
                quantity: quantity,
                price: selectedItem?.sell_price || null
            }]);
            setSelectedItemId('');
            setQuantity(1);
        }
    };

    const handleRemove = (index: number) => {
        onChange(value.filter((_, i) => i !== index));
    };

    const getItemName = (id: string) => items?.find(i => i.id === id)?.name || id;

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Consumo de Materiais/Medicamentos
                    </CardTitle>
                    {value.length > 0 && totalCost > 0 && (
                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                            <DollarSign className="h-3 w-3 mr-1" />
                            Total: {formatCurrency(totalCost)}
                        </Badge>
                    )}
                </div>
                <CardDescription className="text-xs flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Seleção automática FEFO (First Expiry First Out)
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                        <Label>Produto</Label>
                        <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um produto..." />
                            </SelectTrigger>
                            <SelectContent>
                                {items?.map(item => (
                                    <SelectItem key={item.id} value={item.id} disabled={(item.total_quantity || 0) <= 0}>
                                        <span className="flex items-center justify-between w-full">
                                            <span>{item.name}</span>
                                            <span className="text-muted-foreground text-xs ml-2">
                                                (Est: {item.total_quantity})
                                                {item.sell_price && ` - R$ ${item.sell_price}`}
                                            </span>
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-24 space-y-1">
                        <Label>Qtd</Label>
                        <Input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        />
                    </div>
                    <Button onClick={handleAdd} disabled={!selectedItemId || !bestBatch}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>

                {/* Batch Info Preview with FEFO indicator */}
                {selectedItem && bestBatch && (
                    <div className={`text-xs flex items-center gap-2 p-2 rounded border ${isExpiringSoon
                            ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                            : 'bg-muted/50 text-muted-foreground'
                        }`}>
                        <Badge variant="outline" className="text-[10px]">
                            Lote: {bestBatch.batch_number}
                        </Badge>
                        <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Val: {bestBatch.expiration_date ? format(parseISO(bestBatch.expiration_date), 'dd/MM/yyyy') : 'N/A'}
                        </span>
                        {isExpiringSoon && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 text-[10px]">
                                Próx. vencimento
                            </Badge>
                        )}
                        <span className="ml-auto">Disponível: {bestBatch.quantity}</span>
                    </div>
                )}

                {/* Warning if no stock */}
                {selectedItemId && !bestBatch && (
                    <div className="text-xs text-red-500 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Sem lotes disponíveis para este item.
                    </div>
                )}

                {/* List */}
                {value.length > 0 && (
                    <div className="space-y-2 pt-2">
                        {value.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-2 rounded bg-secondary/20 border">
                                <div>
                                    <p className="font-medium text-sm">{getItemName(item.itemId)}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Qtd: {item.quantity} | {item.price ? `Valor: ${formatCurrency(item.quantity * item.price)}` : 'Sem custo extra'}
                                    </p>
                                </div>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleRemove(index)}>
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}

                        {/* Summary Footer */}
                        {totalCost > 0 && (
                            <div className="flex justify-between items-center pt-2 mt-2 border-t">
                                <span className="text-sm text-muted-foreground">
                                    {value.length} item(s) • {value.reduce((s, i) => s + i.quantity, 0)} unidades
                                </span>
                                <span className="font-semibold text-green-600">
                                    {formatCurrency(totalCost)}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

