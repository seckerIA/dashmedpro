// Global type override for Supabase client
// This is needed because the generated types.ts is out of sync with the actual database schema.
// Many tables, enums, and RPC functions exist in the DB but are not in the generated types file.

import type { SupabaseClient } from '@supabase/supabase-js';

declare module '@supabase/supabase-js' {
  interface SupabaseClient<
    Database = any,
    SchemaName extends string & keyof Database = 'public' extends keyof Database
      ? 'public'
      : string & keyof Database,
    Schema extends Record<string, unknown> = Database[SchemaName] extends Record<string, unknown>
      ? Database[SchemaName]
      : any
  > {
    from(relation: string): any;
    rpc(fn: string, args?: Record<string, any>, options?: any): any;
  }
}
