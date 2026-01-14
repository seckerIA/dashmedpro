import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FolderCog, Plus, Pencil, Trash2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useFinancialCategories } from "@/hooks/useFinancialCategories"
import { useCreateFinancialCategory, useDeleteFinancialCategory } from "@/hooks/useFinancialCategoryMutations"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

const FinancialCategories = () => {
    const navigate = useNavigate()
    const { toast } = useToast()
    const { data: categories, isLoading } = useFinancialCategories()
    const createCategory = useCreateFinancialCategory()
    const deleteCategory = useDeleteFinancialCategory()

    const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState("")
    const [newCategoryType, setNewCategoryType] = useState<"entrada" | "saida">("entrada")
    const [newCategoryColor, setNewCategoryColor] = useState("#10b981")

    const handleCreateCategory = () => {
        if (!newCategoryName.trim()) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Nome da categoria é obrigatório"
            })
            return
        }

        createCategory.mutate({
            name: newCategoryName.trim(),
            type: newCategoryType,
            color: newCategoryColor
        }, {
            onSuccess: () => {
                setIsNewCategoryOpen(false)
                setNewCategoryName("")
                setNewCategoryType("entrada")
                setNewCategoryColor("#10b981")
                toast({
                    title: "Categoria criada",
                    description: "A categoria foi criada com sucesso!"
                })
            }
        })
    }

    const handleDeleteCategory = (id: string, name: string) => {
        if (confirm(`Tem certeza que deseja excluir a categoria "${name}"?`)) {
            deleteCategory.mutate(id)
        }
    }

    const receitas = categories?.filter(c => c.type === 'entrada') || []
    const despesas = categories?.filter(c => c.type === 'saida') || []

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/financeiro')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Categorias Financeiras</h1>
                        <p className="text-muted-foreground">Gerencie as categorias de receitas e despesas</p>
                    </div>
                </div>
                <Button
                    className="bg-emerald-500 hover:bg-emerald-600"
                    onClick={() => setIsNewCategoryOpen(true)}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Categoria
                </Button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Categorias de Receita */}
                    <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
                        <CardHeader>
                            <CardTitle className="text-emerald-500 flex items-center gap-2">
                                <FolderCog className="h-5 w-5" />
                                Categorias de Receita
                            </CardTitle>
                            <CardDescription>Categorias para entradas e receitas</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {receitas.length === 0 ? (
                                <p className="text-muted-foreground text-sm py-4 text-center">
                                    Nenhuma categoria de receita cadastrada
                                </p>
                            ) : (
                                receitas.map((cat) => (
                                    <div
                                        key={cat.id}
                                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: cat.color || '#10b981' }}
                                            />
                                            <span className="font-medium">{cat.name}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    {/* Categorias de Despesa */}
                    <Card className="border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent">
                        <CardHeader>
                            <CardTitle className="text-red-500 flex items-center gap-2">
                                <FolderCog className="h-5 w-5" />
                                Categorias de Despesa
                            </CardTitle>
                            <CardDescription>Categorias para saídas e despesas</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {despesas.length === 0 ? (
                                <p className="text-muted-foreground text-sm py-4 text-center">
                                    Nenhuma categoria de despesa cadastrada
                                </p>
                            ) : (
                                despesas.map((cat) => (
                                    <div
                                        key={cat.id}
                                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: cat.color || '#ef4444' }}
                                            />
                                            <span className="font-medium">{cat.name}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Modal Nova Categoria */}
            <Dialog open={isNewCategoryOpen} onOpenChange={setIsNewCategoryOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Nova Categoria</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nome da Categoria</Label>
                            <Input
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="Ex: Consultas, Aluguel..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Tipo</Label>
                            <Select value={newCategoryType} onValueChange={(v) => setNewCategoryType(v as any)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="entrada">Receita (Entrada)</SelectItem>
                                    <SelectItem value="saida">Despesa (Saída)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Cor</Label>
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-full border-2 border-border cursor-pointer overflow-hidden"
                                    style={{ backgroundColor: newCategoryColor }}
                                >
                                    <input
                                        type="color"
                                        value={newCategoryColor}
                                        onChange={(e) => setNewCategoryColor(e.target.value)}
                                        className="w-full h-full opacity-0 cursor-pointer"
                                    />
                                </div>
                                <Input
                                    value={newCategoryColor}
                                    onChange={(e) => setNewCategoryColor(e.target.value)}
                                    className="flex-1 uppercase"
                                    maxLength={7}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsNewCategoryOpen(false)}>Cancelar</Button>
                        <Button
                            onClick={handleCreateCategory}
                            disabled={createCategory.isPending}
                            className="bg-emerald-500 hover:bg-emerald-600"
                        >
                            Criar Categoria
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default FinancialCategories
