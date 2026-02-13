import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  Edit, 
  Trash2, 
  Play, 
  Pause,
  Plus,
  Repeat
} from "lucide-react"
import { useRecurringTransactions, useDeleteRecurringTransaction, useExecuteRecurringTransaction } from "@/hooks/useRecurringTransactions"
import { formatCurrency } from "@/lib/currency"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { RecurringTransactionForm } from "./RecurringTransactionForm"

export const RecurringTransactionsManager = () => {
  const { data: recurringTransactions, isLoading } = useRecurringTransactions()
  const deleteRecurringTransaction = useDeleteRecurringTransaction()
  const executeRecurringTransaction = useExecuteRecurringTransaction()
  const [isFormOpen, setIsFormOpen] = useState(false)

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      'diaria': 'Diário',
      'semanal': 'Semanal',
      'quinzenal': 'Quinzenal',
      'mensal': 'Mensal',
      'bimestral': 'Bimestral',
      'trimestral': 'Trimestral',
      'semestral': 'Semestral',
      'anual': 'Anual',
      // Compatibilidade com valores antigos em inglês
      'daily': 'Diário',
      'weekly': 'Semanal',
      'monthly': 'Mensal',
      'quarterly': 'Trimestral',
      'yearly': 'Anual'
    }
    return labels[frequency] || frequency
  }

  const getFrequencyColor = (frequency: string) => {
    const colors: Record<string, string> = {
      'diaria': 'bg-red-100 text-red-800',
      'semanal': 'bg-orange-100 text-orange-800',
      'quinzenal': 'bg-yellow-100 text-yellow-800',
      'mensal': 'bg-blue-100 text-blue-800',
      'bimestral': 'bg-indigo-100 text-indigo-800',
      'trimestral': 'bg-purple-100 text-purple-800',
      'semestral': 'bg-pink-100 text-pink-800',
      'anual': 'bg-green-100 text-green-800',
      // Compatibilidade com valores antigos em inglês
      'daily': 'bg-red-100 text-red-800',
      'weekly': 'bg-orange-100 text-orange-800',
      'monthly': 'bg-blue-100 text-blue-800',
      'quarterly': 'bg-purple-100 text-purple-800',
      'yearly': 'bg-green-100 text-green-800'
    }
    return colors[frequency] || 'bg-gray-100 text-gray-800'
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover esta transação recorrente?')) {
      await deleteRecurringTransaction.mutateAsync(id)
    }
  }

  const handleExecute = async (id: string) => {
    if (confirm('Deseja executar esta transação recorrente agora?')) {
      await executeRecurringTransaction.mutateAsync(id)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Repeat className="w-5 h-5" />
            Transações Recorrentes
          </CardTitle>
          <CardDescription>
            Gerencie transações que se repetem automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="w-5 h-5" />
              Transações Recorrentes
            </CardTitle>
            <CardDescription>
              Gerencie transações que se repetem automaticamente
            </CardDescription>
          </div>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Recorrente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Transação Recorrente</DialogTitle>
                <DialogDescription>
                  Configure uma transação que se repetirá automaticamente
                </DialogDescription>
              </DialogHeader>
              <RecurringTransactionForm onSuccess={() => setIsFormOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {!recurringTransactions || (recurringTransactions as any[]).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Repeat className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma transação recorrente configurada</p>
            <p className="text-sm">Clique em "Nova Recorrente" para criar uma</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Frequência</TableHead>
                  <TableHead>Próxima Execução</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Execuções</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(recurringTransactions as any[]).map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {transaction.template_transaction?.description || 'Sem descrição'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {transaction.template_transaction?.category_name || 'Sem categoria'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {formatCurrency(transaction.template_transaction?.amount || 0)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getFrequencyColor(transaction.frequency)}>
                        {getFrequencyLabel(transaction.frequency)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(transaction.next_occurrence), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={transaction.is_active ? "default" : "secondary"}>
                        {transaction.is_active ? "Ativa" : "Pausada"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {0}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {transaction.is_active && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleExecute(transaction.id)}
                            disabled={executeRecurringTransaction.isPending}
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {/* TODO: Implementar edição */}}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(transaction.id)}
                          disabled={deleteRecurringTransaction.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
