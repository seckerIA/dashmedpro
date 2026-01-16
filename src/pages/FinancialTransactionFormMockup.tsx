import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowUpRight,
  ArrowDownLeft,
  Upload,
  X,
  FileText,
  Image,
  File
} from "lucide-react"

import { useState } from "react"
import { DatePicker } from "@/components/ui/date-picker"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

const FinancialTransactionFormMockup = () => {
  const [date, setDate] = useState<Date | undefined>(new Date("2025-05-07"))
  const [nextDate, setNextDate] = useState<Date | undefined>()
  return (
    <div className="min-h-screen bg-background p-6 flex items-center justify-center">
      <Card className="w-full max-w-4xl bg-gradient-to-br from-card to-card/50 border-border">
        <CardHeader>
          <CardTitle className="text-2xl text-foreground">Nova Transação Financeira</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tipo de Transação */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Tipo de Transação</label>
            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-3 p-4 bg-emerald-500/10 border-2 border-emerald-500 rounded-xl hover:bg-emerald-500/20 transition-all">
                <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                <span className="font-semibold text-emerald-500">Entrada (Receita)</span>
              </button>
              <button className="flex items-center justify-center gap-3 p-4 bg-muted/20 border-2 border-border rounded-xl hover:bg-muted/40 transition-all">
                <ArrowDownLeft className="w-5 h-5 text-red-500" />
                <span className="font-semibold text-muted-foreground">Saída (Despesa)</span>
              </button>
            </div>
          </div>

          {/* Formulário em Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Descrição */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-foreground">Descrição</label>
              <input
                type="text"
                placeholder="Ex: Venda CRM - Cliente Nexus"
                className="w-full p-3 bg-muted/20 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                defaultValue="Venda CRM - Future Digital Co."
              />
            </div>

            {/* Valor */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Valor</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">R$</span>
                <input
                  type="text"
                  placeholder="0,00"
                  className="w-full p-3 pl-12 bg-muted/20 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  defaultValue="12.000,00"
                />
              </div>
            </div>

            {/* Data */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Data da Transação</label>
              <DatePicker
                date={date}
                setDate={setDate}
                className="w-full p-3 bg-muted/20 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 justify-start text-left font-normal"
              />
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Categoria</label>
              <select className="w-full p-3 bg-muted/20 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option>Vendas</option>
                <option>Serviços</option>
                <option>Investimentos</option>
                <option>Outros</option>
              </select>
            </div>

            {/* Conta */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Conta Bancária</label>
              <select className="w-full p-3 bg-muted/20 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option>Conta Corrente - Banco Inter</option>
                <option>Poupança - Nubank</option>
                <option>Caixa</option>
              </select>
            </div>

            {/* Método de Pagamento */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Método de Pagamento</label>
              <select className="w-full p-3 bg-muted/20 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option>PIX</option>
                <option>Transferência Bancária</option>
                <option>Cartão de Crédito</option>
                <option>Cartão de Débito</option>
                <option>Boleto</option>
                <option>Dinheiro</option>
              </select>
            </div>

            {/* Deal Vinculado */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Deal CRM (opcional)</label>
              <select className="w-full p-3 bg-muted/20 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="">Nenhum</option>
                <option selected>Future Digital Co. - R$ 12.000,00</option>
                <option>Nexus Engenharia - R$ 25.000,00</option>
                <option>Alpha Med - R$ 9.800,00</option>
              </select>
            </div>

            {/* Tags */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-foreground">Tags (opcional)</label>
              <div className="flex flex-wrap gap-2 p-3 bg-muted/20 border border-border rounded-lg min-h-[52px]">
                <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                  crm
                  <button className="ml-2"><X className="w-3 h-3" /></button>
                </Badge>
                <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                  marketing-digital
                  <button className="ml-2"><X className="w-3 h-3" /></button>
                </Badge>
                <input
                  type="text"
                  placeholder="Adicionar tag..."
                  className="flex-1 min-w-[120px] bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-foreground">Observações (opcional)</label>
              <textarea
                placeholder="Adicione observações sobre esta transação..."
                className="w-full p-3 bg-muted/20 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px] resize-none"
                defaultValue="Pagamento recebido via PIX. Cliente fechou contrato de gestão de tráfego por 12 meses."
              />
            </div>
          </div>

          {/* Upload de Comprovantes */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Comprovantes</label>

            {/* Área de Upload */}
            <div className="border-2 border-dashed border-border hover:border-emerald-500 rounded-xl p-8 transition-all cursor-pointer bg-muted/10 hover:bg-muted/20">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="p-4 bg-emerald-500/10 rounded-full mb-3">
                  <Upload className="w-8 h-8 text-emerald-500" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Arraste arquivos aqui ou clique para fazer upload
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, PNG, JPG até 10MB
                </p>
              </div>
            </div>

            {/* Arquivos já enviados (mockup) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-muted/20 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <FileText className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">comprovante_pagamento.pdf</p>
                    <p className="text-xs text-muted-foreground">245 KB</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <FileText className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/20 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Image className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">nota_fiscal.jpg</p>
                    <p className="text-xs text-muted-foreground">1.2 MB</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Image className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Recorrência */}
          <div className="p-4 bg-muted/20 border border-border rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Transação Recorrente?</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-50">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Frequência</label>
                <select className="w-full p-2 bg-muted/40 border border-border rounded-lg text-sm" disabled>
                  <option>Mensal</option>
                  <option>Semanal</option>
                  <option>Anual</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Próxima Execução</label>
                <DatePicker
                  date={nextDate}
                  setDate={setNextDate}
                  className="w-full p-2 bg-muted/40 border border-border rounded-lg text-sm justify-start text-left font-normal"
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button variant="outline" size="lg">
              Cancelar
            </Button>
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white" size="lg">
              Salvar Transação
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default FinancialTransactionFormMockup

