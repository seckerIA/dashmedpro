#!/bin/bash

# 🚀 SETUP NEXT.JS - MIGRAÇÃO RÁPIDA DASHMED PRO

set -e

echo "🎯 Iniciando setup Next.js para migração rápida..."

# 1. Criar projeto Next.js
echo "📁 Criando projeto Next.js..."
npx create-next-app@latest dashmed-nextjs \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-git

cd dashmed-nextjs

# 2. Instalar dependências essenciais
echo "📦 Instalando dependências..."
npm install --save \
  @supabase/ssr@latest \
  @supabase/supabase-js@latest \
  @tanstack/react-query@latest \
  @tanstack/react-table@latest \
  react-hook-form@latest \
  zod@latest \
  date-fns@latest \
  lucide-react@latest \
  recharts@latest \
  framer-motion@latest \
  sonner@latest \
  next-themes@latest

# 3. Configurar shadcn/ui
echo "🎨 Configurando shadcn/ui..."
npx shadcn@latest init -d -y

# 4. Adicionar componentes essenciais
echo "📦 Instalando componentes UI..."
npx shadcn@latest add button -y
npx shadcn@latest add card -y
npx shadcn@latest add input -y
npx shadcn@latest add label -y
npx shadcn@latest add form -y
npx shadcn@latest add table -y
npx shadcn@latest add dialog -y
npx shadcn@latest add dropdown-menu -y
npx shadcn@latest add avatar -y
npx shadcn@latest add select -y
npx shadcn@latest add calendar -y
npx shadcn@latest add tabs -y
npx shadcn@latest add badge -y
npx shadcn@latest add toast -y
npx shadcn@latest add separator -y
npx shadcn@latest add scroll-area -y

# 5. Criar estrutura de pastas
echo "📁 Criando estrutura..."
mkdir -p src/lib/supabase
mkdir -p src/app/\(auth\)/login
mkdir -p src/app/\(dashboard\)/{crm,agenda,financeiro,whatsapp,prontuarios,tarefas}
mkdir -p src/app/api/auth
mkdir -p src/actions
mkdir -p src/components/{layout,crm,financial,medical-calendar,whatsapp}
mkdir -p src/types

# 6. Copiar .env
echo "🔐 Configurando variáveis de ambiente..."
if [ -f "../dashmed-pro/.env.local" ]; then
  cp ../dashmed-pro/.env.local .env.local
  echo "✅ .env.local copiado"
else
  echo "⚠️  .env.local não encontrado. Crie manualmente."
fi

echo ""
echo "✅ Setup concluído!"
echo ""
echo "📝 Próximos passos:"
echo "1. cd dashmed-nextjs"
echo "2. Verifique .env.local"
echo "3. npm run dev"
echo "4. Continue com o guia de migração"
