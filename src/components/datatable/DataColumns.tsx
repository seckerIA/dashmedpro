"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"
import { DataTableRowActions } from "./DataTableRowActions"

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean | null;
  created_at: string | null;
  avatar_url?: string | null;
  invited_by?: string | null;
  updated_at?: string | null;
}

const getRoleLabel = (role: string) => {
  const labels = {
    admin: 'Administrador',
    dono: 'Dono',
    vendedor: 'Vendedor',
    gestor_trafego: 'Gestor de Tráfego'
  };
  return labels[role as keyof typeof labels] || role;
};

const getRoleColor = (role: string) => {
  const colors = {
    admin: 'destructive',
    dono: 'default',
    vendedor: 'secondary',
    gestor_trafego: 'outline'
  };
  return colors[role as keyof typeof colors] || 'secondary';
};

export const getColumns = (
  handleToggleActive: (userId: string, currentStatus: boolean) => void,
  handleDelete: (userId: string) => void,
  handleEdit: (profile: Profile) => void
): ColumnDef<Profile>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ? true :
          table.getIsSomePageRowsSelected() ? "indeterminate" : false
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "full_name",
    header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Nome
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    cell: ({ row }) => <div>{row.getValue("full_name") || "Não informado"}</div>,
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div>{row.getValue("email")}</div>,
  },
  {
    accessorKey: "role",
    header: "Função",
    cell: ({ row }) => {
        const role = row.getValue("role") as string
        return <Badge variant={getRoleColor(role) as any}>{getRoleLabel(role)}</Badge>
    }
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => {
        const isActive = row.getValue("is_active")
        return <Badge variant={isActive ? "default" : "secondary"}>{isActive ? "Ativo" : "Inativo"}</Badge>
    }
  },
  {
    accessorKey: "created_at",
    header: "Data de Criação",
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"))
      return <div>{date.toLocaleDateString('pt-BR')}</div>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} handleToggleActive={handleToggleActive} handleDelete={handleDelete} handleEdit={handleEdit} />,
  },
]
