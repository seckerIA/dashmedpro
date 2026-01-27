# 🤖 PROMPT PARA CLAUDE CODE - MIGRAÇÃO NEXT.JS AUTOMÁTICA

Cole este prompt COMPLETO no Claude Code (terminal do Cursor):

---

## CONTEXTO

Sou desenvolvedor do DashMed Pro, um sistema de gestão para clínicas médicas em React SPA que está com problemas graves de performance (deadlocks, travamentos ao navegar). Preciso migrar para Next.js 15 (App Router) de forma rápida e estruturada.

## OBJETIVO

Criar um novo projeto Next.js 15 em paralelo ao React atual, configurando toda a base (auth, supabase, layouts, providers) e migrando progressivamente os módulos mantendo a lógica de negócio.

## STACK ATUAL (React SPA)
- React 18 + Vite + TypeScript
- Supabase (Auth + Database + RLS)
- TanStack Query v5
- shadcn/ui (Radix)
- React Hook Form + Zod
- Tailwind CSS

## STACK ALVO (Next.js)
- Next.js 15 (App Router)
- TypeScript
- Supabase SSR (@supabase/ssr)
- TanStack Query (client components)
- shadcn/ui (mesmo)
- Server Actions (substituir mutations)
- Tailwind CSS

## VARIÁVEIS DE AMBIENTE

```env
NEXT_PUBLIC_SUPABASE_URL=https://adzaqkduxnpckbcuqpmg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemFxa2R1eG5wY2tiY3VxcG1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5Mjg3OTUsImV4cCI6MjA1MTUwNDc5NX0.tXjfh1t4hxJXLWU-8sLkJq5_k5LkbBh1FJo7Q5l7-hs
```

## ESTRUTURA DO BANCO (Supabase)

Principais tabelas:
- `profiles` (id, email, full_name, role, created_at)
- `crm_contacts` (id, user_id, full_name, email, phone, company)
- `crm_deals` (id, user_id, contact_id, title, value, stage)
- `financial_transactions` (id, user_id, account_id, category_id, type, amount, date, description)
- `financial_accounts` (id, user_id, name, type, balance)
- `financial_categories` (id, user_id, name, type)
- `medical_appointments` (id, user_id, patient_id, start_time, end_time, type, status, notes)
- `medical_records` (id, user_id, patient_id, content) - RLS blindado por médico
- `tasks` (id, user_id, assigned_to, title, description, status, due_date)
- `whatsapp_conversations` (id, user_id, contact_name, phone_number, last_message)
- `whatsapp_messages` (id, conversation_id, content, sender, timestamp)

## ROLES DO SISTEMA
- admin: acesso total
- dono: acesso total (é o médico dono)
- medico: seus pacientes, agenda, prontuários, financeiro
- secretaria: agenda de todos, leads, cadastro de pacientes
- vendedor: CRM, leads, pipeline

## TAREFAS - EXECUTE NESTA ORDEM

### FASE 1: SETUP (15-30 MIN)

1. **Criar projeto Next.js**
```bash
# No diretório ACIMA do projeto atual
cd ..
npx create-next-app@latest dashmed-nextjs \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-git

cd dashmed-nextjs
```

2. **Instalar dependências**
```bash
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
```

3. **Configurar shadcn/ui**
```bash
npx shadcn@latest init -d -y

# Componentes essenciais
npx shadcn@latest add button card input label form table dialog dropdown-menu avatar select calendar tabs badge toast separator scroll-area -y
```

4. **Criar estrutura de pastas**
```bash
mkdir -p src/lib/supabase
mkdir -p src/app/\(auth\)/login
mkdir -p src/app/\(dashboard\)/{crm,agenda,financeiro,whatsapp,prontuarios,tarefas}
mkdir -p src/app/api/auth
mkdir -p src/actions
mkdir -p src/components/{layout,crm,financial,medical-calendar,whatsapp}
mkdir -p src/types
```

5. **Criar .env.local**
```bash
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://adzaqkduxnpckbcuqpmg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemFxa2R1eG5wY2tiY3VxcG1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5Mjg3OTUsImV4cCI6MjA1MTUwNDc5NX0.tXjfh1t4hxJXLWU-8sLkJq5_k5LkbBh1FJo7Q5l7-hs
EOF
```

### FASE 2: CONFIGURAÇÃO BASE (30-45 MIN)

6. **Criar src/lib/supabase/server.ts**
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getUserProfile() {
  const user = await getCurrentUser()
  if (!user) return null
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  return data
}

export async function requireAuth() {
  const profile = await getUserProfile()
  if (!profile) throw new Error('Não autenticado')
  return profile
}
```

7. **Criar src/lib/supabase/client.ts**
```typescript
import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (client) return client
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  return client
}
```

8. **Criar middleware.ts (raiz)**
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const publicPaths = ['/login']
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

9. **Criar src/app/providers.tsx**
```typescript
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'sonner'
import { ThemeProvider } from 'next-themes'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60 * 1000, retry: 1, refetchOnWindowFocus: false },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        {children}
        <Toaster />
        <ReactQueryDevtools initialIsOpen={false} />
      </ThemeProvider>
    </QueryClientProvider>
  )
}
```

10. **Atualizar src/app/layout.tsx**
```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DashMed Pro',
  description: 'Sistema de gestão para clínicas médicas',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

### FASE 3: AUTENTICAÇÃO (30 MIN)

11. **Criar src/app/(auth)/login/page.tsx**
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      toast.success('Login realizado!')
      router.push('/')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">DashMed Pro</CardTitle>
          <CardDescription>Faça login para acessar o sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

### FASE 4: DASHBOARD (45-60 MIN)

12. **Criar src/components/layout/AppSidebar.tsx**
```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Calendar, DollarSign, MessageSquare, FileText, CheckSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems = [
  { icon: Home, label: 'Dashboard', href: '/', roles: ['all'] },
  { icon: Users, label: 'CRM', href: '/crm', roles: ['all'] },
  { icon: Calendar, label: 'Agenda', href: '/agenda', roles: ['admin', 'dono', 'medico', 'secretaria'] },
  { icon: DollarSign, label: 'Financeiro', href: '/financeiro', roles: ['admin', 'dono', 'medico'] },
  { icon: MessageSquare, label: 'WhatsApp', href: '/whatsapp', roles: ['admin', 'dono', 'secretaria'] },
  { icon: FileText, label: 'Prontuários', href: '/prontuarios', roles: ['admin', 'dono', 'medico'] },
  { icon: CheckSquare, label: 'Tarefas', href: '/tarefas', roles: ['all'] },
]

export function AppSidebar({ userProfile }: { userProfile: any }) {
  const pathname = usePathname()
  const visibleItems = menuItems.filter(i => i.roles.includes('all') || i.roles.includes(userProfile.role))

  return (
    <aside className="w-64 bg-card border-r flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold">DashMed Pro</h1>
        <p className="text-xs text-muted-foreground mt-1">{userProfile.role}</p>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}
              className={cn('flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t">
        <p className="text-sm font-medium truncate">{userProfile.full_name || userProfile.email}</p>
      </div>
    </aside>
  )
}
```

13. **Criar src/components/layout/AppHeader.tsx**
```typescript
'use client'

import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function AppHeader({ userProfile }: { userProfile: any }) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      toast.success('Logout realizado')
      router.push('/login')
      router.refresh()
    } catch (error) {
      toast.error('Erro ao fazer logout')
    }
  }

  return (
    <header className="h-16 border-b bg-card flex items-center justify-end px-6">
      <Button variant="ghost" size="sm" onClick={handleLogout}>
        <LogOut className="h-4 w-4 mr-2" />
        Sair
      </Button>
    </header>
  )
}
```

14. **Criar src/app/(dashboard)/layout.tsx**
```typescript
import { requireAuth } from '@/lib/supabase/server'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { AppHeader } from '@/components/layout/AppHeader'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAuth()

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar userProfile={profile} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader userProfile={profile} />
        <main className="flex-1 overflow-y-auto bg-background p-6">{children}</main>
      </div>
    </div>
  )
}
```

15. **Criar src/app/(dashboard)/page.tsx**
```typescript
import { requireAuth } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Users, Calendar } from 'lucide-react'

export default async function DashboardPage() {
  const profile = await requireAuth()
  const supabase = await createClient()

  const [transactionsRes, contactsRes, appointmentsRes] = await Promise.all([
    supabase.from('financial_transactions').select('amount, type').eq('user_id', profile.id),
    supabase.from('crm_contacts').select('id', { count: 'exact' }).eq('user_id', profile.id),
    supabase.from('medical_appointments').select('id', { count: 'exact' }).eq('user_id', profile.id),
  ])

  const transactions = transactionsRes.data || []
  const revenue = transactions.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Bem-vindo, {profile.full_name || profile.email}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receita</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(revenue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Contatos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contactsRes.count || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Consultas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointmentsRes.count || 0}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export const revalidate = 300
```

### FASE 5: TESTE E BUILD

16. **Testar o sistema**
```bash
npm run dev
```

Acesse http://localhost:3000 e teste:
- Login funciona?
- Dashboard carrega com métricas?
- Sidebar aparece?
- Navegação funciona?

17. **Build de produção**
```bash
npm run build
```

Se passar sem erros, a base está pronta!

## RESULTADO ESPERADO

Após executar todas as tarefas:
- ✅ Projeto Next.js funcionando em paralelo ao React
- ✅ Login + Logout funcionando
- ✅ Dashboard com métricas do servidor
- ✅ Sidebar com navegação baseada em roles
- ✅ Middleware renovando sessão automaticamente (zero deadlocks!)
- ✅ Build passando sem erros

## PRÓXIMOS PASSOS (após confirmar base funcionando)

1. Migrar módulo CRM (Server Actions + páginas)
2. Migrar Agenda
3. Migrar Financeiro
4. Migrar WhatsApp
5. Migrar Prontuários
6. Migrar Tarefas

## IMPORTANTE

- Execute as tarefas NA ORDEM apresentada
- Teste após cada fase
- Se der erro, me mostre o log completo
- Não pule etapas

---

**EXECUTE ESSAS TAREFAS E ME AVISE QUANDO CONCLUIR A FASE 5 (teste + build).**
