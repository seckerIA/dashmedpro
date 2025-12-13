import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Repeat, AlertTriangle, Plus } from "lucide-react"
import { useRecurringTransactions, useCreateRecurringTransaction } from "@/hooks/useRecurringTransactions"
import { useFinancialTransactions } from "@/hooks/useFinancialTransactions"
import { format, addMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useAuth } from "@/hooks/useAuth"

export const RecurringTransactionsWidget = () => {
  const { user } = useAuth()
  const { data: recurringTransactions, isLoading } = useRecurringTransactions()
  const { transactions: financialTransactions } = useFinancialTransactions()
  const createRecurring = useCreateRecurringTransaction()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Repeat className="w-5 h-5" />
            Transações Recorrentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const activeTransactions = recurringTransactions?.filter(t => t.is_active) || []
  const fallbackRecurring = (financialTransactions || []).filter(t => t.is_recurring).slice(0, 3)
  const today = new Date()
  const pendingToday = activeTransactions.filter(t => 
    new Date(t.next_execution_date) <= today
  ).length

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      'daily': 'Diário',
      'weekly': 'Semanal',
      'monthly': 'Mensal',
      'quarterly': 'Trimestral',
      'yearly': 'Anual'
    }
    return labels[frequency] || frequency
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Repeat className="w-5 h-5" />
          Transações Recorrentes
        </CardTitle>
        <CardDescription>
          {activeTransactions.length} transações ativas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingToday > 0 && (
          <div className="flex items-center gap-2 p-3 bg-muted/60 border border-border rounded-lg">
            <AlertTriangle className="w-5 h-5 text-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {pendingToday} transação(ões) pendente(s) para hoje
              </p>
              <p className="text-xs text-muted-foreground">
                Execute manualmente ou aguarde o processamento automático
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {activeTransactions.slice(0, 3).map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {transaction.template_transaction?.description || 'Sem descrição'}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {getFrequencyLabel(transaction.frequency)}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(transaction.next_execution_date), 'dd/MM', { locale: ptBR })}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {transaction.execution_count || 0} execuções
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {activeTransactions.length > 3 && (
          <div className="text-center">
            <Button variant="outline" size="sm" className="w-full">
              Ver todas ({activeTransactions.length})
            </Button>
          </div>
        )}

        {activeTransactions.length === 0 && fallbackRecurring.length > 0 && (
          <div className="space-y-3">
            {fallbackRecurring.map((t) => {
              const handleCreateSchedule = async () => {
                if (!user?.id) return
                
                const startDate = new Date(t.transaction_date)
                const nextDate = addMonths(startDate, 1)
                
                await createRecurring.mutateAsync({
                  user_id: user.id,
                  template_transaction_id: t.id,
                  frequency: 'mensal',
                  start_date: format(startDate, 'yyyy-MM-dd'),
                  next_execution_date: format(nextDate, 'yyyy-MM-dd'),
                  is_active: true,
                  execution_count: 0,
                  auto_create: true,
                  end_date: null,
                  last_execution_date: null
                })
              }

              return (
                <div key={t.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50 border-border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{t.description}</span>
                      <Badge variant="outline" className="text-xs">
                        Sem agendamento
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {t.transaction_date ? format(new Date(t.transaction_date), 'dd/MM', { locale: ptBR }) : '--/--'}
                      </div>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-xs"
                    onClick={handleCreateSchedule}
                    disabled={createRecurring.isPending}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Agendar
                  </Button>
                </div>
              )
            })}
          </div>
        )}

        {activeTransactions.length === 0 && fallbackRecurring.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <Repeat className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma transação recorrente ativa</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
