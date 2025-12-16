# Stack Técnica - DashMed Pro

Este documento descreve a stack técnica utilizada no frontend do projeto DashMed Pro.

## Stack Principal

### Core
- **React** ^18.3.1 - Biblioteca JavaScript para construção de interfaces
- **TypeScript** ^5.8.3 - Superset do JavaScript com tipagem estática
- **Vite** ^5.4.19 - Build tool e dev server rápido

### Estilização
- **Tailwind CSS** ^3.4.17 - Framework CSS utility-first
- **CSS** - Estilos customizados e variáveis CSS
- **tailwindcss-animate** ^1.0.7 - Animações para Tailwind

### Componentes UI
- **shadcn/ui** - Coleção de componentes React acessíveis e customizáveis
  - Baseado em Radix UI
  - Componentes instalados via CLI: `npx shadcn@latest add [component]`
  - Configuração em `components.json`
  
- **Magic UI Components** - Componentes animados e interativos
  - Disponível em: https://magicui.design
  - Componentes copiados diretamente para o projeto
  - Exemplo: `src/components/ui/animated-card.tsx`
  - Para adicionar novos componentes, visite magicui.design e copie o código

### Ícones
- **Lucide React** ^0.462.0 - Biblioteca de ícones moderna e leve
  - Uso: `import { IconName } from "lucide-react"`

### Roteamento
- **React Router DOM** ^6.30.1 - Roteamento client-side
  - Configuração em `src/App.tsx`
  - Rotas protegidas implementadas

### Outras Bibliotecas Importantes
- **Framer Motion** ^12.23.24 - Biblioteca de animações
- **@tanstack/react-query** ^5.83.0 - Gerenciamento de estado do servidor
- **@tanstack/react-table** ^8.21.3 - Tabelas avançadas
- **react-hook-form** ^7.63.0 - Gerenciamento de formulários
- **zod** ^3.25.76 - Validação de schemas
- **Supabase** ^2.57.4 - Backend as a Service

## Como Adicionar Novos Componentes

### shadcn/ui
```bash
npx shadcn@latest add [component-name]
```

### Magic UI
1. Visite https://magicui.design
2. Escolha o componente desejado
3. Copie o código fornecido
4. Crie o arquivo em `src/components/ui/` ou `src/components/` conforme apropriado
5. Ajuste imports e estilos conforme necessário

## Estrutura de Componentes

```
src/
├── components/
│   ├── ui/              # Componentes shadcn/ui e Magic UI
│   ├── crm/             # Componentes específicos do CRM
│   ├── tasks/           # Componentes de tarefas
│   └── ...
├── pages/               # Páginas da aplicação
├── hooks/               # Custom hooks
└── lib/                 # Utilitários
```

## Tema e Cores

O projeto utiliza variáveis CSS para temas claro/escuro, definidas em `src/index.css`:
- Modo claro: padrão (`:root`)
- Modo escuro: classe `.dark`
- Gerenciado por `next-themes`

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build
```





