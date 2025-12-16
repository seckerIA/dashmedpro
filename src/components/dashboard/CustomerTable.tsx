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
    <div className={`bg-card rounded-2xl p-3 sm:p-4 lg:p-6 border border-border ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6 flex-wrap gap-2">
        <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-foreground">
          {title || 'Detalhes dos Clientes'}
        </h3>
        <div className="flex gap-1 sm:gap-2">
          <Button variant="outline" size="sm" className="text-xs sm:text-sm">
            Filtrar
          </Button>
          <Button variant="default" size="sm" className="bg-gradient-yellow text-xs sm:text-sm">
            Download
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm font-semibold text-muted-foreground">
                ID
              </th>
              <th className="text-left py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm font-semibold text-muted-foreground">
                Cliente
              </th>
              <th className="text-left py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm font-semibold text-muted-foreground">
                Data
              </th>
              <th className="text-left py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm font-semibold text-muted-foreground">
                Valor Faturado
              </th>
              <th className="text-left py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm font-semibold text-muted-foreground">
                Status
              </th>
              <th className="text-left py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm font-semibold text-muted-foreground">
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
                  <td className="py-2 px-2 sm:py-3 sm:px-4">
                    <span className="text-xs sm:text-sm font-medium text-foreground">
                      {customer.id}
                    </span>
                  </td>
                  <td className="py-2 px-2 sm:py-3 sm:px-4">
                    <span className="text-xs sm:text-sm text-foreground font-medium">
                      {customer.customer}
                    </span>
                  </td>
                  <td className="py-2 px-2 sm:py-3 sm:px-4">
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {customer.date}
                    </span>
                  </td>
                  <td className="py-2 px-2 sm:py-3 sm:px-4">
                    <span className="text-xs sm:text-sm font-semibold text-foreground">
                      {customer.invoicedAmount}
                    </span>
                  </td>
                  <td className="py-2 px-2 sm:py-3 sm:px-4">
                    <span
                      className={`inline-flex items-center px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
                    >
                      {customer.status}
                    </span>
                  </td>
                  <td className="py-2 px-2 sm:py-3 sm:px-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 sm:h-8 sm:w-8 p-0"
                        >
                          <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="text-xs sm:text-sm">
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
    <div className={`space-y-2 sm:space-y-3 ${className}`}>
      {customers.map((customer, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-2 sm:p-3 bg-muted/20 rounded-xl hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-purple flex items-center justify-center text-white text-xs sm:text-sm font-semibold">
              {customer.name.charAt(0)}
            </div>
            <span className="text-xs sm:text-sm font-medium text-foreground">
              {customer.name}
            </span>
          </div>
          <span
            className={`text-xs sm:text-sm font-semibold ${
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
