/**
 * Helper to bypass TypeScript deep type inference issues with supabase.from()
 * 
 * The generated types.ts is outdated and missing many tables (e.g., inventory_items, 
 * followup_settings, etc.). This causes "excessively deep" type errors.
 * 
 * Usage: import { fromTable } from '@/lib/supabaseFrom';
 *        fromTable('my_table').select('*')...
 */
import { supabase } from '@/integrations/supabase/client';

export function fromTable(table: string): any {
  return (supabase.from(table as any) as any);
}

export function rpcCall(fn: string, params?: any): any {
  return (supabase.rpc(fn as any, params as any) as any);
}
