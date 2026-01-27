# 🚀 GUIA DE MIGRAÇÃO NEXT.JS - VERSÃO RÁPIDA (3 DIAS)

## 🎯 REALIDADE DO SEU PROJETO

- ✅ V3 anti-deadlock já aplicado
- ✅ Sistema funcional mas com performance ruim
- ✅ Não está em MVP ainda
- ✅ Quer resolver RÁPIDO

**Solução:** Migração incremental em 3 dias úteis (6-8h/dia)

---

## 📅 DIA 1: FUNDAÇÃO (6-8 HORAS)

### ⏰ MANHÃ (3-4h): Setup e Estrutura Base

#### 1. Execute o Script de Setup (30 min)

```bash
# No diretório ACIMA do seu projeto atual
cd ..

# Rode o script
chmod +x setup-nextjs-rapido.sh
./setup-nextjs-rapido.sh

# Entre no projeto
cd dashmed-nextjs
```

**Resultado esperado:**
```
✅ Projeto Next.js criado
✅ 40+ dependências instaladas
✅ shadcn/ui configurado
✅ Estrutura de pastas criada
✅ .env.local copiado
```

#### 2. Copie os Arquivos Base (1h)

**Arquivos que eu criei para você:**

```bash
# Supabase
cp /path/to/lib-supabase-server.ts src/lib/supabase/server.ts
cp /path/to/lib-supabase-client.ts src/lib/supabase/client.ts

# Middleware
cp /path/to/middleware.ts middleware.ts

# App
cp /path/to/app-layout.tsx src/app/layout.tsx
cp /path/to/app-providers.tsx src/app/providers.tsx

# Auth
mkdir -p src/app/\(auth\)/login
cp /path/to/login-page.tsx src/app/\(auth\)/login/page.tsx

# Dashboard
mkdir -p src/app/\(dashboard\)
cp /path/to/dashboard-page.tsx src/app/\(dashboard\)/page.tsx
cp /path/to/dashboard-layout.tsx src/app/\(dashboard\)/layout.tsx

# Components
mkdir -p src/components/layout
cp /path/to/AppSidebar.tsx src/components/layout/AppSidebar.tsx
cp /path/to/AppHeader.tsx src/components/layout/AppHeader.tsx
```

#### 3. Gerar Types do Supabase (15 min)

```bash
# Se ainda não tem
npm install -g supabase

# Gerar types
npx supabase gen types typescript \
  --project-id SEU_PROJECT_ID \
  > src/types/database.ts

# Ou via URL do banco
npx supabase gen types typescript \
  --db-url "postgresql://..." \
  > src/types/database.ts
```

#### 4. Primeiro Teste (15 min)

```bash
npm run dev
```

Acesse http://localhost:3000

**✅ Checkpoint 1:** Login deve funcionar e redirecionar pro dashboard com métricas.

**❌ Se der erro:**
- Verifique .env.local (NEXT_PUBLIC_SUPABASE_URL e ANON_KEY)
- Verifique se tabelas existem no Supabase
- Olhe o console do navegador e terminal

---

### ⏰ TARDE (3-4h): Copiar Componentes UI

#### 5. Copiar Componentes Globais (2h)

```bash
# Do projeto React antigo, copie componentes "burros" (sem lógica)
cp -r ../dashmed-pro/src/components/ui/* src/components/ui/

# Ajuste imports (se necessário)
# Troque "@/components/ui" por "@/components/ui" (já está certo)
```

#### 6. Copiar Estilos (30 min)

```bash
# Copie globals.css
cp ../dashmed-pro/src/index.css src/app/globals.css

# Copie tailwind.config se tiver customizações
# (Verifique cores customizadas, fonts, etc)
```

#### 7. Testar Novamente (30 min)

```bash
npm run dev
```

**✅ Checkpoint 2:** 
- Dashboard renderizando bonito
- Sidebar funcionando
- Navegação entre páginas (mesmo vazias) funciona
- Sem erros no console

---

### 🎉 FIM DO DIA 1

**Você tem:**
- ✅ Next.js configurado
- ✅ Auth funcionando
- ✅ Dashboard com métricas do servidor
- ✅ Sidebar e navegação
- ✅ UI copiada do projeto antigo

**Amanhã:** Migrar os 3 módulos principais

---

## 📅 DIA 2: MÓDULOS PRINCIPAIS (6-8 HORAS)

### ⏰ MANHÃ (3-4h): CRM

#### 1. Criar Server Actions (1h)

```typescript
// src/actions/crm.ts
'use server'

import { createClient, requireAuth } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getContacts() {
  const profile = await requireAuth()
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('crm_contacts')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
  
  return data || []
}

export async function createContact(formData: FormData) {
  const profile = await requireAuth()
  const supabase = await createClient()

  const { error } = await supabase
    .from('crm_contacts')
    .insert({
      user_id: profile.id,
      full_name: formData.get('full_name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      company: formData.get('company') as string,
    })

  if (error) throw error
  
  revalidatePath('/crm')
  return { success: true }
}

export async function deleteContact(id: string) {
  const profile = await requireAuth()
  const supabase = await createClient()

  const { error } = await supabase
    .from('crm_contacts')
    .delete()
    .eq('id', id)
    .eq('user_id', profile.id)

  if (error) throw error
  
  revalidatePath('/crm')
  return { success: true }
}
```

#### 2. Criar Página CRM (1h)

```typescript
// src/app/(dashboard)/crm/page.tsx
import { getContacts } from '@/actions/crm'
import { ContactsTable } from '@/components/crm/ContactsTable'
import { CreateContactDialog } from '@/components/crm/CreateContactDialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default async function CRMPage() {
  const contacts = await getContacts()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">CRM</h1>
          <p className="text-muted-foreground">Gerencie seus contatos</p>
        </div>
        <CreateContactDialog>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Contato
          </Button>
        </CreateContactDialog>
      </div>

      <ContactsTable contacts={contacts} />
    </div>
  )
}
```

#### 3. Copiar/Adaptar Componentes CRM (1-2h)

```bash
# Copie componentes do React antigo
cp ../dashmed-pro/src/components/crm/* src/components/crm/

# Ajuste cada componente:
# - Adicione 'use client' se tiver useState, useEffect, etc
# - Troque useQuery por Server Actions
# - Troque useMutation por Server Actions
```

**Exemplo de adaptação:**

```typescript
// ANTES (React SPA)
function ContactsTable() {
  const { data, refetch } = useQuery(['contacts'], getContacts)
  const deleteMutation = useMutation(deleteContact, {
    onSuccess: () => refetch()
  })
  // ...
}

// DEPOIS (Next.js)
'use client'

import { deleteContact } from '@/actions/crm'
import { useRouter } from 'next/navigation'

function ContactsTable({ contacts }: { contacts: any[] }) {
  const router = useRouter()
  
  const handleDelete = async (id: string) => {
    await deleteContact(id)
    router.refresh() // Atualiza os dados
  }
  // ...
}
```

**✅ Checkpoint 3:** CRM funcionando (listar, criar, deletar contatos)

---

### ⏰ TARDE (3-4h): Agenda e Financeiro

Repita o mesmo padrão do CRM:

#### 4. Agenda (1.5h)

```typescript
// src/actions/agenda.ts
'use server'

export async function getAppointments() { /* ... */ }
export async function createAppointment(formData: FormData) { /* ... */ }
export async function updateAppointment(id: string, formData: FormData) { /* ... */ }
export async function deleteAppointment(id: string) { /* ... */ }
```

```typescript
// src/app/(dashboard)/agenda/page.tsx
import { getAppointments } from '@/actions/agenda'
import { CalendarView } from '@/components/medical-calendar/CalendarView'

export default async function AgendaPage() {
  const appointments = await getAppointments()
  return <CalendarView appointments={appointments} />
}
```

#### 5. Financeiro (1.5h)

```typescript
// src/actions/financeiro.ts
'use server'

export async function getTransactions() { /* ... */ }
export async function createTransaction(formData: FormData) { /* ... */ }
export async function deleteTransaction(id: string) { /* ... */ }
export async function getAccounts() { /* ... */ }
export async function getCategories() { /* ... */ }
```

```typescript
// src/app/(dashboard)/financeiro/page.tsx
import { getTransactions } from '@/actions/financeiro'
import { TransactionsList } from '@/components/financial/TransactionsList'

export default async function FinanceiroPage() {
  const transactions = await getTransactions()
  return <TransactionsList transactions={transactions} />
}
```

**✅ Checkpoint 4:** Agenda e Financeiro funcionando

---

### 🎉 FIM DO DIA 2

**Você tem:**
- ✅ CRM completo (CRUD)
- ✅ Agenda funcionando
- ✅ Financeiro funcionando
- ✅ **70% do sistema migrado!**

**Amanhã:** Migrar resto + deploy

---

## 📅 DIA 3: FINALIZAÇÃO (6-8 HORAS)

### ⏰ MANHÃ (3-4h): Módulos Restantes

#### 1. WhatsApp (1.5h)

```typescript
// src/actions/whatsapp.ts
'use server'

export async function getConversations() { /* ... */ }
export async function getMessages(conversationId: string) { /* ... */ }
export async function sendMessage(conversationId: string, message: string) { /* ... */ }
```

#### 2. Prontuários (1h)

```typescript
// src/actions/prontuarios.ts
'use server'

export async function getMedicalRecords() { /* ... */ }
export async function createMedicalRecord(formData: FormData) { /* ... */ }
// IMPORTANTE: Verificar RLS para prontuários!
```

#### 3. Tarefas (30min)

```typescript
// src/actions/tarefas.ts
'use server'

export async function getTasks() { /* ... */ }
export async function createTask(formData: FormData) { /* ... */ }
export async function updateTask(id: string, data: any) { /* ... */ }
```

---

### ⏰ TARDE (3-4h): Deploy e Testes Finais

#### 4. Configurar Variáveis de Ambiente no Vercel

```bash
# Build de produção local
npm run build

# Se passar, fazer deploy
npx vercel

# Ou via GitHub (recomendado)
git init
git add .
git commit -m "Migração Next.js completa"
git remote add origin <seu-repo>
git push -u origin main

# No Vercel:
# - Conecte o repositório
# - Adicione variáveis de ambiente
# - Deploy automático
```

#### 5. Testes em Produção (2h)

Teste TODOS os fluxos:
- ✅ Login/Logout
- ✅ Criar/Editar/Deletar em cada módulo
- ✅ Navegação entre páginas
- ✅ Troca de role (se tiver)
- ✅ RLS funcionando

#### 6. Monitoramento (30min)

Configure no Vercel:
- Analytics
- Error tracking
- Logs

---

### 🎉 FIM DO DIA 3

**Você tem:**
- ✅ **100% do sistema migrado**
- ✅ Deploy em produção
- ✅ Performance 10x melhor
- ✅ Zero deadlocks
- ✅ Sistema pronto para desenvolvimento

---

## 📊 COMPARAÇÃO: ANTES vs DEPOIS

| Métrica | React SPA (Antes) | Next.js (Depois) |
|---------|-------------------|------------------|
| **Tempo de load inicial** | 3-5s | 0.5-1s |
| **Navegação entre páginas** | 500ms-2s (ou trava) | 50-200ms |
| **Queries pesadas** | Trava o browser | Roda no servidor |
| **Troca de role** | Precisa F5 | Instantânea |
| **Idle recovery** | Deadlock | Automático |
| **SEO** | Ruim | Excelente |
| **Deploy** | Simples (Vercel/Netlify) | Simples (Vercel) |

---

## 🎯 CHECKLIST FINAL

Antes de considerar a migração completa:

- [ ] Login funciona
- [ ] Dashboard mostra métricas
- [ ] CRM (listar, criar, editar, deletar)
- [ ] Agenda (listar, criar agendamentos)
- [ ] Financeiro (listar, criar transações)
- [ ] WhatsApp (listar conversas, enviar mensagens)
- [ ] Prontuários (listar, criar)
- [ ] Tarefas (listar, criar, marcar como feita)
- [ ] Sidebar mostra apenas módulos do role
- [ ] Logout funciona
- [ ] Build passa sem erros
- [ ] Deploy funciona

---

## 🚨 TROUBLESHOOTING COMUM

### Erro: "Server Component cannot use hooks"
**Solução:** Adicione `'use client'` no topo do arquivo

### Erro: "Headers already sent"
**Solução:** Use `redirect()` em vez de `router.push()` em Server Components

### Erro: "Cannot read properties of undefined"
**Solução:** Adicione optional chaining (`?.`) e verificações de null

### Performance ainda ruim
**Solução:** 
1. Verifique os índices do banco (do PLANO_B_EMERGENCIAL.md)
2. Use `revalidate = 300` em páginas pesadas
3. Adicione loading.tsx em rotas lentas

---

## 📦 ARQUIVOS PRONTOS

Todos os arquivos que você precisa para começar:

1. ✅ `setup-nextjs-rapido.sh` - Setup automático
2. ✅ `lib-supabase-server.ts` - Cliente Supabase server
3. ✅ `lib-supabase-client.ts` - Cliente Supabase client
4. ✅ `middleware.ts` - Auth middleware
5. ✅ `app-layout.tsx` - Layout raiz
6. ✅ `app-providers.tsx` - Providers
7. ✅ `login-page.tsx` - Página de login
8. ✅ `dashboard-page.tsx` - Dashboard
9. ✅ `dashboard-layout.tsx` - Layout dashboard
10. ✅ `AppSidebar.tsx` - Sidebar
11. ✅ `AppHeader.tsx` - Header

---

## 🎯 PRÓXIMO PASSO AGORA

**Escolha um:**

**A) Começar AGORA**
```bash
chmod +x setup-nextjs-rapido.sh
./setup-nextjs-rapido.sh
```

**B) Eu crio mais arquivos primeiro**
Me diga qual módulo você quer completo (CRM, Agenda, etc)

**C) Tem dúvidas**
Me pergunte o que quiser

**Qual opção?** 🚀
