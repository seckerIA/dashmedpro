---
description: Next.js 15 + Supabase medical clinic SaaS. Enforces SSR patterns, RLS security, RBAC (6 roles), Server Components, Server Actions, shadcn/ui, pt-BR i18n. Critical: medical records privacy & data protection.
---

# DashMed Pro - Next.js 15 + Supabase Medical System

## CRITICAL - NEVER VIOLATE

### Supabase SSR
✅ ALWAYS use `@supabase/ssr` with `getAll()`/`setAll()`
❌ NEVER use `@supabase/auth-helpers-nextjs` or `get()`/`set()`/`remove()`

```typescript
// Server
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll() { return cookieStore.getAll() }, setAll(c) { c.forEach(({name,value,options})=>cookieStore.set(name,value,options)) }}
  })
}
// Client
import { createBrowserClient } from '@supabase/ssr'
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}
```

### RLS - ALWAYS filter by user_id
```typescript
// ✅ CORRECT
.eq('user_id', profile.id)
// Medical records: ONLY doctor who created can access
```

### Roles & Permissions
- admin: full access
- dono: full (clinic owner doctor)
- medico: own patients/appointments/records/financial
- secretaria: all calendars, leads, financial signals only
- vendedor: CRM/leads/pipeline

## Architecture

### Server Components (Default)
```typescript
// app/(dashboard)/crm/page.tsx
export default async function CRMPage() {
  const profile = await requireAuth()
  const contacts = await supabase.from('crm_contacts').select('*').eq('user_id',profile.id)
  return <ContactsList contacts={contacts}/>
}
export const revalidate = 300
```

### Server Actions
```typescript
// actions/crm.ts
'use server'
import { requireAuth } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createContact(formData: FormData) {
  const profile = await requireAuth()
  const supabase = await createClient()
  const {error} = await supabase.from('crm_contacts').insert({user_id:profile.id, full_name:formData.get('full_name')})
  if (error) throw error
  revalidatePath('/crm')
  return {success:true}
}
```

### Client Components (Only When Needed)
```typescript
'use client'
// Use ONLY for: onClick, useState, useEffect, Browser APIs
// NOT for data fetching or state management
```

## Code Style

### Files
```
app/(auth)/login/page.tsx           # Auth routes
app/(dashboard)/crm/page.tsx        # Protected routes
actions/crm.ts                      # Server Actions
components/crm/ContactCard.tsx      # Domain components
lib/supabase/server.ts              # Server utils
```

### Naming
- Files: kebab-case (`user-profile.tsx`)
- Components: PascalCase (`UserProfile`)
- Functions: camelCase (`getUserProfile`)
- Types: PascalCase + suffix (`ContactInsert`)

### TypeScript
```typescript
import type { Database } from '@/types/database'
type Contact = Database['public']['Tables']['crm_contacts']['Row']
// NO 'any' types - strict mode
```

## Forms & Validation

```typescript
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  full_name: z.string().min(2,'Nome muito curto'),
  email: z.string().email('Email inválido').optional(),
})
type FormData = z.infer<typeof schema>

export function ContactForm() {
  const form = useForm<FormData>({resolver:zodResolver(schema)})
  return <Form {...form}><form onSubmit={form.handleSubmit(onSubmit)}>...</form></Form>
}
```

## UI & Styling

### Tailwind
- Mobile-first, semantic classes
- Dark mode: `dark:` variants
- No inline styles

### shadcn/ui
- Install: `npx shadcn@latest add button`
- Never modify `components/ui/*` directly
- Create wrappers in domain folders

### Accessibility
- Semantic HTML (`<nav>`, `<main>`)
- ARIA labels on interactive elements
- Keyboard navigation, focus states
- WCAG AA contrast (4.5:1)

## Performance

### Images
```typescript
import Image from 'next/image'
<Image src="/logo.png" alt="Logo" width={200} height={50} priority/>
```

### Dynamic Imports
```typescript
const FullCalendar = dynamic(()=>import('@/components/calendar'),{ssr:false,loading:()=><Skeleton/>})
```

### DB Queries
```typescript
// ✅ Batch, limit, select specific columns
const [contacts,deals] = await Promise.all([
  supabase.from('crm_contacts').select('id,full_name').eq('user_id',userId).limit(50),
  supabase.from('crm_deals').select('id,title').eq('user_id',userId).limit(50)
])
// ❌ Sequential, select all
const contacts = await supabase.from('crm_contacts').select('*')
const deals = await supabase.from('crm_deals').select('*')
```

## Error Handling

```typescript
// app/(dashboard)/crm/error.tsx
'use client'
export default function Error({error,reset}:{error:Error,reset:()=>void}) {
  return <div><h2>Erro!</h2><Button onClick={reset}>Tentar novamente</Button></div>
}

// app/(dashboard)/crm/loading.tsx
export default function Loading() {
  return <Skeleton className="h-64"/>
}

// Server Action
export async function createContact(formData:FormData) {
  try {
    const {error} = await supabase.from('crm_contacts').insert({...})
    if (error) throw error
    revalidatePath('/crm')
    return {success:true,error:null}
  } catch (error) {
    return {success:false,error:error.message}
  }
}
```

## Internationalization (pt-BR)

```typescript
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

format(new Date(),"dd 'de' MMMM",{locale:ptBR}) // "23 de janeiro"
new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(1500.50) // "R$ 1.500,50"
```

## AI Interaction

### When Receiving Instructions:
1. SEARCH FIRST - Check existing similar code
2. REUSE FIRST - Extend patterns, don't recreate
3. ASK if unclear - No assumptions
4. CHALLENGE ideas - Point out flaws
5. BE HONEST - State limitations

### Response Format:
```
🔍 Understanding: [confirm]
📋 Plan: [steps]
⚠️ Considerations: [risks/alternatives]
💻 Implementation: [code]
✅ Next Steps: [what's next]
```

## Documentation

```typescript
/**
 * Creates contact for authenticated user
 * @param formData - Contact info
 * @returns Promise with success/error
 * @throws If not authenticated
 */
export async function createContact(formData:FormData) {
  // TODO(name,2026-01-30): Add email validation
}
```

## Commit Messages

```
feat(crm): add contact search
fix(auth): resolve session refresh
refactor(financial): optimize queries
```

## Environment

```env
# Public
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
# Private
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

## Build Checklist

- [ ] `npm run build` passes
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] RLS policies tested
- [ ] Role permissions tested

**Medical system - security & privacy are CRITICAL. When in doubt, ASK.**