# 🎨 Guia Visual - Módulo Financeiro

## 📱 Como Visualizar os Mockups

### Acesso Rápido:
1. **Dashboard Principal**: http://localhost:8080/financeiro
2. **Formulário de Transação**: http://localhost:8080/financeiro/nova-transacao

---

## 🖼️ Mockup 1: Dashboard Principal do Financeiro

### **Visão Geral**
O dashboard principal é o coração do módulo financeiro, apresentando uma visão completa e em tempo real da saúde financeira da empresa.

### **Componentes e Seções**

#### 1️⃣ **Header Superior**
- **Logo e Título**: Ícone de carteira (Wallet) com gradiente verde-esmeralda
- **Título**: "Financeiro" em fonte bold 3xl
- **Subtítulo**: "Gestão completa de receitas e despesas"
- **Ações Rápidas**:
  - Botão "Filtros" (outline)
  - Botão "Exportar" (outline) 
  - Botão "Nova Transação" (verde-esmeralda, destaque)

#### 2️⃣ **Cards de Métricas Principais** (Grid 4 colunas)

**Card 1: Saldo Total** ⭐ DESTAQUE
- Fundo: Gradiente verde-esmeralda (from-emerald-500 to-emerald-600)
- Texto branco
- Valor grande e bold: R$ 285.420,50
- Ícone: Wallet
- Legenda: "Todas as contas"

**Card 2: Receitas do Mês** 💚
- Fundo: Card padrão com gradiente sutil
- Cor do valor: Verde-esmeralda (#10b981)
- Ícone: Seta diagonal para cima direita
- Comparativo: "+12.5% vs mês anterior" com ícone TrendingUp

**Card 3: Despesas do Mês** ❤️
- Fundo: Card padrão
- Cor do valor: Vermelho (#ef4444)
- Ícone: Seta diagonal para baixo esquerda
- Comparativo: "+8.2% vs mês anterior"

**Card 4: Lucro do Mês** 💙
- Fundo: Card padrão
- Cor do valor: Azul (#3b82f6)
- Ícone: DollarSign
- Margem de lucro: "+116.5%"

#### 3️⃣ **Contas Bancárias** (Grid 3 colunas)

Cada conta exibe:
- Nome da conta (ex: "Conta Corrente")
- Banco (ex: "Banco Inter")
- Saldo atual em destaque
- Ícone específico por tipo:
  - 🏦 Building2 → Conta Corrente
  - 📊 PieChart → Poupança
  - 💰 Wallet → Caixa
- Botão "..." para ações
- Fundo: Gradiente azul suave (from-blue-500/10)

#### 4️⃣ **Gráfico: Receitas vs Despesas** 📈
- **Tipo**: Area Chart (gráfico de área)
- **Período**: Últimos 5 meses
- **Cores**:
  - Receitas: Verde (#10b981) com gradiente translúcido
  - Despesas: Vermelho (#ef4444) com gradiente translúcido
- **Features**:
  - Grid cartesiano suave
  - Tooltips com formatação BRL
  - Eixos X (meses) e Y (valores)

#### 5️⃣ **Gráfico: Despesas por Categoria** 🥧
- **Tipo**: Pie Chart (gráfico de pizza)
- **Categorias**:
  1. Salários (azul #3b82f6)
  2. Marketing (roxo #8b5cf6)
  3. Fornecedores (rosa #ec4899)
  4. Aluguel (laranja #f59e0b)
  5. Impostos (vermelho #ef4444)
- **Features**:
  - Labels com nome e porcentagem
  - Tooltip com valores formatados

#### 6️⃣ **Fluxo de Caixa com Previsão** 📊
- **Tipo**: Line Chart (gráfico de linha)
- **Período**: 5 meses histórico + 2 meses previsão
- **Features**:
  - Linha sólida: Dados reais (azul #3b82f6)
  - Linha tracejada: Previsão futura
  - Dots (pontos) nos valores
  - Legenda explicativa abaixo

#### 7️⃣ **Tabela: Transações Recentes** 📋

**Colunas**:
1. Data (formato dd/mm/aaaa)
2. Descrição (ex: "Venda CRM - Future Digital Co.")
3. Categoria (badge outline)
4. Conta (texto cinza pequeno)
5. Tipo (ícone + texto):
   - ↗️ Entrada (verde)
   - ↙️ Saída (vermelho)
6. Valor (formatado BRL, colorido)
7. Status (badge verde: "concluída")

**Features**:
- Hover effect nas linhas
- Botão "Ver Todas" no header
- Últimas 5 transações

#### 8️⃣ **Cards de Navegação Rápida** (Grid 7 colunas)

Cada card contém:
- Ícone colorido em fundo translúcido
- Label descritivo
- Hover: Scale 105% + sombra
- Cores temáticas:
  - Transações (azul)
  - Contas (verde-esmeralda)
  - Categorias (roxo)
  - Recorrências (laranja)
  - Relatórios (rosa)
  - Orçamentos (índigo)
  - Previsões (ciano)

---

## 🖼️ Mockup 2: Formulário de Transação

### **Visão Geral**
Formulário completo e intuitivo para criar/editar transações financeiras com upload de comprovantes.

### **Componentes e Seções**

#### 1️⃣ **Tipo de Transação** (Toggle)
Dois botões lado a lado:
- **Entrada** (selecionado):
  - Fundo: verde-esmeralda/10
  - Border: verde-esmeralda (2px)
  - Ícone: ↗️ ArrowUpRight
- **Saída**:
  - Fundo: muted/20
  - Border: border padrão
  - Ícone: ↙️ ArrowDownLeft

#### 2️⃣ **Formulário Principal** (Grid 2 colunas responsivo)

**Campos**:
1. **Descrição** (coluna completa)
   - Input texto
   - Placeholder: "Ex: Venda CRM - Cliente Nexus"

2. **Valor**
   - Input com prefixo "R$"
   - Formatação monetária

3. **Data da Transação**
   - Input tipo date
   - Formato brasileiro

4. **Categoria**
   - Select dropdown
   - Opções: Vendas, Serviços, Investimentos, Outros

5. **Conta Bancária**
   - Select dropdown
   - Lista de contas cadastradas

6. **Método de Pagamento**
   - Select dropdown
   - Opções: PIX, Transferência, Cartão, Boleto, Dinheiro

7. **Deal CRM** (opcional)
   - Select dropdown
   - Lista de deals ativos do CRM
   - Permite vincular receita ao deal

8. **Tags** (coluna completa)
   - Campo de tags customizável
   - Badges removíveis (X)
   - Input inline para adicionar novas

9. **Observações** (coluna completa)
   - Textarea
   - Min-height: 100px
   - Placeholder descritivo

#### 3️⃣ **Upload de Comprovantes** 📎

**Área de Drag & Drop**:
- Border tracejada (dashed)
- Ícone Upload centralizado
- Background: muted/10
- Hover: Border verde-esmeralda + bg muted/20
- Texto: "Arraste arquivos aqui ou clique para fazer upload"
- Formatos: "PDF, PNG, JPG até 10MB"

**Lista de Arquivos**:
Cada arquivo mostra:
- Ícone específico (FileText para PDF, Image para imagens)
- Nome do arquivo
- Tamanho
- Botão de visualização
- Botão de remover (X vermelho)

#### 4️⃣ **Transação Recorrente** (Toggle Section)

**Toggle Switch**:
- Pergunta: "Transação Recorrente?"
- Switch customizado (verde quando ativo)

**Campos expandidos** (quando ativado):
- Frequência (select: Mensal, Semanal, Anual)
- Próxima Execução (date input)

#### 5️⃣ **Botões de Ação**
Alinhados à direita:
- **Cancelar** (outline, cinza)
- **Salvar Transação** (verde-esmeralda, destaque)

---

## 🎨 Paleta de Cores Utilizada

### Cores Principais:
- **Verde Esmeralda** (#10b981): Receitas, positivo, CTAs
- **Vermelho** (#ef4444): Despesas, negativo, alertas
- **Azul** (#3b82f6): Neutro, informações, navegação
- **Roxo** (#8b5cf6): Categorias, tags
- **Laranja** (#f59e0b): Avisos, recorrências
- **Rosa** (#ec4899): Destaque secundário

### Tons de Cinza:
- **Foreground**: Texto principal
- **Muted-foreground**: Texto secundário (#6b7280)
- **Border**: Bordas (#333 em dark mode)
- **Muted**: Backgrounds secundários

---

## 📐 Sistema de Design

### Espaçamentos:
- **Gaps entre cards**: 1.5rem (gap-6)
- **Padding interno cards**: 1.5rem (p-6)
- **Margens entre seções**: 1.5rem (space-y-6)

### Bordas:
- **Radius cards**: 0.75rem (rounded-xl)
- **Radius botões**: 0.5rem (rounded-lg)
- **Border width**: 1px padrão, 2px em destaque

### Sombras:
- **Cards**: shadow-card (suave)
- **Hover**: shadow-lg (elevada)

### Transições:
- **Duração**: 200ms padrão
- **Easing**: ease-in-out
- **Propriedades**: all, background, transform, box-shadow

### Tipografia:
- **Títulos principais**: 2xl-3xl, font-bold
- **Títulos de card**: base-lg, font-semibold
- **Corpo de texto**: sm-base
- **Labels**: xs-sm, font-medium
- **Valores monetários**: 2xl-3xl, font-bold

---

## 🚀 Funcionalidades Demonstradas

### ✅ No Dashboard:
1. Visualização de saldo total em destaque
2. Comparativo mês a mês com indicadores
3. Gestão de múltiplas contas bancárias
4. Gráficos interativos com tooltips
5. Previsão de fluxo de caixa futuro
6. Tabela de transações recentes
7. Navegação rápida por cards

### ✅ No Formulário:
1. Toggle visual de tipo (entrada/saída)
2. Integração com CRM (vincular deals)
3. Upload de múltiplos comprovantes
4. Preview de arquivos
5. Sistema de tags flexível
6. Transações recorrentes
7. Validação visual de campos

---

## 💡 Princípios de UX Aplicados

### 1. **Hierarquia Visual Clara**
- Informações mais importantes (saldo total) em destaque
- Cores indicam polaridade (verde = positivo, vermelho = negativo)
- Tamanhos de fonte proporcionais à importância

### 2. **Feedback Visual**
- Hover states em todos os elementos interativos
- Cores de status claras (concluída = verde)
- Indicadores de tendência (↗️ ↙️)

### 3. **Consistência**
- Padrão de cards repetido em todo o sistema
- Ícones temáticos e intuitivos
- Espaçamentos consistentes

### 4. **Eficiência**
- Ações rápidas sempre visíveis
- Formulário organizado logicamente
- Upload por drag & drop

### 5. **Clareza de Dados**
- Valores formatados em BRL
- Datas em formato brasileiro
- Gráficos com legendas explicativas

### 6. **Responsividade**
- Grid adaptativo (1 → 2 → 4 colunas)
- Mobile-first approach
- Breakpoints em md, lg

---

## 🎯 Próximos Passos

Após aprovação destes mockups, implementaremos:

1. **Fase 1**: Estrutura de banco de dados
2. **Fase 2**: Componentes React funcionais
3. **Fase 3**: Hooks e lógica de negócio
4. **Fase 4**: Integração com CRM
5. **Fase 5**: Upload real no Supabase Storage
6. **Fase 6**: Relatórios e exportação
7. **Fase 7**: Funcionalidades avançadas
8. **Fase 8**: Permissões e segurança
9. **Fase 9**: Testes e refinamento

---

## 📸 Screenshots de Referência

### Inspirações de Design:
- **Conta Azul**: Simplicidade e clareza no financeiro
- **Neon**: Modernidade e gradientes vibrantes
- **Omie**: Dashboards completos com gráficos
- **Nubank**: Cards elegantes e micro-interações

---

## ✨ Diferenciais deste Design

1. **Dashboard Completo**: Tudo em uma única página
2. **Visualização Rica**: 4 tipos de gráficos diferentes
3. **Integração CRM**: Vincular receitas a deals
4. **Upload Visual**: Drag & drop com preview
5. **Previsão Inteligente**: Fluxo de caixa futuro
6. **Multi-conta**: Gestão de várias contas simultaneamente
7. **Categorização Flexível**: Sistema de tags customizável

---

**Criado por**: Cursor AI Assistant
**Data**: Outubro 2025
**Versão**: 1.0 - Mockup Inicial

