import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Package, Plus, Minus } from "lucide-react";
import { InventoryItem, InventoryBatch } from "@/types/inventory";

const MOTIVOS_RETIRADA = [
    { value: "quebra", label: "Quebra" },
    { value: "uso_interno", label: "Uso interno" },
    { value: "promocao", label: "Promoção" },
    { value: "vencimento", label: "Vencimento" },
    { value: "dano", label: "Dano" },
    { value: "outro", label: "Outro" },
];

const MOTIVOS_ADICAO = [
    { value: "correcao", label: "Correção de inventário" },
    { value: "devolucao", label: "Devolução" },
    { value: "bonificacao", label: "Bonificação" },
    { value: "outro", label: "Outro" },
];

interface StockAdjustmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: InventoryItem;
    onConfirm: (data: {
        batchId: string;
        type: 'ADJUST' | 'LOSS';
        quantity: number;
        description: string;
    }) => Promise<void>;
    isPending?: boolean;
}

export function StockAdjustmentDialog({
    open,
    onOpenChange,
    item,
    onConfirm,
    isPending = false
}: StockAdjustmentDialogProps) {
    const [operation, setOperation] = useState<"add" | "remove">("remove");
    const [quantity, setQuantity] = useState<number>(1);
    const [selectedBatchId, setSelectedBatchId] = useState<string>("");
    const [motivo, setMotivo] = useState<string>("");
    const [observacao, setObservacao] = useState<string>("");

    const activeBatches = item.batches?.filter(b => b.quantity > 0) || [];
    const selectedBatch = activeBatches.find(b => b.id === selectedBatchId);
    const motivos = operation === "remove" ? MOTIVOS_RETIRADA : MOTIVOS_ADICAO;

    // Reset form when dialog opens
    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen) {
            setOperation("remove");
            setQuantity(1);
            setSelectedBatchId(activeBatches[0]?.id || "");
            setMotivo("");
            setObservacao("");
        }
        onOpenChange(isOpen);
    };

    const handleConfirm = async () => {
        if (!selectedBatchId || !motivo || quantity <= 0) return;

        const motivoLabel = motivos.find(m => m.value === motivo)?.label || motivo;
        const descricao = observacao
            ? `${motivoLabel} - ${observacao}`
            : motivoLabel;

        await onConfirm({
            batchId: selectedBatchId,
            type: operation === "remove" ? "LOSS" : "ADJUST",
            quantity: operation === "remove" ? -quantity : quantity,
            description: descricao
        });

        handleOpenChange(false);
    };

    const maxQuantity = operation === "remove" && selectedBatch
        ? selectedBatch.quantity
        : 9999;

    const isValid = selectedBatchId && motivo && quantity > 0 && quantity <= maxQuantity;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Ajustar Estoque - {item.name}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Operação */}
                    <div className="space-y-2">
                        <Label>Operação</Label>
                        <RadioGroup
                            value={operation}
                            onValueChange={(v) => setOperation(v as "add" | "remove")}
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="remove" id="remove" />
                                <Label htmlFor="remove" className="flex items-center gap-1 cursor-pointer">
                                    <Minus className="h-4 w-4 text-red-500" /> Retirar
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="add" id="add" />
                                <Label htmlFor="add" className="flex items-center gap-1 cursor-pointer">
                                    <Plus className="h-4 w-4 text-green-500" /> Adicionar
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Lote */}
                    {activeBatches.length > 0 ? (
                        <div className="space-y-2">
                            <Label>Lote</Label>
                            <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o lote" />
                                </SelectTrigger>
                                <SelectContent>
                                    {activeBatches.map((batch) => (
                                        <SelectItem key={batch.id} value={batch.id}>
                                            {batch.batch_number} - {batch.quantity} {item.unit}
                                            {batch.expiration_date && ` (Val: ${new Date(batch.expiration_date).toLocaleDateString('pt-BR')})`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ) : (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-md text-amber-500 text-sm">
                            Este produto não possui lotes com estoque disponível.
                        </div>
                    )}

                    {/* Quantidade */}
                    <div className="space-y-2">
                        <Label>Quantidade ({item.unit})</Label>
                        <Input
                            type="number"
                            min={1}
                            max={maxQuantity}
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            onFocus={(e) => e.target.select()}
                        />
                        {operation === "remove" && selectedBatch && (
                            <p className="text-xs text-muted-foreground">
                                Disponível no lote: {selectedBatch.quantity} {item.unit}
                            </p>
                        )}
                    </div>

                    {/* Motivo */}
                    <div className="space-y-2">
                        <Label>Motivo</Label>
                        <Select value={motivo} onValueChange={setMotivo}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o motivo" />
                            </SelectTrigger>
                            <SelectContent>
                                {motivos.map((m) => (
                                    <SelectItem key={m.value} value={m.value}>
                                        {m.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Observação */}
                    <div className="space-y-2">
                        <Label>Observação (opcional)</Label>
                        <Textarea
                            placeholder="Detalhes adicionais..."
                            value={observacao}
                            onChange={(e) => setObservacao(e.target.value)}
                            rows={2}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!isValid || isPending || activeBatches.length === 0}
                        variant={operation === "remove" ? "destructive" : "default"}
                    >
                        {isPending ? "Salvando..." : operation === "remove" ? "Retirar" : "Adicionar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
