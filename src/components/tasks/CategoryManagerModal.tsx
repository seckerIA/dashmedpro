import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTaskCategories, TaskCategory, CATEGORY_COLORS } from '@/hooks/useTaskCategories';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit2, Check, X, Loader2, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryManagerModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CategoryManagerModal({ open, onOpenChange }: CategoryManagerModalProps) {
    const { toast } = useToast();
    const {
        categories,
        isLoading,
        createCategory,
        updateCategory,
        deleteCategory,
        isCreating,
        isUpdating,
        isDeleting,
    } = useTaskCategories();

    const [showNewForm, setShowNewForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState('text-blue-600');
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState('');

    const handleCreate = async () => {
        if (!newName.trim()) {
            toast({
                variant: 'destructive',
                title: 'Nome obrigatório',
                description: 'Digite um nome para a categoria.',
            });
            return;
        }

        try {
            await createCategory({ name: newName.trim(), color: newColor });
            toast({
                title: 'Categoria criada',
                description: `A categoria "${newName}" foi criada com sucesso.`,
            });
            setNewName('');
            setNewColor('text-blue-600');
            setShowNewForm(false);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Erro ao criar categoria',
                description: error.message || 'Tente novamente.',
            });
        }
    };

    const handleStartEdit = (category: TaskCategory) => {
        setEditingId(category.id);
        setEditName(category.name);
        setEditColor(category.color);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditName('');
        setEditColor('');
    };

    const handleUpdate = async (id: string) => {
        if (!editName.trim()) {
            toast({
                variant: 'destructive',
                title: 'Nome obrigatório',
                description: 'Digite um nome para a categoria.',
            });
            return;
        }

        try {
            await updateCategory({ id, data: { name: editName.trim(), color: editColor } });
            toast({
                title: 'Categoria atualizada',
                description: 'As alterações foram salvas.',
            });
            handleCancelEdit();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Erro ao atualizar',
                description: error.message || 'Tente novamente.',
            });
        }
    };

    const handleDelete = async (category: TaskCategory) => {
        if (category.is_default) {
            toast({
                variant: 'destructive',
                title: 'Categoria padrão',
                description: 'Não é possível excluir categorias padrão do sistema.',
            });
            return;
        }

        if (!confirm(`Deseja excluir a categoria "${category.name}"?`)) return;

        try {
            await deleteCategory(category.id);
            toast({
                title: 'Categoria excluída',
                description: `A categoria "${category.name}" foi removida.`,
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Erro ao excluir',
                description: error.message || 'Tente novamente.',
            });
        }
    };

    const getColorBg = (colorClass: string) => {
        return CATEGORY_COLORS.find(c => c.value === colorClass)?.bg || 'bg-gray-100';
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Tag className="h-5 w-5" />
                        Gerenciar Categorias
                    </DialogTitle>
                    <DialogDescription>
                        Crie, edite ou exclua categorias para organizar suas tarefas.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    {/* Lista de categorias */}
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : categories.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">
                                Nenhuma categoria encontrada.
                            </p>
                        ) : (
                            categories.map((category) => (
                                <div
                                    key={category.id}
                                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                >
                                    {editingId === category.id ? (
                                        // Modo edição
                                        <div className="flex-1 space-y-2">
                                            <Input
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                placeholder="Nome da categoria"
                                                className="h-8"
                                            />
                                            <div className="flex gap-1 flex-wrap">
                                                {CATEGORY_COLORS.map((color) => (
                                                    <button
                                                        key={color.value}
                                                        type="button"
                                                        onClick={() => setEditColor(color.value)}
                                                        className={cn(
                                                            'w-6 h-6 rounded-full border-2 transition-all',
                                                            color.bg,
                                                            editColor === color.value
                                                                ? 'border-primary scale-110'
                                                                : 'border-transparent hover:scale-105'
                                                        )}
                                                        title={color.label}
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleUpdate(category.id)}
                                                    disabled={isUpdating}
                                                >
                                                    {isUpdating ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Check className="h-4 w-4" />
                                                    )}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={handleCancelEdit}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        // Modo visualização
                                        <>
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={cn(
                                                        'w-3 h-3 rounded-full',
                                                        getColorBg(category.color)
                                                    )}
                                                />
                                                <span className={cn('font-medium', category.color)}>
                                                    {category.name}
                                                </span>
                                                {category.is_default && (
                                                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                                        Padrão
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8"
                                                    onClick={() => handleStartEdit(category)}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                {!category.is_default && (
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                                        onClick={() => handleDelete(category)}
                                                        disabled={isDeleting}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Formulário para nova categoria */}
                    {showNewForm ? (
                        <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                            <div className="space-y-2">
                                <Label>Nome da categoria</Label>
                                <Input
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Ex: Pessoal, Urgente..."
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Cor</Label>
                                <div className="flex gap-2 flex-wrap">
                                    {CATEGORY_COLORS.map((color) => (
                                        <button
                                            key={color.value}
                                            type="button"
                                            onClick={() => setNewColor(color.value)}
                                            className={cn(
                                                'w-8 h-8 rounded-full border-2 transition-all',
                                                color.bg,
                                                newColor === color.value
                                                    ? 'border-primary scale-110'
                                                    : 'border-transparent hover:scale-105'
                                            )}
                                            title={color.label}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Button onClick={handleCreate} disabled={isCreating} className="flex-1">
                                    {isCreating ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <Check className="h-4 w-4 mr-2" />
                                    )}
                                    Criar Categoria
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowNewForm(false);
                                        setNewName('');
                                        setNewColor('text-blue-600');
                                    }}
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setShowNewForm(true)}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Nova Categoria
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
