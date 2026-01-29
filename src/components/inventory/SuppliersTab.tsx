
import React, { useState } from "react";
import { Plus, Search, Edit, Trash2, Building2 } from "lucide-react";
import { useSuppliers, Supplier, SupplierInsert } from "@/hooks/useSuppliers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatCNPJ, formatPhone } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

export function SuppliersTab() {
    const { suppliers, isLoading, createSupplier, updateSupplier, deleteSupplier } = useSuppliers();
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);
    const { user } = useAuth();

    const [formData, setFormData] = useState<SupplierInsert>({
        user_id: user?.id || "",
        name: "",
        cnpj: "",
        email: "",
        phone: "",
        contact_person: "",
        address: "",
    });

    const filteredSuppliers = suppliers?.filter((s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.cnpj?.includes(searchTerm) ||
        s.contact_person?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenModal = (supplier?: Supplier) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setFormData({
                user_id: supplier.user_id,
                name: supplier.name,
                cnpj: supplier.cnpj,
                email: supplier.email,
                phone: supplier.phone,
                contact_person: supplier.contact_person,
                address: supplier.address,
            });
        } else {
            setEditingSupplier(null);
            setFormData({
                user_id: user?.id || "",
                name: "",
                cnpj: "",
                email: "",
                phone: "",
                contact_person: "",
                address: "",
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        try {
            if (editingSupplier) {
                await updateSupplier.mutateAsync({ id: editingSupplier.id, ...formData });
            } else {
                await createSupplier.mutateAsync(formData);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Erro ao salvar fornecedor:", error);
        }
    };

    const handleDelete = async () => {
        if (supplierToDelete) {
            await deleteSupplier.mutateAsync(supplierToDelete);
            setSupplierToDelete(null);
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="relative w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar fornecedores..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <Button onClick={() => handleOpenModal()}>
                    <Plus className="mr-2 h-4 w-4" /> Novo Fornecedor
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fornecedor</TableHead>
                            <TableHead>CNPJ</TableHead>
                            <TableHead>Contato</TableHead>
                            <TableHead>Telefone/Email</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">
                                    Carregando...
                                </TableCell>
                            </TableRow>
                        ) : filteredSuppliers?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    Nenhum fornecedor encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredSuppliers?.map((supplier) => (
                                <TableRow key={supplier.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                        {supplier.name}
                                    </TableCell>
                                    <TableCell>{supplier.cnpj || "-"}</TableCell>
                                    <TableCell>{supplier.contact_person || "-"}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-sm">
                                            <span>{supplier.phone}</span>
                                            <span className="text-muted-foreground text-xs">{supplier.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal(supplier)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-100" onClick={() => setSupplierToDelete(supplier.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingSupplier ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Nome da Empresa</Label>
                                <Input
                                    value={formData.name || ""}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: Farmacêutica ABC"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>CNPJ</Label>
                                <Input
                                    value={formData.cnpj || ""}
                                    onChange={(e) => setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) })}
                                    placeholder="00.000.000/0000-00"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Responsável</Label>
                                <Input
                                    value={formData.contact_person || ""}
                                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                                    placeholder="Nome do contato"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Telefone</Label>
                                <Input
                                    value={formData.phone || ""}
                                    onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Email</Label>
                            <Input
                                value={formData.email || ""}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="contato@empresa.com"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Endereço</Label>
                            <Input
                                value={formData.address || ""}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="Rua, Número, Bairro - Cidade/UF"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave}>{editingSupplier ? "Salvar Alterações" : "Cadastrar"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!supplierToDelete} onOpenChange={(open) => !open && setSupplierToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Fornecedor</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita.
                            Se houver itens de estoque vinculados, a exclusão não será permitida.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
