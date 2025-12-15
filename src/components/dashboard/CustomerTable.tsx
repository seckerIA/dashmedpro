import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Customer {
  id: string;
  customer: string;
  date: string;
  invoicedAmount: string;
  status: 'Shipped' | 'Delivered' | 'Paid' | 'Pending';
}

interface CustomerTableProps {
  customers: Customer[];
  title?: string;
  className?: string;
}

const statusConfig = {
  Shipped: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-500',
    border: 'border-cyan-500/20',
  },
  Delivered: {
    bg: 'bg-green-500/10',
    text: 'text-green-500',
    border: 'border-green-500/20',
  },
  Paid: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-500',
    border: 'border-purple-500/20',
  },
  Pending: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-500',
    border: 'border-yellow-500/20',
  },
};

export function CustomerTable({ customers, title, className }: CustomerTableProps) {
  return (
    <div className={`bg-card rounded-2xl p-6 border border-border ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">
          {title || 'Detalhes dos Clientes'}
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Filtrar
          </Button>
          <Button variant="default" size="sm" className="bg-gradient-yellow">
            Download
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                ID
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                Cliente
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                Data
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                Valor Faturado
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                Status
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer, index) => {
              const config = statusConfig[customer.status];
              return (
                <tr
                  key={customer.id}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="py-4 px-4">
                    <span className="text-sm font-medium text-foreground">
                      {customer.id}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-foreground font-medium">
                      {customer.customer}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-muted-foreground">
                      {customer.date}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm font-semibold text-foreground">
                      {customer.invoicedAmount}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
                    >
                      {customer.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Mini version for smaller spaces
interface MiniCustomerListProps {
  customers: Array<{
    name: string;
    amount: string;
    status: 'positive' | 'negative';
  }>;
  className?: string;
}

export function MiniCustomerList({ customers, className }: MiniCustomerListProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {customers.map((customer, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-3 bg-muted/20 rounded-xl hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-purple flex items-center justify-center text-white font-semibold">
              {customer.name.charAt(0)}
            </div>
            <span className="text-sm font-medium text-foreground">
              {customer.name}
            </span>
          </div>
          <span
            className={`text-sm font-semibold ${
              customer.status === 'positive' ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {customer.status === 'positive' ? '+' : '-'}
            {customer.amount}
          </span>
        </div>
      ))}
    </div>
  );
}
