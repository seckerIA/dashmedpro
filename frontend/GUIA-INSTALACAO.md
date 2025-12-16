# 🎨 GUIA DE INSTALAÇÃO - NOVO DESIGN DASHMED PRO

## 📦 O QUE VOCÊ RECEBEU

7 arquivos prontos para colar no Cursor:

1. **tailwind.config.ts** - Configuração completa do Tailwind
2. **index.css** - Variáveis CSS + Fonte Outfit
3. **design-tokens.ts** - Constantes do design system
4. **MetricCard.tsx** - Cards coloridos com gradientes
5. **SalesChart.tsx** - Gráficos modernos (área + barras)
6. **StatsPanel.tsx** - Painel lateral com métricas
7. **CustomerTable.tsx** - Tabela moderna de clientes

---

## 🚀 PASSO A PASSO (COPIE NO CURSOR)

### **PASSO 1: Atualizar tailwind.config.ts**

```bash
# No Cursor, abra: tailwind.config.ts
# Cole TODO o conteúdo do arquivo "tailwind.config.ts"
```

### **PASSO 2: Atualizar src/index.css**

```bash
# No Cursor, abra: src/index.css
# SUBSTITUA TODO o conteúdo pelo arquivo "index.css"
```

### **PASSO 3: Criar design-tokens.ts**

```bash
# No Cursor, crie: src/lib/design-tokens.ts
# Cole o conteúdo do arquivo "design-tokens.ts"
```

### **PASSO 4: Criar pasta de componentes**

```bash
# No Cursor, crie a pasta: src/components/dashboard/
```

### **PASSO 5: Copiar componentes**

```bash
# Copie cada arquivo .tsx para src/components/dashboard/:
# - MetricCard.tsx
# - SalesChart.tsx
# - StatsPanel.tsx
# - CustomerTable.tsx
```

---

## 🎯 USANDO OS COMPONENTES

### **Exemplo 1: MetricCard**

```typescript
import { MetricCard } from '@/components/dashboard/MetricCard';
import { DollarSign } from 'lucide-react';

<MetricCard
  title="Faturamento"
  value="R$ 123.456,00"
  variant="purple"
  icon={DollarSign}
  trend={{ value: 15, label: "vs. ano anterior" }}
  illustration="https://illustrations.popsy.co/amber/money.svg"
/>
```

### **Exemplo 2: SalesChart**

```typescript
import { SalesChart } from '@/components/dashboard/SalesChart';

const data = [
  { name: 'Jan', current: 120, previous: 100 },
  { name: 'Fev', current: 180, previous: 150 },
  // ...
];

<SalesChart data={data} title="Vendas ao Longo do Tempo" />
```

### **Exemplo 3: WeeklySalesChart**

```typescript
import { WeeklySalesChart } from '@/components/dashboard/SalesChart';

const weeklyData = [
  { name: 'Mon', value: 1200 },
  { name: 'Tue', value: 1800 },
  // ...
];

<WeeklySalesChart data={weeklyData} title="Vendas Semanais" />
```

### **Exemplo 4: StatsPanel**

```typescript
import { StatsPanel } from '@/components/dashboard/StatsPanel';

<StatsPanel
  totalIntake={1500}
  newCustomers={{ value: 7, change: 1 }}
  repeatCustomers={1.5}
  totalRevenue="130k"
  distributionData={[
    { name: 'Facebook', value: 35, color: '#3B82F6' },
    { name: 'Instagram', value: 30, color: '#A855F7' },
    { name: 'Website', value: 25, color: '#06B6D4' },
    { name: 'YouTube', value: 10, color: '#10B981' },
  ]}
/>
```

### **Exemplo 5: CustomerTable**

```typescript
import { CustomerTable } from '@/components/dashboard/CustomerTable';

const customers = [
  {
    id: 'R217308',
    customer: 'Pranjalpers',
    date: '13/01/2022',
    invoicedAmount: '$ 54.000',
    status: 'Shipped' as const,
  },
  // ...
];

<CustomerTable customers={customers} />
```

---

## 🎨 VARIANTES DE CORES DISPONÍVEIS

```typescript
// Para MetricCard e QuickActionCard
variant: 'purple' | 'cyan' | 'yellow' | 'green'

// Purple: #8B5CF6 (roxo vibrante)
// Cyan: #06B6D4 (ciano moderno)
// Yellow: #F59E0B (amarelo quente) 
// Green: #10B981 (verde sucesso)
```

---

## 📊 DASHBOARD COMPLETO (EXEMPLO)

Crie: `src/pages/DashboardNew.tsx`

```typescript
import { MetricCard, QuickActionCard } from '@/components/dashboard/MetricCard';
import { SalesChart, WeeklySalesChart } from '@/components/dashboard/SalesChart';
import { StatsPanel } from '@/components/dashboard/StatsPanel';
import { CustomerTable } from '@/components/dashboard/CustomerTable';
import { DollarSign, ShoppingCart, Users, TrendingUp } from 'lucide-react';

export default function DashboardNew() {
  // Mock data
  const salesData = [
    { name: 'Jan', current: 120 },
    { name: 'Fev', current: 180 },
    { name: 'Mar', current: 150 },
    { name: 'Abr', current: 200 },
    { name: 'Mai', current: 170 },
    { name: 'Jun', current: 220 },
    { name: 'Jul', current: 250 },
    { name: 'Ago', current: 210 },
    { name: 'Set', current: 240 },
    { name: 'Out', current: 260 },
    { name: 'Nov', current: 230 },
    { name: 'Dez', current: 280 },
  ];

  const weeklyData = [
    { name: 'Mon', value: 1200 },
    { name: 'Tue', value: 1800 },
    { name: 'Wed', value: 1500 },
    { name: 'Thu', value: 2100 },
    { name: 'Fri', value: 1900 },
    { name: 'Sat', value: 1400 },
  ];

  const customers = [
    { id: 'R217308', customer: 'Dr. Silva', date: '13/01/2024', invoicedAmount: 'R$ 5.400', status: 'Shipped' as const },
    { id: 'R28308', customer: 'Dra. Santos', date: '13/01/2024', invoicedAmount: 'R$ 8.605', status: 'Delivered' as const },
    { id: 'R28765', customer: 'Dr. Oliveira', date: '13/01/2024', invoicedAmount: 'R$ 4.000', status: 'Paid' as const },
  ];

  const distributionData = [
    { name: 'Facebook', value: 35, color: '#3B82F6' },
    { name: 'Instagram', value: 30, color: '#A855F7' },
    { name: 'Website', value: 25, color: '#06B6D4' },
    { name: 'YouTube', value: 10, color: '#10B981' },
  ];

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Olá, Uroos 👋
          </h1>
          <p className="text-muted-foreground">
            Bem-vindo ao seu dashboard
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
        <MetricCard
          title="Faturamento"
          value="R$ 123.456,00"
          variant="purple"
          icon={DollarSign}
          trend={{ value: 15, label: "vs. ano anterior" }}
          illustration="https://illustrations.popsy.co/amber/money.svg"
        />
        <MetricCard
          title="Margem Bruta"
          value="R$ 123.456,00"
          variant="cyan"
          icon={TrendingUp}
          trend={{ value: 15, label: "vs. ano anterior" }}
          illustration="https://illustrations.popsy.co/amber/analytics.svg"
        />
        <MetricCard
          title="Comissão"
          value="R$ 123.456,00"
          variant="yellow"
          icon={ShoppingCart}
          trend={{ value: -16, label: "vs. ano anterior" }}
          illustration="https://illustrations.popsy.co/amber/shopping-bags.svg"
        />
        <MetricCard
          title="Qtd de Clientes"
          value="12.300"
          variant="green"
          icon={Users}
          trend={{ value: 15, label: "vs. ano anterior" }}
          illustration="https://illustrations.popsy.co/amber/people.svg"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SalesChart data={salesData} title="Vendas" />
          <CustomerTable customers={customers} />
        </div>

        <div className="space-y-6">
          <StatsPanel
            totalIntake={1500}
            newCustomers={{ value: 7, change: 1 }}
            repeatCustomers={1.5}
            totalRevenue="130k"
            distributionData={distributionData}
          />
        </div>
      </div>

      {/* Weekly Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeeklySalesChart data={weeklyData} title="Vendas Semanais" />
        
        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Ações Rápidas</h3>
          <div className="grid grid-cols-2 gap-4">
            <QuickActionCard
              title="Novo Lead"
              description="Cadastrar novo contato"
              variant="purple"
              icon={Users}
            />
            <QuickActionCard
              title="Nova Venda"
              description="Registrar venda"
              variant="cyan"
              icon={ShoppingCart}
            />
            <QuickActionCard
              title="Relatório"
              description="Gerar relatório"
              variant="yellow"
              icon={TrendingUp}
            />
            <QuickActionCard
              title="Financeiro"
              description="Ver transações"
              variant="green"
              icon={DollarSign}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 🔄 ATUALIZAR PÁGINA ATUAL

Se quiser atualizar a página Dashboard existente:

```bash
# Abra: src/pages/Dashboard.tsx
# Substitua o conteúdo usando o exemplo acima como referência
```

---

## ✅ CHECKLIST FINAL

- [ ] Colei tailwind.config.ts
- [ ] Colei src/index.css
- [ ] Criei src/lib/design-tokens.ts
- [ ] Criei pasta src/components/dashboard/
- [ ] Copiei todos os componentes .tsx
- [ ] Testei importando MetricCard
- [ ] Rodei `npm run dev` para ver resultado

---

## 🎨 CUSTOMIZAÇÕES DISPONÍVEIS

### **Mudar cores dos cards:**

Em `tailwind.config.ts`, procure:

```typescript
"card-purple": {
  DEFAULT: "hsl(262, 83%, 58%)", // Mude aqui
  // ...
}
```

### **Mudar fonte:**

Em `src/index.css`, troque:

```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

/* Por outra fonte, ex: */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
```

E em `tailwind.config.ts`:

```typescript
fontFamily: {
  sans: ["Inter", "system-ui", "sans-serif"],
}
```

### **Mudar ilustrações:**

Em `src/lib/design-tokens.ts`, troque as URLs:

```typescript
export const illustrations = {
  shopping: 'SUA_URL_AQUI',
  money: 'SUA_URL_AQUI',
  // ...
};
```

**Fontes de ilustrações gratuitas:**
- https://illustrations.popsy.co
- https://undraw.co/illustrations
- https://storyset.com

---

## 🆘 TROUBLESHOOTING

### **Erro: Module not found '@/lib/design-tokens'**

Certifique-se de criar o arquivo em: `src/lib/design-tokens.ts`

### **Cores não aparecem**

1. Rode `npm install` novamente
2. Reinicie o servidor (`Ctrl+C` e `npm run dev`)
3. Limpe cache: `rm -rf node_modules/.vite`

### **Fonte não carrega**

Verifique se tem internet, a fonte vem do Google Fonts.

---

## 📞 PRÓXIMOS PASSOS

1. **Integrar com dados reais** (Supabase)
2. **Adicionar animações extras** (Framer Motion já instalado)
3. **Criar mais variações de cards**
4. **Implementar filtros nos gráficos**
5. **Adicionar modo light** (se necessário)

---

**DESIGN CRIADO POR:** Claude AI  
**BASEADO EM:** 4 referências visuais combinadas  
**STACK:** React + TypeScript + Tailwind + shadcn/ui  
**FONTE:** Outfit (Google Fonts)  
**PALETA:** Purple + Cyan + Yellow + Green

🎉 **BOA SORTE NO DESENVOLVIMENTO!**
