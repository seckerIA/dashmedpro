
import { useState, useMemo } from 'react';
import { useInventory } from '@/hooks/useInventory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, AlertTriangle, Package } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProductConsumption } from '@/types/inventory';
import { format, parseISO } from 'date-fns';

interface StockConsumptionProps {
    value: ProductConsumption[];
    onChange: (value: ProductConsumption[]) => void;
}

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
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Consumo de Materiais/Medicamentos
                </CardTitle>
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

                {/* Batch Info Preview */}
                {selectedItem && bestBatch && (
                    <div className="text-xs text-muted-foreground flex items-center gap-2 bg-muted/50 p-2 rounded">
                        <Badge variant="outline" className="text-[10px]">Lote: {bestBatch.batch_number}</Badge>
                        <span>Validade: {bestBatch.expiration_date ? format(parseISO(bestBatch.expiration_date), 'dd/MM/yyyy') : 'N/A'}</span>
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
                                        Qtd: {item.quantity} | {item.price ? `Total: R$ ${(item.quantity * item.price).toFixed(2)}` : 'Sem custo extra'}
                                    </p>
                                </div>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleRemove(index)}>
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// Logic Helper to process consumption
// This is not a component, but a logic snippet.
// We will simply export the component here.
