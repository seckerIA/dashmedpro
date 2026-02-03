-- Migration: Add organization_id to inventory_transaction_items
-- Fix: This column was missing from migration 20260220000001

ALTER TABLE public.inventory_transaction_items
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

CREATE INDEX IF NOT EXISTS idx_inventory_transaction_items_org_id
ON public.inventory_transaction_items(organization_id);
