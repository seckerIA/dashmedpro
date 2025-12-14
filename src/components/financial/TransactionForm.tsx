import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  ArrowUpRight,
  ArrowDownLeft,
  Upload,
  X,
  FileText,
  Image,
  File,
  Loader2,
  Plus,
  Trash2,
  DollarSign,
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { useFinancialCategories } from '@/hooks/useFinancialCategories'
import { useFinancialAccounts } from '@/hooks/useFinancialAccounts'
import { useCreateFinancialTransaction, useUpdateFinancialTransaction } from '@/hooks/useFinancialTransactionMutations'
import { useFileUpload } from '@/hooks/useFileUpload'
import { useCreateMultipleCosts, useTransactionCosts, useDeleteTransactionCost } from '@/hooks/useTransactionCosts'
import { FinancialTransaction, TransactionCostFormData, CostType } from '@/types/financial'

interface TransactionFormData {
  type: 'entrada' | 'saida'
  description: string
  amount: string
  transaction_date: string
  category_id: string
  account_id: string
  payment_method: string
  deal_id?: string
  tags: string[]
  notes: string
  is_recurring: boolean
  recurring_frequency?: string
  next_execution_date?: string
  has_costs: boolean
  costs: TransactionCostFormData[]
}

const TransactionForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const existingTransaction = location.state?.transaction as FinancialTransaction | undefined
  
  const { data: categories = [] } = useFinancialCategories()
  const { accountsSummary = [] } = useFinancialAccounts()
  const createTransaction = useCreateFinancialTransaction()
  const updateTransaction = useUpdateFinancialTransaction()
  const createMultipleCosts = useCreateMultipleCosts()
  const { uploadFile, removeFile, isUploading, uploadedFiles } = useFileUpload()
  const { data: existingCosts } = useTransactionCosts(id)
  
  const isEditMode = !!id && !!existingTransaction

  const [formData, setFormData] = useState<TransactionFormData>({
    type: 'entrada',
    description: '',
    amount: '',
    transaction_date: new Date().toISOString().split('T')[0],
    category_id: '',
    account_id: '',
    payment_method: 'pix',
    deal_id: 'none',
    tags: [],
    notes: '',
    is_recurring: false,
    recurring_frequency: '',
    next_execution_date: '',
    has_costs: false,
    costs: [],
  })

  const [newTag, setNewTag] = useState('')
  const [dragActive, setDragActive] = useState(false)

  // Preencher formulário com dados do deal (via query params)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const dealId = searchParams.get('dealId');
    const title = searchParams.get('title');
    const value = searchParams.get('value');
    const contactId = searchParams.get('contactId');
    const contactName = searchParams.get('contactName');

    if (dealId && !isEditMode) {
      // Converter valor para centavos
      const valueInCents = value ? (parseFloat(value) * 100).toString() : '';
      
      setFormData(prev => ({
        ...prev,
        type: 'entrada', // Deal fechado é sempre uma entrada (receita)
        description: title || prev.description,
        amount: valueInCents,
        deal_id: dealId,
        notes: contactName ? `Cliente: ${contactName}` : prev.notes,
      }));
    }
  }, [location.search, isEditMode]);

  // Preencher formulário quando em modo de edição
  useEffect(() => {
    if (isEditMode && existingTransaction) {
      setFormData({
        type: existingTransaction.type as 'entrada' | 'saida',
        description: existingTransaction.description,
        amount: (existingTransaction.amount * 100).toString(), // Converter para centavos
        transaction_date: existingTransaction.transaction_date,
        category_id: existingTransaction.category_id || '',
        account_id: existingTransaction.account_id || '',
        payment_method: existingTransaction.payment_method || 'pix',
        deal_id: existingTransaction.deal_id || 'none',
        tags: existingTransaction.tags || [],
        notes: existingTransaction.notes || '',
        is_recurring: existingTransaction.is_recurring || false,
        has_costs: existingTransaction.has_costs || false,
        costs: [], // Será preenchido pelo próximo useEffect
      })
    }
  }, [isEditMode, existingTransaction])

  // Carregar custos existentes quando em modo de edição
  useEffect(() => {
    if (isEditMode && existingCosts && existingCosts.length > 0) {
      const loadedCosts: TransactionCostFormData[] = existingCosts.map(cost => ({
        id: cost.id,
        cost_type: cost.cost_type as CostType,
        amount: (cost.amount * 100).toString(), // Converter para centavos
        description: cost.description || '',
        attachment: null,
        attachment_id: cost.attachment_id,
      }))
      
      setFormData(prev => ({
        ...prev,
        has_costs: true,
        costs: loadedCosts,
      }))
    }
  }, [isEditMode, existingCosts])

  const handleInputChange = (field: keyof TransactionFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  // Funções para gerenciar custos
  const handleAddCost = () => {
    const newCost: TransactionCostFormData = {
      cost_type: 'ferramentas',
      amount: '',
      description: '',
      attachment: null,
    }
    setFormData(prev => ({
      ...prev,
      costs: [...prev.costs, newCost]
    }))
  }

  const handleRemoveCost = (index: number) => {
    setFormData(prev => ({
      ...prev,
      costs: prev.costs.filter((_, i) => i !== index)
    }))
  }

  const handleCostChange = (index: number, field: keyof TransactionCostFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      costs: prev.costs.map((cost, i) => 
        i === index ? { ...cost, [field]: value } : cost
      )
    }))
  }

  const handleCostFileUpload = async (index: number, file: File) => {
    handleCostChange(index, 'attachment', file)
  }

  const calculateTotalCosts = () => {
    if (!formData.costs || formData.costs.length === 0) return 0
    return formData.costs.reduce((total, cost) => {
      const amount = parseFloat(cost.amount) || 0
      return total + (amount / 100) // Converter de centavos para reais
    }, 0)
  }

  const calculateNetAmount = () => {
    const grossAmount = parseFloat(formData.amount) / 100 || 0
    const totalCosts = calculateTotalCosts()
    return grossAmount - totalCosts
  }

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return

    for (let i = 0; i < files.length; i++) {
      await uploadFile(files[i])
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  const formatCurrency = (value: string) => {
    // Remove tudo que não é dígito
    const numericValue = value.replace(/\D/g, '')
    
    // Converte para centavos
    const cents = parseInt(numericValue) || 0
    
    // Formata como moeda
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(cents / 100)
  }

  const handleAmountChange = (value: string) => {
    // Remove formatação anterior
    const numericValue = value.replace(/\D/g, '')
    
    // Formata como moeda
    const formatted = formatCurrency(numericValue)
    
    setFormData(prev => ({
      ...prev,
      amount: numericValue
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('handleSubmit chamado!', formData)

    // Validações básicas
    if (!formData.description.trim()) {
      alert('Descrição é obrigatória')
      return
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Valor deve ser maior que zero')
      return
    }

    if (!formData.category_id) {
      alert('Categoria é obrigatória')
      return
    }

    if (!formData.account_id) {
      alert('Conta bancária é obrigatória')
      return
    }

    if (!formData.payment_method) {
      alert('Método de pagamento é obrigatório')
      return
    }

    try {
      console.log(isEditMode ? 'Iniciando atualização da transação...' : 'Iniciando criação da transação...')
      const { data: { user } } = await supabase.auth.getUser()
      console.log('Usuário:', user)
      
      if (!user) {
        alert('Usuário não autenticado')
        return
      }

      const transactionData = {
        user_id: user.id,
        type: formData.type,
        description: formData.description.trim(),
        amount: parseFloat(formData.amount) / 100, // Converte de centavos para reais
        date: formData.transaction_date,
        transaction_date: formData.transaction_date,
        category_id: formData.category_id,
        account_id: formData.account_id,
        payment_method: formData.payment_method,
        deal_id: formData.deal_id === 'none' ? null : formData.deal_id,
        contact_id: null,
        tags: formData.tags,
        notes: formData.notes.trim(),
        status: 'concluida',
        is_recurring: formData.is_recurring,
        has_costs: false,
        total_costs: 0,
        metadata: {},
        recurrence_id: null,
      }

      console.log('Dados da transação:', transactionData)
      
      if (isEditMode && id) {
        console.log('Chamando updateTransaction.mutateAsync...')
        await updateTransaction.mutateAsync({ id, ...transactionData })
        console.log('Transação atualizada com sucesso!')
        
        // Atualizar custos no modo de edição
        // Primeiro, deletar todos os custos existentes
        if (existingCosts && existingCosts.length > 0) {
          console.log('Deletando custos antigos...')
          for (const cost of existingCosts) {
            await supabase.from('transaction_costs').delete().eq('id', cost.id)
          }
        }
        
        // Depois, criar os novos custos
        if (formData.has_costs && formData.costs.length > 0) {
          console.log('Criando novos custos associados...')
          
          const costsToCreate = formData.costs
            .filter(cost => parseFloat(cost.amount) > 0)
            .map(cost => ({
              transaction_id: id,
              cost_type: cost.cost_type,
              amount: parseFloat(cost.amount) / 100, // Converter de centavos para reais
              description: cost.description || null,
              attachment_id: null,
            }))
          
          if (costsToCreate.length > 0) {
            await createMultipleCosts.mutateAsync(costsToCreate)
            console.log('Custos criados com sucesso!')
          }
        }
        
        navigate('/financeiro/transacoes')
      } else {
        console.log('Chamando createTransaction.mutateAsync...')
        const createdTransaction = await createTransaction.mutateAsync(transactionData)
        console.log('Transação criada com sucesso!', createdTransaction)
        
        // Se tem custos, criar os custos associados
        if (formData.has_costs && formData.costs.length > 0 && createdTransaction) {
          console.log('Criando custos associados...')
          
          const costsToCreate = formData.costs
            .filter(cost => parseFloat(cost.amount) > 0)
            .map(cost => ({
              transaction_id: createdTransaction.id,
              cost_type: cost.cost_type,
              amount: parseFloat(cost.amount) / 100, // Converter de centavos para reais
              description: cost.description || null,
              attachment_id: null, // TODO: Implementar upload de comprovantes de custos
            }))
          
          if (costsToCreate.length > 0) {
            await createMultipleCosts.mutateAsync(costsToCreate)
            console.log('Custos criados com sucesso!')
          }
        }
        
        navigate('/financeiro/transacoes')
      }
    } catch (error) {
      console.error(isEditMode ? 'Error updating transaction:' : 'Error creating transaction:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6 flex items-center justify-center">
      <Card className="w-full max-w-4xl bg-gradient-to-br from-card to-card/50 border-border">
        <CardHeader>
          <CardTitle className="text-2xl text-foreground">
            {isEditMode ? 'Editar Transação' : 'Nova Transação Financeira'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tipo de Transação */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Tipo de Transação</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleInputChange('type', 'entrada')}
                  className={`flex items-center justify-center gap-3 p-4 border-2 rounded-xl transition-all ${
                    formData.type === 'entrada'
                      ? 'bg-emerald-500/10 border-emerald-500'
                      : 'bg-muted/20 border-border hover:bg-muted/40'
                  }`}
                >
                  <ArrowUpRight className={`w-5 h-5 ${formData.type === 'entrada' ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                  <span className={`font-semibold ${formData.type === 'entrada' ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                    Entrada (Receita)
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('type', 'saida')}
                  className={`flex items-center justify-center gap-3 p-4 border-2 rounded-xl transition-all ${
                    formData.type === 'saida'
                      ? 'bg-red-500/10 border-red-500'
                      : 'bg-muted/20 border-border hover:bg-muted/40'
                  }`}
                >
                  <ArrowDownLeft className={`w-5 h-5 ${formData.type === 'saida' ? 'text-red-500' : 'text-muted-foreground'}`} />
                  <span className={`font-semibold ${formData.type === 'saida' ? 'text-red-500' : 'text-muted-foreground'}`}>
                    Saída (Despesa)
                  </span>
                </button>
              </div>
            </div>

            {/* Formulário em Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Descrição */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description" className="text-sm font-medium text-foreground">Descrição *</Label>
                <Input
                  id="description"
                  type="text"
                  placeholder="Ex: Venda CRM - Cliente Nexus"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full"
                  required
                />
              </div>

              {/* Valor */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium text-foreground">Valor *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">R$</span>
                  <Input
                    id="amount"
                    type="text"
                    placeholder="0,00"
                    value={formData.amount ? formatCurrency(formData.amount) : ''}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="pl-12"
                    required
                  />
                </div>
              </div>

              {/* Data */}
              <div className="space-y-2">
                <Label htmlFor="transaction_date" className="text-sm font-medium text-foreground">Data da Transação *</Label>
                <Input
                  id="transaction_date"
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => handleInputChange('transaction_date', e.target.value)}
                  className="w-full"
                  required
                />
              </div>

              {/* Categoria */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium text-foreground">Categoria *</Label>
                <Select value={formData.category_id} onValueChange={(value) => handleInputChange('category_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.filter(category => category.id && category.name).map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    )) || []}
                  </SelectContent>
                </Select>
              </div>

              {/* Conta */}
              <div className="space-y-2">
                <Label htmlFor="account" className="text-sm font-medium text-foreground">Conta Bancária *</Label>
                <Select value={formData.account_id} onValueChange={(value) => handleInputChange('account_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {accountsSummary?.filter(account => account.id && account.name).map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    )) || []}
                  </SelectContent>
                </Select>
              </div>

              {/* Método de Pagamento */}
              <div className="space-y-2">
                <Label htmlFor="payment_method" className="text-sm font-medium text-foreground">Método de Pagamento *</Label>
                <Select value={formData.payment_method} onValueChange={(value) => handleInputChange('payment_method', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="transferencia">Transferência Bancária</SelectItem>
                    <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                    <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Deal Vinculado */}
              <div className="space-y-2">
                <Label htmlFor="deal" className="text-sm font-medium text-foreground">Deal CRM (opcional)</Label>
                <Select value={formData.deal_id || ''} onValueChange={(value) => handleInputChange('deal_id', value || '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {/* Aqui você pode adicionar deals do CRM quando implementar a integração */}
                  </SelectContent>
                </Select>
              </div>

              {/* Tags */}
              <div className="space-y-2 md:col-span-2">
                <Label className="text-sm font-medium text-foreground">Tags (opcional)</Label>
                <div className="flex flex-wrap gap-2 p-3 bg-muted/20 border border-border rounded-lg min-h-[52px]">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  <div className="flex gap-2 flex-1 min-w-[200px]">
                    <Input
                      type="text"
                      placeholder="Adicionar tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      className="flex-1 bg-transparent border-none outline-none"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddTag}
                      disabled={!newTag.trim()}
                    >
                      Adicionar
                    </Button>
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes" className="text-sm font-medium text-foreground">Observações (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Adicione observações sobre esta transação..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </div>
            </div>

            {/* Seção de Custos - Apenas para Entradas */}
            {formData.type === 'entrada' && (
              <>
                <Separator className="my-6" />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-lg font-semibold text-foreground">Custos desta Prestação de Serviço</Label>
                      <p className="text-sm text-muted-foreground">Adicione os custos associados a esta receita para calcular o lucro líquido</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="has_costs"
                        checked={formData.has_costs}
                        onCheckedChange={(checked) => {
                          handleInputChange('has_costs', checked)
                          if (!checked) {
                            handleInputChange('costs', [])
                          }
                        }}
                      />
                      <Label htmlFor="has_costs" className="text-sm font-medium cursor-pointer">
                        Este serviço tem custos
                      </Label>
                    </div>
                  </div>

                  {formData.has_costs && (
                    <div className="space-y-4 p-4 bg-muted/20 rounded-xl border border-border">
                      {(formData.costs || []).map((cost, index) => (
                        <div key={index} className="p-4 bg-background rounded-lg border border-border space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Custo #{index + 1}</Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveCost(index)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label className="text-xs">Tipo de Custo *</Label>
                              <Select 
                                value={cost.cost_type} 
                                onValueChange={(value) => handleCostChange(index, 'cost_type', value as CostType)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ferramentas">🛠️ Ferramentas</SelectItem>
                                  <SelectItem value="operacional">⚙️ Operacional</SelectItem>
                                  <SelectItem value="terceirizacao">👥 Terceirização</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs">Valor do Custo *</Label>
                              <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground">R$</span>
                                <Input
                                  type="text"
                                  placeholder="0,00"
                                  value={cost.amount ? (parseFloat(cost.amount) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '')
                                    handleCostChange(index, 'amount', value)
                                  }}
                                  className="pl-10"
                                />
                              </div>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                              <Label className="text-xs">Descrição (opcional)</Label>
                              <Input
                                type="text"
                                placeholder="Descreva este custo..."
                                value={cost.description}
                                onChange={(e) => handleCostChange(index, 'description', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddCost}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Custo
                      </Button>

                      {/* Resumo dos Custos */}
                      {formData.costs.length > 0 && (
                        <div className="p-4 bg-gradient-to-br from-blue-500/10 to-emerald-500/10 rounded-lg border border-blue-500/20 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Valor da Receita:</span>
                            <span className="font-medium">R$ {(parseFloat(formData.amount || '0') / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between text-sm text-red-500">
                            <span>Total de Custos:</span>
                            <span className="font-medium">- R$ {calculateTotalCosts().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between text-base font-semibold">
                            <span className="text-emerald-500">Lucro Líquido:</span>
                            <span className="text-emerald-500">R$ {calculateNetAmount().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="text-xs text-center text-muted-foreground">
                            Margem: {formData.amount && parseFloat(formData.amount) > 0 ? ((calculateNetAmount() / (parseFloat(formData.amount) / 100)) * 100).toFixed(1) : '0'}%
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Separator className="my-6" />
              </>
            )}

            {/* Upload de Comprovantes */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground">Comprovantes</Label>
              
              {/* Área de Upload */}
              <div
                className={`border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer ${
                  dragActive
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-border hover:border-emerald-500 bg-muted/10 hover:bg-muted/20'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="p-4 bg-emerald-500/10 rounded-full mb-3">
                    {isUploading ? (
                      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                    ) : (
                      <Upload className="w-8 h-8 text-emerald-500" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    {isUploading ? 'Enviando arquivos...' : 'Arraste arquivos aqui ou clique para fazer upload'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, PNG, JPG até 10MB
                  </p>
                </div>
              </div>

              {/* Arquivos enviados */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-muted/20 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/10 rounded-lg">
                          {file.type.startsWith('image/') ? (
                            <Image className="w-5 h-5 text-blue-500" />
                          ) : (
                            <FileText className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => window.open(file.url, '_blank')}
                          title="Ver no Supabase"
                        >
                          <File className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive"
                          onClick={() => removeFile(file.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recorrência */}
            <div className="p-4 bg-muted/20 border border-border rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-foreground">Transação Recorrente?</Label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.is_recurring}
                    onChange={(e) => handleInputChange('is_recurring', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
              {formData.is_recurring && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Frequência</Label>
                    <Select value={formData.recurring_frequency || ''} onValueChange={(value) => handleInputChange('recurring_frequency', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a frequência" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mensal">Mensal</SelectItem>
                        <SelectItem value="semanal">Semanal</SelectItem>
                        <SelectItem value="anual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Próxima Execução</Label>
                    <Input
                      type="date"
                      value={formData.next_execution_date || ''}
                      onChange={(e) => handleInputChange('next_execution_date', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Botões de Ação */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => navigate('/financeiro')}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
                size="lg"
                disabled={createTransaction.isPending}
              >
                {createTransaction.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Transação'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default TransactionForm
