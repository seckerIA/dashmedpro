
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Truck, Import, BarChart, Plus, Search, AlertTriangle, DollarSign, Bell, TrendingUp, PieChart, FileText, Pencil, Calendar, Trash2, ArrowUpDown } from "lucide-react";
import { SuppliersTab } from "@/components/inventory/SuppliersTab";
import { InboundForm } from "@/components/inventory/InboundForm";
import { InventoryDashboard } from "@/components/inventory/InventoryDashboard";
import { AlertsPanel } from "@/components/inventory/AlertsPanel";
import { TurnoverAnalysis } from "@/components/inventory/TurnoverAnalysis";
import { ABCChart } from "@/components/inventory/ABCChart";
import { InventoryReports } from "@/components/inventory/InventoryReports";
import { StockAdjustmentDialog } from "@/components/inventory/StockAdjustmentDialog";
import { useInventory } from "@/hooks/useInventory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { InventoryItem } from "@/types/inventory";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useAuth } from "@/hooks/useAuth";

import { MoneyInput } from "@/components/ui/money-input";

// Schema para criação de produto com lote inicial
const inventoryItemSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    category: z.string().min(1, "Selecione uma categoria"),
    min_stock: z.coerce.number().min(0, "Estoque mínimo não pode ser negativo"),
    unit: z.string().min(1, "Unidade é obrigatória"),
    sell_price: z.number().optional(),
    cost_price: z.number().optional(),
    description: z.string().optional(),
    supplier_id: z.string().min(1, "Selecione um fornecedor"),
    // Campos opcionais para lote inicial
    initial_quantity: z.coerce.number().min(0).optional(),
    batch_number: z.string().optional(),
    expiration_date: z.string().optional(),
});

type InventoryItemFormValues = z.infer<typeof inventoryItemSchema>;

import { DatePicker } from "@/components/ui/date-picker";

// Funções auxiliares para data
const parseDateString = (dateString: string): Date | undefined => {
    if (!dateString) return undefined;
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
};

const formatDateString = (date: Date | undefined): string => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

import type { Supplier } from "@/hooks/useSuppliers";

// Componente de campos do formulário - FORA do componente pai para evitar re-render
const ProductFormFields = ({ formInstance, showBatchFields = false, suppliers = [], onAddSupplier }: { formInstance: any, showBatchFields?: boolean, suppliers?: Supplier[], onAddSupplier?: () => void }) => (
    <>
        <FormField
            control={formInstance.control}
            name="name"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Nome do Produto</FormLabel>
                    <FormControl>
                        <Input placeholder="Ex: Seringa 5ml" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
        <div className="grid grid-cols-2 gap-4">
            <FormField
                control={formInstance.control}
                name="category"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Geral">Geral</SelectItem>
                                <SelectItem value="Medicamento">Medicamento</SelectItem>
                                <SelectItem value="Material">Material</SelectItem>
                                <SelectItem value="Vacina">Vacina</SelectItem>
                                <SelectItem value="Insumo">Insumo</SelectItem>
                                <SelectItem value="Equipamento">Equipamento</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={formInstance.control}
                name="min_stock"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Estoque Mínimo</FormLabel>
                        <FormControl>
                            <Input type="number" {...field} onFocus={(e) => e.target.select()} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <FormField
                control={formInstance.control}
                name="unit"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Unidade</FormLabel>
                        <FormControl>
                            <Input placeholder="Ex: caixa, unidade" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={formInstance.control}
                name="sell_price"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Preço Venda</FormLabel>
                        <FormControl>
                            <MoneyInput
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="0,00"
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        <FormField
            control={formInstance.control}
            name="cost_price"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Preço de Custo</FormLabel>
                    <FormControl>
                        <MoneyInput
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="0,00"
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
        <FormField
            control={formInstance.control}
            name="supplier_id"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Fornecedor *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um fornecedor" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {suppliers.length === 0 ? (
                                <div className="py-6 text-center text-sm">
                                    <p className="text-muted-foreground mb-3">Nenhum fornecedor cadastrado.</p>
                                    {onAddSupplier && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                onAddSupplier();
                                            }}
                                            className="gap-2"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Adicionar Fornecedor
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {suppliers.map((supplier) => (
                                        <SelectItem key={supplier.id} value={supplier.id}>
                                            {supplier.name}
                                        </SelectItem>
                                    ))}
                                    {onAddSupplier && (
                                        <div className="border-t mt-1 pt-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    onAddSupplier();
                                                }}
                                                className="w-full justify-start gap-2 text-primary"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Adicionar Fornecedor
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )}
        />

        {showBatchFields && (
            <>
                <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Package className="h-4 w-4" /> Estoque Inicial (Opcional)
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={formInstance.control}
                            name="initial_quantity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Quantidade Inicial</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="0" {...field} onFocus={(e) => e.target.select()} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={formInstance.control}
                            name="batch_number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nº do Lote</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: LOT-001" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <FormField
                        control={formInstance.control}
                        name="expiration_date"
                        render={({ field }) => (
                            <FormItem className="mt-4">
                                <FormLabel className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" /> Data de Validade
                                </FormLabel>
                                <FormControl>
                                    <DatePicker
                                        date={parseDateString(field.value)}
                                        setDate={(date) => field.onChange(formatDateString(date))}
                                        label="Selecione a validade"
                                    />
                                </FormControl>
                                <FormDescription>
                                    Deixe em branco se o produto não tem validade
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </>
        )}
    </>
);

const InventoryProductsTab = () => {
    const { items, isLoading, createItem, updateItem, deleteItem, addBatch, registerMovement } = useInventory();
    const { suppliers, createSupplier } = useSuppliers();
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
    const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
    const [isQuickSupplierModalOpen, setIsQuickSupplierModalOpen] = useState(false);
    const [quickSupplierName, setQuickSupplierName] = useState("");

    const handleQuickAddSupplier = async () => {
        if (!quickSupplierName.trim() || !user?.id) return;
        try {
            await createSupplier.mutateAsync({
                user_id: user.id,
                name: quickSupplierName.trim(),
                cnpj: '', email: '', phone: '', contact_person: '', address: '',
            } as any);
            setQuickSupplierName("");
            setIsQuickSupplierModalOpen(false);
        } catch (error) {
            console.error("Erro ao criar fornecedor:", error);
        }
    };

    const form = useForm<InventoryItemFormValues>({
        resolver: zodResolver(inventoryItemSchema),
        defaultValues: {
            name: "",
            category: "Geral",
            unit: "unidade",
            min_stock: 5,
            description: "",
            supplier_id: "",
            initial_quantity: 0,
            batch_number: "",
            expiration_date: "",
        },
    });

    const editForm = useForm<InventoryItemFormValues>({
        resolver: zodResolver(inventoryItemSchema),
    });

    // Preencher form de edição quando selecionar um item
    useEffect(() => {
        if (editingItem) {
            editForm.reset({
                name: editingItem.name,
                category: editingItem.category,
                min_stock: editingItem.min_stock,
                unit: editingItem.unit,
                sell_price: editingItem.sell_price || undefined,
                cost_price: editingItem.cost_price || undefined,
                description: editingItem.description || "",
                supplier_id: editingItem.supplier_id || "",
            });
        }
    }, [editingItem, editForm]);

    const onSubmit = async (data: InventoryItemFormValues) => {
        try {
            // 1. Criar o produto
            const newItem = await createItem.mutateAsync({
                name: data.name,
                category: data.category,
                min_stock: data.min_stock,
                unit: data.unit,
                sell_price: data.sell_price,
                cost_price: data.cost_price,
                description: data.description,
                supplier_id: data.supplier_id || null,
                user_id: user?.id,
            } as any);

            // 2. Se tiver quantidade inicial, criar lote inicial
            if (data.initial_quantity && data.initial_quantity > 0 && newItem?.id) {
                await addBatch.mutateAsync({
                    item_id: newItem.id,
                    quantity: data.initial_quantity,
                    batch_number: data.batch_number || `LOTE-${Date.now()}`,
                    expiration_date: data.expiration_date || undefined,
                    is_active: true,
                } as any);
            }

            setIsCreateModalOpen(false);
            form.reset();
        } catch (error) {
            console.error("Erro ao criar item:", error);
        }
    };

    const onEditSubmit = async (data: InventoryItemFormValues) => {
        if (!editingItem) return;
        try {
            await updateItem.mutateAsync({
                id: editingItem.id,
                updates: {
                    name: data.name,
                    category: data.category,
                    min_stock: data.min_stock,
                    unit: data.unit,
                    sell_price: data.sell_price,
                    cost_price: data.cost_price,
                    description: data.description,
                    supplier_id: data.supplier_id || null,
                },
            });
            setIsEditModalOpen(false);
            setEditingItem(null);
        } catch (error) {
            console.error("Erro ao atualizar item:", error);
        }
    };

    const handleEditClick = (item: InventoryItem) => {
        setEditingItem(item);
        setIsEditModalOpen(true);
    };

    const filteredItems = items?.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const lowStockCount = items?.filter(i => (i.total_quantity || 0) <= i.min_stock).length || 0;
    const totalValue = items?.reduce((acc, item) => acc + ((item.total_quantity || 0) * (item.sell_price || 0)), 0) || 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    {/* Header local da aba se necessario */}
                </div>
                {/* Modal de Criar */}
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Novo Produto
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Novo Produto</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <ProductFormFields formInstance={form} showBatchFields={true} suppliers={suppliers} onAddSupplier={() => setIsQuickSupplierModalOpen(true)} />
                                <DialogFooter>
                                    <Button type="submit" disabled={createItem.isPending}>
                                        {createItem.isPending ? "Salvando..." : "Salvar Produto"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>

                {/* Modal de Editar */}
                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Editar Produto</DialogTitle>
                        </DialogHeader>
                        <Form {...editForm}>
                            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                                <ProductFormFields formInstance={editForm} showBatchFields={false} suppliers={suppliers} onAddSupplier={() => setIsQuickSupplierModalOpen(true)} />
                                <DialogFooter>
                                    <Button variant="outline" type="button" onClick={() => setIsEditModalOpen(false)}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={updateItem.isPending}>
                                        {updateItem.isPending ? "Salvando..." : "Atualizar Produto"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{items?.length || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-500">{lowStockCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Valor em Vendas</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-400">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="rounded-md border p-4 bg-card">
                <div className="flex items-center gap-2 mb-4">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-sm"
                    />
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Fornecedor</TableHead>
                            <TableHead>Saldo Atual</TableHead>
                            <TableHead>Preço Venda</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[80px]">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">Carregando...</TableCell>
                            </TableRow>
                        ) : filteredItems?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum produto encontrado</TableCell>
                            </TableRow>
                        ) : (
                            filteredItems?.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{item.category}</Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {item.supplier?.name || '-'}
                                    </TableCell>
                                    <TableCell>{item.total_quantity} {item.unit}</TableCell>
                                    <TableCell>
                                        {item.sell_price
                                            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.sell_price)
                                            : '-'
                                        }
                                    </TableCell>
                                    <TableCell>
                                        {(item.total_quantity || 0) <= item.min_stock ? (
                                            <Badge variant="destructive" className="gap-1">
                                                <AlertTriangle className="h-3 w-3" /> Baixo
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="text-green-400 bg-green-500/20">Normal</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setAdjustingItem(item)}
                                                title="Ajustar estoque"
                                            >
                                                <ArrowUpDown className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEditClick(item)}
                                                title="Editar produto"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setDeletingItemId(item.id)}
                                                title="Excluir produto"
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        {/* Modal de confirmação de exclusão */}
                                        <Dialog open={deletingItemId === item.id} onOpenChange={(open) => !open && setDeletingItemId(null)}>
                                            <DialogContent className="sm:max-w-[400px]">
                                                <DialogHeader>
                                                    <DialogTitle>Confirmar exclusão</DialogTitle>
                                                </DialogHeader>
                                                <p className="text-muted-foreground">
                                                    Tem certeza que deseja excluir <strong>{item.name}</strong>?
                                                    Esta ação não pode ser desfeita.
                                                </p>
                                                <DialogFooter className="gap-2 sm:gap-0">
                                                    <Button variant="outline" onClick={() => setDeletingItemId(null)}>
                                                        Cancelar
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        onClick={async () => {
                                                            await deleteItem.mutateAsync(item.id);
                                                            setDeletingItemId(null);
                                                        }}
                                                        disabled={deleteItem.isPending}
                                                    >
                                                        {deleteItem.isPending ? "Excluindo..." : "Excluir"}
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Dialog de Ajuste de Estoque */}
            {adjustingItem && (
                <StockAdjustmentDialog
                    open={!!adjustingItem}
                    onOpenChange={(open) => !open && setAdjustingItem(null)}
                    item={adjustingItem}
                    onConfirm={async (data) => {
                        await registerMovement.mutateAsync(data);
                        setAdjustingItem(null);
                    }}
                    isPending={registerMovement.isPending}
                />
            )}

            {/* Modal de Adicionar Fornecedor Rápido */}
            <Dialog open={isQuickSupplierModalOpen} onOpenChange={setIsQuickSupplierModalOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Truck className="h-5 w-5" />
                            Novo Fornecedor
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nome do Fornecedor *</Label>
                            <Input
                                value={quickSupplierName}
                                onChange={(e) => setQuickSupplierName(e.target.value)}
                                placeholder="Ex: Farmacêutica ABC"
                                autoFocus
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Para adicionar mais detalhes (CNPJ, contato, etc.), acesse a aba Fornecedores.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsQuickSupplierModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleQuickAddSupplier}
                            disabled={!quickSupplierName.trim() || createSupplier.isPending}
                        >
                            {createSupplier.isPending ? "Salvando..." : "Cadastrar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default function InventoryPage() {
    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-fade-in">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Gestão de Estoque</h1>
                <p className="text-muted-foreground">
                    Controle de supply chain, entradas de notas, fornecedores e rastreabilidade.
                </p>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">
                        <BarChart className="w-4 h-4 mr-2" /> Visão Geral
                    </TabsTrigger>
                    <TabsTrigger value="products">
                        <Package className="w-4 h-4 mr-2" /> Produtos
                    </TabsTrigger>
                    <TabsTrigger value="inbound">
                        <Import className="w-4 h-4 mr-2" /> Entrada de Notas
                    </TabsTrigger>
                    <TabsTrigger value="suppliers">
                        <Truck className="w-4 h-4 mr-2" /> Fornecedores
                    </TabsTrigger>
                    <TabsTrigger value="alerts">
                        <Bell className="w-4 h-4 mr-2" /> Alertas
                    </TabsTrigger>
                    <TabsTrigger value="turnover">
                        <TrendingUp className="w-4 h-4 mr-2" /> Giro
                    </TabsTrigger>
                    <TabsTrigger value="abc">
                        <PieChart className="w-4 h-4 mr-2" /> ABC
                    </TabsTrigger>
                    <TabsTrigger value="reports">
                        <FileText className="w-4 h-4 mr-2" /> Relatórios
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <InventoryDashboard />
                </TabsContent>

                <TabsContent value="products">
                    <InventoryProductsTab />
                </TabsContent>

                <TabsContent value="inbound">
                    <InboundForm />
                </TabsContent>

                <TabsContent value="suppliers">
                    <SuppliersTab />
                </TabsContent>

                <TabsContent value="alerts">
                    <AlertsPanel />
                </TabsContent>

                <TabsContent value="turnover">
                    <TurnoverAnalysis />
                </TabsContent>

                <TabsContent value="abc">
                    <ABCChart />
                </TabsContent>

                <TabsContent value="reports">
                    <InventoryReports />
                </TabsContent>
            </Tabs>
        </div>
    );
}
