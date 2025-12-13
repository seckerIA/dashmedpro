import { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, DollarSign, Loader2, Plus, X } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useFinancialCategories } from "@/hooks/useFinancialCategories"
import { useFinancialAccounts } from "@/hooks/useFinancialAccounts"
import { useCreateRecurringTransaction } from "@/hooks/useRecurringTransactions"
import { useCreateFinancialTransaction } from "@/hooks/useFinancialTransactionMutations"
import { supabase } from "@/integrations/supabase/client"

interface RecurringTransactionFormProps {
  onSuccess?: () => void
}

interface FormData {
  description: string
  amount: string
  type: 'income' | 'expense'
  category_id: string
  account_id: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  start_date: Date
  end_date?: Date
  auto_create: boolean
  notes?: string
}

export const RecurringTransactionForm = ({ onSuccess }: RecurringTransactionFormProps) => {
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [isStartDateOpen, setIsStartDateOpen] = useState(false)
  const [isEndDateOpen, setIsEndDateOpen] = useState(false)

  const { data: categories } = useFinancialCategories()
  const { accounts } = useFinancialAccounts()
  const createRecurringTransaction = useCreateRecurringTransaction()
  const createTransaction = useCreateFinancialTransaction()

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>()

  const type = watch('type', 'expense')
  const autoCreate = watch('auto_create', true)

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, '')
    const formattedValue = (parseInt(numericValue) / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
    return formattedValue
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    const formattedValue = formatCurrency(value)
    setValue('amount', value)
    e.target.value = formattedValue
  }

  const calculateNextExecutionDate = (startDate: Date, frequency: string): Date => {
    const nextDate = new Date(startDate)
    
    switch (frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1)
        break
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7)
        break
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1)
        break
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3)
        break
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1)
        break
    }
    
    return nextDate
  }

  const onSubmit = async (data: FormData) => {
    try {
      if (!startDate) {
        throw new Error('Data de início é obrigatória')
      }

      // Primeiro, criar a transação template
      const templateTransaction = await createTransaction.mutateAsync({
        user_id: (await supabase.auth.getUser()).data.user?.id!,
        description: data.description,
        amount: parseFloat(data.amount) / 100,
        type: data.type,
        category_id: data.category_id,
        account_id: data.account_id,
        transaction_date: startDate.toISOString().split('T')[0],
        notes: data.notes,
        tags: tags,
        contact_id: null,
        deal_id: null,
        has_costs: false,
        metadata: {},
        recurrence_id: null,
        total_costs: 0,
        payment_method: 'pix',
        status: 'concluida',
        is_recurring: true
      })

      // Depois, criar a transação recorrente
      const nextExecutionDate = calculateNextExecutionDate(startDate, data.frequency)
      
      await createRecurringTransaction.mutateAsync({
        user_id: (await supabase.auth.getUser()).data.user?.id!,
        template_transaction_id: templateTransaction.id,
        frequency: data.frequency,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate?.toISOString().split('T')[0] || null,
        next_execution_date: nextExecutionDate.toISOString().split('T')[0],
        last_execution_date: null,
        auto_create: autoCreate,
        is_active: true,
        execution_count: 0
      })

      onSuccess?.()
    } catch (error) {
      console.error('Erro ao criar transação recorrente:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>Configure os dados da transação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                {...register('description', { required: 'Descrição é obrigatória' })}
                placeholder="Ex: Salário, Aluguel, Internet..."
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="amount">Valor *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  className="pl-10"
                  placeholder="0,00"
                  onChange={handleAmountChange}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="type">Tipo *</Label>
              <Select onValueChange={(value) => setValue('type', value as 'income' | 'expense')}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="expense">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Categoria *</Label>
              <Select onValueChange={(value) => setValue('category_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="account">Conta *</Label>
              <Select onValueChange={(value) => setValue('account_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Recorrência */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Recorrência</CardTitle>
            <CardDescription>Defina como a transação se repetirá</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="frequency">Frequência *</Label>
              <Select onValueChange={(value) => setValue('frequency', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a frequência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="quarterly">Trimestral</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Data de Início *</Label>
              <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date)
                      setIsStartDateOpen(false)
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Data de Fim (opcional)</Label>
              <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date)
                      setIsEndDateOpen(false)
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="auto_create"
                checked={autoCreate}
                onChange={(e) => setValue('auto_create', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="auto_create">Criar transações automaticamente</Label>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tags e Observações */}
      <Card>
        <CardHeader>
          <CardTitle>Tags e Observações</CardTitle>
          <CardDescription>Adicione tags e observações opcionais</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                id="tags"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Digite uma tag"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
        <Button type="submit" disabled={createRecurringTransaction.isPending}>
          {createRecurringTransaction.isPending && (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          )}
          Criar Transação Recorrente
        </Button>
      </div>
    </form>
  )
}
