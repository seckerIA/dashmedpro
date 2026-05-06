import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { resolveOrganizationPortal } from '@/lib/organizationPortal';
import type { OrganizationPortalBranding, OrganizationPortalSettings } from '@/types/organization';

export type AdminOrgRow = {
  id: string;
  name: string;
  slug?: string;
  portal_settings?: OrganizationPortalSettings | null;
};

type PalettePresetFormValue = 'auto' | 'dashmed' | 'joao_paulo';

function derivePalettePresetFromBranding(
  branding: OrganizationPortalBranding | undefined,
): PalettePresetFormValue {
  const pr = branding?.palette_preset;
  if (typeof pr === 'string') {
    const p = pr.trim().toLowerCase();
    if (p === 'dashmed') return 'dashmed';
    if (p === 'joao_paulo') return 'joao_paulo';
  }
  return 'auto';
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: AdminOrgRow | null;
  saving: boolean;
  onSave: (organizationId: string, settings: OrganizationPortalSettings) => Promise<void>;
};

function buildFormState(raw: OrganizationPortalSettings | null | undefined, org: AdminOrgRow | null) {
  const ctx = org
    ? { organizationName: org.name, organizationSlug: org.slug ?? undefined }
    : undefined;
  const r = resolveOrganizationPortal(raw ?? null, ctx);
  const b = raw?.branding ?? {};
  return {
    palette_preset: derivePalettePresetFromBranding(raw?.branding),
    primary_hsl: typeof b.primary_hsl === 'string' ? b.primary_hsl : r.branding.primary_hsl ?? '',
    logo_url: typeof b.logo_url === 'string' ? b.logo_url : r.branding.logo_url ?? '',
    sidebar_title: typeof b.sidebar_title === 'string' ? b.sidebar_title : r.branding.sidebar_title ?? '',
    sidebar_subtitle:
      typeof b.sidebar_subtitle === 'string' ? b.sidebar_subtitle : r.branding.sidebar_subtitle ?? '',
    crm_intelligence_tab: r.features.crm_intelligence_tab,
    navigation_ai: r.features.navigation_ai,
    module_inventory: r.features.module_inventory,
    module_commercial: r.features.module_commercial,
    module_whatsapp: r.features.module_whatsapp,
    module_financial: r.features.module_financial,
    module_reports: r.features.module_reports,
    module_team_management: r.features.module_team_management,
  };
}

export function OrganizationPortalSettingsDialog({
  open,
  onOpenChange,
  organization,
  saving,
  onSave,
}: Props) {
  const [form, setForm] = useState(() => buildFormState(null, null));

  useEffect(() => {
    if (!open || !organization) return;
    setForm(buildFormState(organization.portal_settings ?? null, organization));
  }, [open, organization]);

  const handleResetDefaults = () => {
    setForm(buildFormState({}, organization ?? null));
  };

  const submit = async () => {
    if (!organization) return;
    const branding: OrganizationPortalBranding = {
      palette_preset: form.palette_preset === 'auto' ? null : form.palette_preset,
    };
    if (form.primary_hsl.trim()) branding.primary_hsl = form.primary_hsl.trim();
    if (form.logo_url.trim()) branding.logo_url = form.logo_url.trim();
    if (form.sidebar_title.trim()) branding.sidebar_title = form.sidebar_title.trim();
    if (form.sidebar_subtitle.trim()) branding.sidebar_subtitle = form.sidebar_subtitle.trim();

    const payload: OrganizationPortalSettings = {
      branding,
      features: {
        crm_intelligence_tab: form.crm_intelligence_tab,
        navigation_ai: form.navigation_ai,
        module_inventory: form.module_inventory,
        module_commercial: form.module_commercial,
        module_whatsapp: form.module_whatsapp,
        module_financial: form.module_financial,
        module_reports: form.module_reports,
        module_team_management: form.module_team_management,
      },
    };

    await onSave(organization.id, payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(720px,calc(100vh-4rem))] flex-col gap-0 p-0 sm:max-w-xl">
        <DialogHeader className="shrink-0 border-b px-6 py-4 text-left">
          <DialogTitle>Marca e portal da clínica</DialogTitle>
          <DialogDescription>
            Personalização por tenant (<span className="font-mono text-xs">{organization?.slug}</span>).
            WhatsApp segue configurado pelo login da própria clínica.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[min(52vh,520px)] px-6 py-4">
          <div className="space-y-5 pr-4">
            <div className="space-y-2">
              <Label htmlFor="portal-palette">Paleta de cores</Label>
              <Select
                value={form.palette_preset}
                onValueChange={(value: PalettePresetFormValue) =>
                  setForm((f) => ({ ...f, palette_preset: value }))
                }
              >
                <SelectTrigger id="portal-palette">
                  <SelectValue placeholder="Paleta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Automática (nome/slug da clínica)</SelectItem>
                  <SelectItem value="joao_paulo">Paleta João Paulo (cores da pasta oficial)</SelectItem>
                  <SelectItem value="dashmed">DashMed padrão (sem preset de marca)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                A cor primária abaixo continua opcional — sobrepõe o verde/azul-teal do preset quando preenchida.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="portal-primary">Cor primária (HSL ou #hex)</Label>
              <Input
                id="portal-primary"
                placeholder="ex.: 221 83% 53% ou #2563eb"
                value={form.primary_hsl}
                onChange={(e) => setForm((f) => ({ ...f, primary_hsl: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="portal-logo">URL do logo</Label>
              <Input
                id="portal-logo"
                placeholder="https://..."
                value={form.logo_url}
                onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="portal-sidebar-title">Título na sidebar</Label>
              <Input
                id="portal-sidebar-title"
                placeholder={`Padrão: ${organization?.name ?? 'nome da organização'}`}
                value={form.sidebar_title}
                onChange={(e) => setForm((f) => ({ ...f, sidebar_title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="portal-sidebar-subtitle">Subtítulo na sidebar</Label>
              <Input
                id="portal-sidebar-subtitle"
                placeholder="Em branco = “DASHMED PRO”; string vazia remove a linha"
                value={form.sidebar_subtitle}
                onChange={(e) => setForm((f) => ({ ...f, sidebar_subtitle: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl border bg-muted/30 px-4 py-3">
              <div className="min-w-0 space-y-0.5">
                <Label htmlFor="portal-crm-intel" className="cursor-pointer text-sm font-medium">
                  Aba Inteligência no CRM
                </Label>
                <p className="text-xs text-muted-foreground">Painel de IA comercial dentro do CRM</p>
              </div>
              <Switch
                id="portal-crm-intel"
                checked={form.crm_intelligence_tab}
                onCheckedChange={(v) => setForm((f) => ({ ...f, crm_intelligence_tab: v }))}
              />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl border bg-muted/30 px-4 py-3">
              <div className="min-w-0 space-y-0.5">
                <Label htmlFor="portal-nav-ai" className="cursor-pointer text-sm font-medium">
                  IA na navegação (futuro)
                </Label>
                <p className="text-xs text-muted-foreground">Reserva para atalhos globais de assistente</p>
              </div>
              <Switch
                id="portal-nav-ai"
                checked={form.navigation_ai}
                onCheckedChange={(v) => setForm((f) => ({ ...f, navigation_ai: v }))}
              />
            </div>

            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Módulos na navegação
            </p>
            <div className="space-y-2 rounded-xl border bg-muted/20 p-3">
              {[
                {
                  key: 'module_inventory' as const,
                  id: 'portal-mod-inv',
                  label: 'Estoque',
                  hint: 'Inventário e alertas de lote',
                },
                {
                  key: 'module_commercial' as const,
                  id: 'portal-mod-comm',
                  label: 'Comercial',
                  hint: 'CRM, agenda comercial, performance, procedimentos…',
                },
                {
                  key: 'module_whatsapp' as const,
                  id: 'portal-mod-wa',
                  label: 'WhatsApp',
                  hint: 'Inbox e páginas de configuração do canal',
                },
                {
                  key: 'module_financial' as const,
                  id: 'portal-mod-fin',
                  label: 'Financeiro',
                  hint: 'Financeiro principal e portal “Meu financeiro”',
                },
                {
                  key: 'module_reports' as const,
                  id: 'portal-mod-rep',
                  label: 'Relatórios',
                  hint: '/relatorios (quando disponível para o papel)',
                },
                {
                  key: 'module_team_management' as const,
                  id: 'portal-mod-team',
                  label: 'Gerenciar equipe',
                  hint: '/equipe',
                },
              ].map((row) => (
                <div
                  key={row.key}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-background/50 px-3 py-2.5"
                >
                  <div className="min-w-0 space-y-0.5">
                    <Label htmlFor={row.id} className="cursor-pointer text-sm font-medium">
                      {row.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{row.hint}</p>
                  </div>
                  <Switch
                    id={row.id}
                    checked={form[row.key]}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, [row.key]: v }))}
                  />
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="shrink-0 flex-col gap-2 border-t px-6 py-4 sm:flex-row sm:justify-between">
          <Button type="button" variant="outline" onClick={handleResetDefaults} disabled={saving}>
            Restaurar formulário (padrão visual)
          </Button>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void submit()} disabled={saving || !organization}>
              {saving ? 'Salvando…' : 'Salvar'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
