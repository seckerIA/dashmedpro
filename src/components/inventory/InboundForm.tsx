
import React, { useState } from "react";
import { useInventoryTransaction, TransactionItemInput } from "@/hooks/useInventoryTransaction";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useInventory } from "@/hooks/useInventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { MoneyInput } from "@/components/ui/money-input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, CalendarIcon, PackageOpen } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function InboundForm({ onSuccess }: { onSuccess?: () => void }) {
    const { createTransaction } = useInventoryTransaction();
    const { suppliers } = useSuppliers();
    const { items: products } = useInventory();
    const { toast } = useToast();

    const [headerData, setHeaderData] = useState({
        supplier_id: "",
        invoice_number: "",
        transaction_date: new Date(),
        description: "",
        createFinancialRecord: true,
    });

    const [items, setItems] = useState<TransactionItemInput[]>([]);
    const [currentItem, setCurrentItem] = useState<Partial<TransactionItemInput>>({
        quantity: 1,
        unit_price: 0,
    });

    // Auto-preencher dados quando produto é selecionado
    const handleProductSelect = (productId: string) => {
        const product = products?.find(p => p.id === productId);

        if (product) {
            // Buscar o lote mais recente ativo
            const latestBatch = product.batches
                ?.filter(b => b.is_active)
                ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

            setCurrentItem({
                ...currentItem,
                item_id: productId,
                batch_number: latestBatch?.batch_number || "",
                expiration_date: latestBatch?.expiration_date
                    ? new Date(latestBatch.expiration_date)
                    : undefined,
                unit_price: product.cost_price || 0,
            });
        } else {
            setCurrentItem({ ...currentItem, item_id: productId });
        }
    };

    const handleAddItem = () => {
        if (!currentItem.item_id || !currentItem.quantity || !currentItem.unit_price) {
            toast({
                title: "Erro",
                description: "Preencha todos os campos do item (Produto, Qtd, Preço).",
                variant: "destructive",
            });
            return;
        }

        if (!currentItem.batch_number) {
            toast({
                title: "Atenção",
                description: "Número do Lote é obrigatório para rastreabilidade.",
                variant: "destructive",
            });
            return;
        }

        setItems([...items, currentItem as TransactionItemInput]);
        setCurrentItem({ quantity: 1, unit_price: 0, item_id: "", batch_number: "", expiration_date: undefined });
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const handleSubmit = async () => {
        if (items.length === 0) {
            toast({ title: "Erro", description: "Adicione pelo menos um item à nota.", variant: "destructive" });
            return;
        }
        if (!headerData.supplier_id) {
            toast({ title: "Erro", description: "Selecione um fornecedor.", variant: "destructive" });
            return;
        }

        try {
            await createTransaction.mutateAsync({
                type: "INBOUND_INVOICE",
                supplier_id: headerData.supplier_id,
                invoice_number: headerData.invoice_number,
                transaction_date: headerData.transaction_date,
                description: headerData.description,
                items: items,
                createFinancialRecord: headerData.createFinancialRecord,
            });

            toast({ title: "Sucesso", description: "Entrada de nota registrada com sucesso!" });
            setItems([]);
            setHeaderData({ ...headerData, invoice_number: "", description: "" });
            if (onSuccess) onSuccess();
        } catch (error: any) {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        }
    };

    const totalValue = items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cabeçalho da Nota */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Dados da Nota Fiscal</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Fornecedor</Label>
                            <Select
                                value={headerData.supplier_id}
                                onValueChange={(val) => setHeaderData({ ...headerData, supplier_id: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {suppliers?.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Nº Nota</Label>
                                <Input
                                    value={headerData.invoice_number}
                                    onChange={(e) => setHeaderData({ ...headerData, invoice_number: e.target.value })}
                                    placeholder="000123"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Data Emissão</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !headerData.transaction_date && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {headerData.transaction_date ? format(headerData.transaction_date, "dd/MM/yyyy") : <span>Selecione</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={headerData.transaction_date}
                                            onSelect={(date) => date && setHeaderData({ ...headerData, transaction_date: date })}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox
                                id="financial"
                                checked={headerData.createFinancialRecord}
                                onCheckedChange={(c) => setHeaderData({ ...headerData, createFinancialRecord: !!c })}
                            />
                            <Label htmlFor="financial" className="text-sm font-normal">
                                Gerar contas a pagar (Despesa)
                            </Label>
                        </div>
                    </CardContent>
                </Card>

                {/* Adicionar Item */}
                <Card className="bg-muted/20 border-dashed">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <PackageOpen className="h-4 w-4" /> Adicionar Item
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Produto</Label>
                            <Select
                                value={currentItem.item_id}
                                onValueChange={handleProductSelect}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Busque o produto..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {products?.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Lote</Label>
                                <Input
                                    placeholder="Lote ABC"
                                    value={currentItem.batch_number || ""}
                                    onChange={(e) => setCurrentItem({ ...currentItem, batch_number: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Validade</Label>
                                <DatePicker
                                    date={currentItem.expiration_date}
                                    setDate={(date) => setCurrentItem({ ...currentItem, expiration_date: date })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Qtd</Label>
                                <Input
                                    type="number"
                                    value={currentItem.quantity}
                                    onChange={(e) => setCurrentItem({ ...currentItem, quantity: Number(e.target.value) })}
                                    onFocus={(e) => e.target.select()}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Custo Unit. (R$)</Label>
                                <MoneyInput
                                    value={currentItem.unit_price}
                                    onChange={(value) => setCurrentItem({ ...currentItem, unit_price: value })}
                                />
                            </div>
                        </div>

                        <Button className="w-full" onClick={handleAddItem} variant="secondary">
                            <Plus className="mr-2 h-4 w-4" /> Adicionar à Lista
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Lista de Itens */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Produto</TableHead>
                                <TableHead>Lote / Validade</TableHead>
                                <TableHead className="text-right">Qtd</TableHead>
                                <TableHead className="text-right">Custo Unit.</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        Nenhum item adicionado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map((item, idx) => {
                                    const product = products?.find(p => p.id === item.item_id);
                                    return (
                                        <TableRow key={idx}>
                                            <TableCell className="font-medium">{product?.name || "..."}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col text-xs">
                                                    <span className="font-medium">Lote: {item.batch_number}</span>
                                                    <span className="text-muted-foreground">Val: {item.expiration_date?.toLocaleDateString()}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">{item.quantity}</TableCell>
                                            <TableCell className="text-right">R$ {item.unit_price.toFixed(2)}</TableCell>
                                            <TableCell className="text-right font-bold">R$ {(item.quantity * item.unit_price).toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(idx)} className="text-red-500">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                <div className="p-4 border-t bg-muted/20 flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                        {items.length} itens na nota
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-lg">
                            Total: <span className="font-bold">R$ {totalValue.toFixed(2)}</span>
                        </div>
                        <Button size="lg" onClick={handleSubmit} disabled={items.length === 0}>
                            Confirmar Entrada
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
