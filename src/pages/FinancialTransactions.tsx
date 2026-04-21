import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  DollarSign,
  Filter,
  Download
} from "lucide-react"
import { useFinancialTransactions } from "@/hooks/useFinancialTransactions"
import { useDeleteFinancialTransaction } from "@/hooks/useFinancialTransactionMutations"
import { useUserProfile } from "@/hooks/useUserProfile"
import { useFinancialMetrics } from "@/hooks/useFinancialMetrics"
import { formatDisplayDate, parseLocalDate } from "@/utils/dateUtils"
import { FinancialTransactionWithDetails } from "@/types/financial"
import { formatCurrency } from "@/lib/currency"
import { format } from "date-fns"

interface FinancialTransactionsProps {
  embedded?: boolean;
}

const FinancialTransactions = ({ embedded = false }: FinancialTransactionsProps) => {
  const navigate = useNavigate()
  const { transactions, isLoading } = useFinancialTransactions()
  const deleteTransaction = useDeleteFinancialTransaction()
  const { isAdmin } = useUserProfile()
  const { metrics } = useFinancialMetrics()
  const totalMarketingSpend = metrics?.totalMarketingSpend || 0

  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "entrada" | "saida">("all")
  const [selectedTransaction, setSelectedTransaction] = useState<FinancialTransactionWithDetails | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc")

  // Filtrar e ordenar transações
  const filteredAndSortedTransactions = useMemo(() => {
    let result = transactions?.filter(transaction => {
      const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.category?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.account?.name?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesType = filterType === "all" || transaction.type === filterType

      return matchesType && matchesSearch
    }) || []

    // Adicionar transação virtual de Marketing se houver gasto e não estiver filtrado como receita
    if (totalMarketingSpend > 0 && (filterType === "all" || filterType === "saida") && (!searchTerm || "marketing".includes(searchTerm.toLowerCase()))) {
      const virtualMarketing: any = {
        id: 'virtual-marketing',
        description: 'Marketing (Meta/Google Ads)',
        amount: totalMarketingSpend,
        type: 'saida',
        status: 'concluida',
        transaction_date: format(new Date(), 'yyyy-MM-dd'),
        category: { name: 'Marketing', color: '#8b5cf6' },
        account: { name: 'Automático' },
        isVirtual: true
      };
      result = [virtualMarketing, ...result];
    }

    // Aplicar ordenação
    return [...result].sort((a, b) => {
      // Se for virtual, mantém no topo se order for desc
      if (a.isVirtual) return sortOrder === "desc" ? -1 : 1;
      if (b.isVirtual) return sortOrder === "desc" ? 1 : -1;

      const dateA = parseLocalDate(a.transaction_date).getTime()
      const dateB = parseLocalDate(b.transaction_date).getTime()

      if (dateA !== dateB) {
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB
      }

      const createdA = new Date(a.created_at || 0).getTime()
      const createdB = new Date(b.created_at || 0).getTime()
      return sortOrder === "desc" ? createdB - createdA : createdA - createdB
    })
  }, [transactions, searchTerm, filterType, sortOrder, totalMarketingSpend])

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      await deleteTransaction.mutateAsync(id)
    }
  }

  const handleEdit = (transaction: FinancialTransactionWithDetails) => {
    console.log('Editar transação:', transaction)
    // Navegar para o formulário de edição com os dados da transação
    navigate(`/financeiro/editar-transacao/${transaction.id}`, { state: { transaction } })
  }

  const handleViewDetails = (transaction: FinancialTransactionWithDetails) => {
    setSelectedTransaction(transaction)
    setIsDetailsOpen(true)
  }

  if (isLoading) {
    return (
      <div className={embedded ? "py-8" : "min-h-screen bg-background p-6"}>
        <div className={embedded ? "" : "max-w-7xl mx-auto space-y-6"}>
          {!embedded && (
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Transações Financeiras</h1>
                <p className="text-muted-foreground">Gerencie todas as transações financeiras</p>
              </div>
            </div>
          )}
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={embedded ? "space-y-6" : "min-h-screen bg-background p-6"}>
      <div className={embedded ? "space-y-6" : "max-w-7xl mx-auto space-y-6"}>
        {/* Header - Apenas mostrar se NÃO for embedded */}
        {!embedded && (
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Transações Financeiras</h1>
              <p className="text-muted-foreground">Gerencie todas as transações financeiras</p>
            </div>
            <Button onClick={() => navigate('/financeiro/nova-transacao')}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Transação
            </Button>
          </div>
        )}
        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por descrição, categoria ou conta..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                <Button
                  variant={filterType === "all" ? "default" : "outline"}
                  onClick={() => setFilterType("all")}
                  size="sm"
                  className="whitespace-nowrap"
                >
                  Todas
                </Button>
                <Button
                  variant={filterType === "entrada" ? "default" : "outline"}
                  onClick={() => setFilterType("entrada")}
                  size="sm"
                  className="whitespace-nowrap"
                >
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                  Receitas
                </Button>
                <Button
                  variant={filterType === "saida" ? "default" : "outline"}
                  onClick={() => setFilterType("saida")}
                  size="sm"
                  className="whitespace-nowrap"
                >
                  <ArrowDownLeft className="w-4 h-4 mr-1" />
                  Despesas
                </Button>

                <div className="h-8 w-[1px] bg-border mx-1 hidden sm:block" />

                <Button
                  variant="outline"
                  onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                  size="sm"
                  className="whitespace-nowrap gap-2"
                >
                  <Filter className="w-4 h-4" />
                  {sortOrder === "desc" ? "Mais Recentes" : "Mais Antigas"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Transações */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Transações ({filteredAndSortedTransactions.length})</CardTitle>
                <CardDescription>
                  {filterType === "all" ? "Todas as transações" :
                    filterType === "entrada" ? "Apenas receitas" : "Apenas despesas"}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {filteredAndSortedTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma transação encontrada</p>
                <p className="text-sm">Crie sua primeira transação para começar</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Conta</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-center">Custos</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {formatDisplayDate(transaction.transaction_date)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{transaction.description}</div>
                            {transaction.notes && (
                              <div className="text-sm text-muted-foreground truncate max-w-xs">
                                {transaction.notes}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {transaction.category?.name || 'Sem categoria'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {transaction.account?.name || 'Sem conta'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {transaction.type === 'entrada' ? (
                              <>
                                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                                <span className="text-sm text-emerald-500">Receita</span>
                              </>
                            ) : (
                              <>
                                <ArrowDownLeft className="w-4 h-4 text-red-500" />
                                <span className="text-sm text-red-500">Despesa</span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className={`font-semibold ${transaction.type === 'entrada' ? 'text-emerald-500' : 'text-red-500'
                            }`}>
                            {transaction.type === 'entrada' ? '+' : '-'} {formatCurrency(transaction.amount)}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {transaction.type === 'entrada' && transaction.has_costs ? (
                            <Badge variant="outline" className="text-xs text-orange-500 border-orange-500/20">
                              R$ {formatCurrency(transaction.total_costs || 0)}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={transaction.status === 'concluida' ? "default" : "secondary"}>
                            {transaction.status || 'concluída'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewDetails(transaction)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(transaction)}
                              disabled={(transaction as any).isVirtual}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(transaction.id)}
                              disabled={deleteTransaction.isPending || (transaction as any).isVirtual}
                              className="text-muted-foreground hover:text-destructive"
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

        {/* Modal de Detalhes */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes da Transação</DialogTitle>
              <DialogDescription>
                Informações completas da transação selecionada
              </DialogDescription>
            </DialogHeader>
            {selectedTransaction && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                    <p className="text-sm">{selectedTransaction.description}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Valor</label>
                    <p className={`text-sm font-semibold ${selectedTransaction.type === 'entrada' ? 'text-emerald-500' : 'text-red-500'
                      }`}>
                      {formatCurrency(selectedTransaction.amount)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Data</label>
                    <p className="text-sm">
                      {formatDisplayDate(selectedTransaction.transaction_date)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                    <p className="text-sm">
                      {selectedTransaction.type === 'entrada' ? 'Receita' : 'Despesa'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Categoria</label>
                    <p className="text-sm">{selectedTransaction.category?.name || 'Sem categoria'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Conta</label>
                    <p className="text-sm">{selectedTransaction.account?.name || 'Sem conta'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Método de Pagamento</label>
                    <p className="text-sm">{selectedTransaction.payment_method || 'Não informado'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <p className="text-sm">{selectedTransaction.status || 'concluída'}</p>
                  </div>
                  {selectedTransaction.type === 'entrada' && selectedTransaction.has_costs && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Custos Totais</label>
                        <p className="text-sm font-semibold text-orange-500">
                          R$ {formatCurrency(selectedTransaction.total_costs || 0)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Lucro Líquido</label>
                        <p className="text-sm font-semibold text-blue-500">
                          R$ {formatCurrency((selectedTransaction.amount || 0) - (selectedTransaction.total_costs || 0))}
                        </p>
                      </div>
                    </>
                  )}
                </div>
                {selectedTransaction.notes && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Observações</label>
                    <p className="text-sm">{selectedTransaction.notes}</p>
                  </div>
                )}
                {selectedTransaction.tags && selectedTransaction.tags.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tags</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedTransaction.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default FinancialTransactions
