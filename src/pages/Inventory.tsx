import { useState } from 'react';
import { useInventory } from '@/hooks/useInventory';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, AlertTriangle, Package, DollarSign } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { InventoryItem } from '@/types/inventory';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function InventoryPage() {
    const { items, isLoading, createItem } = useInventory();
    const [searchTerm, setSearchTerm] = useState('');
    const [isNewItemOpen, setIsNewItemOpen] = useState(false);

    // Filter items
    const filteredItems = items?.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Stats
    const lowStockCount = items?.filter(i => (i.total_quantity || 0) <= i.min_stock).length || 0;
    const totalValue = items?.reduce((acc, item) => acc + ((item.total_quantity || 0) * (item.sell_price || 0)), 0) || 0;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Estoque e Materiais</h2>
                    <p className="text-muted-foreground">
                        Gerencie vacinas, medicamentos e materiais da clínica
                    </p>
                </div>
                <Button onClick={() => setIsNewItemOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" /> Novo Produto
                </Button>
            </div>

            {/* Stats Cards */}
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
                        <p className="text-xs text-muted-foreground">
                            Produtos abaixo do mínimo
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Valor em Vendas (Estoque)</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Potencial de receita
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Search and List */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nome..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Categoria</TableHead>
                                <TableHead>Saldo Atual</TableHead>
                                <TableHead>Preço Venda</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">Carregando...</TableCell>
                                </TableRow>
                            ) : filteredItems?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum produto encontrado</TableCell>
                                </TableRow>
                            ) : (
                                filteredItems?.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{item.category}</Badge>
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
                                                <Badge variant="secondary" className="text-green-600 bg-green-50">Normal</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm">Gerenciar Lotes</Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <NewItemModal open={isNewItemOpen} onOpenChange={setIsNewItemOpen} onCreate={createItem.mutate} />
        </div>
    );
}

// Modal Interno Simples para Criar
function NewItemModal({ open, onOpenChange, onCreate }: any) {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('Geral');
    const [minStock, setMinStock] = useState('5');
    const [price, setPrice] = useState('');

    const handleSubmit = () => {
        onCreate({
            name,
            category,
            min_stock: parseInt(minStock),
            sell_price: price ? parseFloat(price) : null
        });
        onOpenChange(false);
        setName('');
        setPrice('');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Novo Produto</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Nome do Produto</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Vacina da Gripe" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Categoria</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Vacina">Vacina</SelectItem>
                                    <SelectItem value="Medicamento">Medicamento</SelectItem>
                                    <SelectItem value="Material">Material</SelectItem>
                                    <SelectItem value="Geral">Geral</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Estoque Mínimo</Label>
                            <Input type="number" value={minStock} onChange={e => setMinStock(e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Preço de Venda (Opcional)</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground">R$</span>
                            <Input className="pl-8" type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0,00" />
                        </div>
                        <p className="text-xs text-muted-foreground">Se preenchido, será cobrado automaticamente na consulta.</p>
                    </div>
                    <Button onClick={handleSubmit} className="w-full">Salvar Produto</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
