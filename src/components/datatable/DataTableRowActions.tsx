"use client"
import { useState } from "react"
import { Row } from "@tanstack/react-table"
import { MoreHorizontal, Edit, Trash2, ToggleLeft, ToggleRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Profile } from "./DataColumns"

interface DataTableRowActionsProps<TData> {
  row: Row<TData>,
  handleToggleActive: (userId: string, currentStatus: boolean) => void;
  handleDelete: (userId: string) => void;
  handleEdit: (profile: Profile) => void;
}

export function DataTableRowActions<TData>({
  row,
  handleToggleActive,
  handleDelete,
  handleEdit
}: DataTableRowActionsProps<TData>) {
    const profile = row.original as Profile
    const [showToggleAlert, setShowToggleAlert] = useState(false)
    const [showDeleteAlert, setShowDeleteAlert] = useState(false)

  return (
    <>
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
            >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuItem onSelect={() => handleEdit(profile)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setShowToggleAlert(true)}>
                {profile.is_active ? (
                    <ToggleLeft className="mr-2 h-4 w-4" />
                ) : (
                    <ToggleRight className="mr-2 h-4 w-4" />
                )}
            {profile.is_active ? 'Desativar' : 'Ativar'}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setShowDeleteAlert(true)} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
            </DropdownMenuItem>
        </DropdownMenuContent>
        </DropdownMenu>

        {/* Alert for Toggling Active State */}
        <AlertDialog open={showToggleAlert} onOpenChange={setShowToggleAlert}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação vai {profile.is_active ? 'desativar' : 'ativar'} o usuário{" "}
                        <strong>{profile.full_name || profile.email}</strong>.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => handleToggleActive(profile.id, profile.is_active)}
                    >
                        Confirmar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        {/* Alert for Deleting */}
        <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente o usuário e seus dados de nossos servidores.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => {
                          handleDelete(profile.id);
                          setShowDeleteAlert(false);
                        }}
                    >
                        Excluir
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  )
}
