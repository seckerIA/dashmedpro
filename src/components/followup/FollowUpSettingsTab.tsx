/**
 * Aba de Configurações de Follow-Up
 * Configurações completas para automação de follow-ups
 */

import { useState, useEffect } from 'react';
import { useFollowUpSettings } from '@/hooks/useFollowUpSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';
import {
  Settings,
  Clock,
  MessageSquare,
  Calendar,
  UserX,
  CreditCard,
  Cake,
  Star,
  AlertCircle,
  Save,
  RotateCcw,
  Power,
  PowerOff,
  CheckCircle2,
  Bell,
  Timer,
  Zap,
  Shield,
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FollowUpSettings, FollowUpSettingsUpdate } from '@/types/followUp';

// ============================================
// TYPES
// ============================================

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  enabledKey?: keyof FollowUpSettings;
}

// ============================================
// CONSTANTS
// ============================================

const SECTIONS: SettingsSection[] = [
  {
    id: 'global',
    title: 'Configurações Globais',
    description: 'Horário comercial, limites e preferências gerais',
    icon: <Settings className="h-5 w-5" />,
  },
  {
    id: 'post_appointment',
    title: 'Pós-Consulta',
    description: 'Follow-ups automáticos após consultas concluídas',
    icon: <CheckCircle2 className="h-5 w-5" />,
  },
  {
    id: 'pre_appointment',
    title: 'Pré-Consulta (Lembretes)',
    description: 'Lembretes e confirmações antes das consultas',
    icon: <Bell className="h-5 w-5" />,
  },
  {
    id: 'lead_vacuum',
    title: 'Conversão (Vácuo)',
    description: 'Follow-up para leads sem resposta',
    icon: <MessageCircle className="h-5 w-5" />,
    enabledKey: 'lead_vacuum_enabled',
  },
  {
    id: 'inactive',
    title: 'Paciente Inativo',
    description: 'Reativação de pacientes que não retornam',
    icon: <UserX className="h-5 w-5" />,
    enabledKey: 'inactive_patient_enabled',
  },
  {
    id: 'payment',
    title: 'Pagamento',
    description: 'Lembretes de pagamentos pendentes',
    icon: <CreditCard className="h-5 w-5" />,
    enabledKey: 'payment_reminder_enabled',
  },
  {
    id: 'birthday',
    title: 'Aniversário',
    description: 'Mensagens de felicitação',
    icon: <Cake className="h-5 w-5" />,
    enabledKey: 'birthday_enabled',
  },
  {
    id: 'nps',
    title: 'Respostas NPS',
    description: 'Auto-resposta baseada na avaliação',
    icon: <Star className="h-5 w-5" />,
    enabledKey: 'nps_auto_response_enabled',
  },
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
];

const TIMEZONES = [
  { value: 'America/Sao_Paulo', label: 'Brasília (GMT-3)' },
  { value: 'America/Manaus', label: 'Manaus (GMT-4)' },
  { value: 'America/Belem', label: 'Belém (GMT-3)' },
  { value: 'America/Fortaleza', label: 'Fortaleza (GMT-3)' },
  { value: 'America/Recife', label: 'Recife (GMT-3)' },
  { value: 'America/Cuiaba', label: 'Cuiabá (GMT-4)' },
  { value: 'America/Porto_Velho', label: 'Porto Velho (GMT-4)' },
  { value: 'America/Rio_Branco', label: 'Rio Branco (GMT-5)' },
];

// ============================================
// MAIN COMPONENT
// ============================================

export function FollowUpSettingsTab() {
  const { settings, isLoading, isSaving, updateSettings, toggleEnabled, resetToDefaults } = useFollowUpSettings();
  const [localSettings, setLocalSettings] = useState<Partial<FollowUpSettings>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Sync local state with fetched settings
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
      setHasChanges(false);
    }
  }, [settings]);

  // Update local state
  const updateLocal = <K extends keyof FollowUpSettings>(key: K, value: FollowUpSettings[K]) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  // Save changes
  const handleSave = async () => {
    try {
      // Only send changed fields
      const changes: FollowUpSettingsUpdate = {};
      Object.keys(localSettings).forEach(key => {
        const k = key as keyof FollowUpSettings;
        if (settings && localSettings[k] !== settings[k]) {
          (changes as Record<string, unknown>)[k] = localSettings[k];
        }
      });

      if (Object.keys(changes).length > 0) {
        await updateSettings(changes);
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (!settings) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Erro ao carregar configurações</h3>
        <p className="text-muted-foreground mt-1">
          Não foi possível carregar as configurações. Tente novamente.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Master Toggle */}
      <Card className={cn(
        "border-2 transition-colors",
        localSettings.is_enabled ? "border-green-500/50 bg-green-500/5" : "border-muted"
      )}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-3 rounded-full",
                localSettings.is_enabled ? "bg-green-500/20" : "bg-muted"
              )}>
                {localSettings.is_enabled ? (
                  <Power className="h-6 w-6 text-green-500" />
                ) : (
                  <PowerOff className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  {localSettings.is_enabled ? 'Sistema Ativo' : 'Sistema Desativado'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {localSettings.is_enabled
                    ? 'Os follow-ups serão enviados automaticamente conforme configurado'
                    : 'Nenhum follow-up será enviado enquanto o sistema estiver desativado'}
                </p>
              </div>
            </div>
            <Switch
              checked={localSettings.is_enabled}
              onCheckedChange={(checked) => {
                updateLocal('is_enabled', checked);
                toggleEnabled(checked);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save/Reset Actions */}
      {hasChanges && (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur py-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              Você tem alterações não salvas
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setLocalSettings(settings)}>
                Descartar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Sections */}
      <Accordion type="multiple" defaultValue={['global', 'post_appointment']} className="space-y-4">
        {/* Global Settings */}
        <AccordionItem value="global" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <div className="text-left">
                <div className="font-semibold">Configurações Globais</div>
                <div className="text-sm text-muted-foreground font-normal">
                  Horário comercial, limites e preferências gerais
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-6">
              {/* Business Hours */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Respeitar Horário Comercial</Label>
                  <Switch
                    checked={localSettings.business_hours_only}
                    onCheckedChange={(v) => updateLocal('business_hours_only', v)}
                  />
                </div>

                {localSettings.business_hours_only && (
                  <div className="grid grid-cols-2 gap-4 pl-4 border-l-2">
                    <div className="space-y-2">
                      <Label>Início</Label>
                      <Input
                        type="time"
                        value={localSettings.business_start_time || '08:00'}
                        onChange={(e) => updateLocal('business_start_time', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fim</Label>
                      <Input
                        type="time"
                        value={localSettings.business_end_time || '18:00'}
                        onChange={(e) => updateLocal('business_end_time', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Dias de Funcionamento</Label>
                      <div className="flex flex-wrap gap-2">
                        {DAYS_OF_WEEK.map((day) => (
                          <Badge
                            key={day.value}
                            variant={localSettings.working_days?.includes(day.value) ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => {
                              const current = localSettings.working_days || [];
                              const updated = current.includes(day.value)
                                ? current.filter(d => d !== day.value)
                                : [...current, day.value].sort();
                              updateLocal('working_days', updated);
                            }}
                          >
                            {day.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Fuso Horário</Label>
                      <Select
                        value={localSettings.timezone || 'America/Sao_Paulo'}
                        onValueChange={(v) => updateLocal('timezone', v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMEZONES.map((tz) => (
                            <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Rate Limits */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Limites de Envio
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Máximo por dia (total)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={500}
                      value={localSettings.max_daily_sends || 50}
                      onChange={(e) => updateLocal('max_daily_sends', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Máximo por contato/dia</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={localSettings.max_sends_per_contact_day || 3}
                      onChange={(e) => updateLocal('max_sends_per_contact_day', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Intervalo mínimo (min)</Label>
                    <Input
                      type="number"
                      min={5}
                      max={1440}
                      value={localSettings.min_interval_between_sends || 60}
                      onChange={(e) => updateLocal('min_interval_between_sends', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Post-Appointment Settings */}
        <AccordionItem value="post_appointment" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div className="text-left">
                <div className="font-semibold">Pós-Consulta</div>
                <div className="text-sm text-muted-foreground font-normal">
                  Follow-ups automáticos após consultas concluídas
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-6">
              {/* Immediate (2h) */}
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Avaliação Imediata</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviado {(localSettings.post_appointment_immediate_delay || 120) / 60}h após a consulta
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.post_appointment_immediate_enabled}
                    onCheckedChange={(v) => updateLocal('post_appointment_immediate_enabled', v)}
                  />
                </div>

                {localSettings.post_appointment_immediate_enabled && (
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label>Delay (minutos)</Label>
                      <div className="flex items-center gap-4">
                        <Slider
                          value={[localSettings.post_appointment_immediate_delay || 120]}
                          onValueChange={([v]) => updateLocal('post_appointment_immediate_delay', v)}
                          min={30}
                          max={480}
                          step={30}
                          className="flex-1"
                        />
                        <Badge variant="outline" className="min-w-[60px] justify-center">
                          {((localSettings.post_appointment_immediate_delay || 120) / 60).toFixed(1)}h
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Mensagem</Label>
                      <Textarea
                        value={localSettings.post_appointment_immediate_message || ''}
                        onChange={(e) => updateLocal('post_appointment_immediate_message', e.target.value)}
                        rows={6}
                        placeholder="Use {{patient_name}}, {{doctor_name}}, etc."
                      />
                      <p className="text-xs text-muted-foreground">
                        Variáveis: {'{{patient_name}}'}, {'{{doctor_name}}'}, {'{{appointment_date}}'}, {'{{appointment_time}}'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 7 Days */}
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Acompanhamento 7 dias</Label>
                    <p className="text-sm text-muted-foreground">
                      Perguntar como o paciente está se sentindo
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.post_appointment_7d_enabled}
                    onCheckedChange={(v) => updateLocal('post_appointment_7d_enabled', v)}
                  />
                </div>

                {localSettings.post_appointment_7d_enabled && (
                  <div className="space-y-2 pt-2">
                    <Label>Mensagem</Label>
                    <Textarea
                      value={localSettings.post_appointment_7d_message || ''}
                      onChange={(e) => updateLocal('post_appointment_7d_message', e.target.value)}
                      rows={5}
                    />
                  </div>
                )}
              </div>

              {/* 30 Days */}
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Acompanhamento 30 dias</Label>
                    <p className="text-sm text-muted-foreground">
                      Sugerir retorno após 1 mês
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.post_appointment_30d_enabled}
                    onCheckedChange={(v) => updateLocal('post_appointment_30d_enabled', v)}
                  />
                </div>

                {localSettings.post_appointment_30d_enabled && (
                  <div className="space-y-2 pt-2">
                    <Label>Mensagem</Label>
                    <Textarea
                      value={localSettings.post_appointment_30d_message || ''}
                      onChange={(e) => updateLocal('post_appointment_30d_message', e.target.value)}
                      rows={5}
                    />
                  </div>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Pre-Appointment Settings */}
        <AccordionItem value="pre_appointment" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-blue-500" />
              <div className="text-left">
                <div className="font-semibold">Pré-Consulta (Lembretes)</div>
                <div className="text-sm text-muted-foreground font-normal">
                  Lembretes e confirmações antes das consultas
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-6">
              {/* 24h Before */}
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Lembrete 24h antes</Label>
                    <p className="text-sm text-muted-foreground">
                      Confirmação de presença
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.pre_appointment_24h_enabled}
                    onCheckedChange={(v) => updateLocal('pre_appointment_24h_enabled', v)}
                  />
                </div>

                {localSettings.pre_appointment_24h_enabled && (
                  <div className="space-y-2 pt-2">
                    <Label>Mensagem</Label>
                    <Textarea
                      value={localSettings.pre_appointment_24h_message || ''}
                      onChange={(e) => updateLocal('pre_appointment_24h_message', e.target.value)}
                      rows={8}
                    />
                  </div>
                )}
              </div>

              {/* 2h Before */}
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Lembrete 2h antes</Label>
                    <p className="text-sm text-muted-foreground">
                      Lembrete final no dia
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.pre_appointment_2h_enabled}
                    onCheckedChange={(v) => updateLocal('pre_appointment_2h_enabled', v)}
                  />
                </div>

                {localSettings.pre_appointment_2h_enabled && (
                  <div className="space-y-2 pt-2">
                    <Label>Mensagem</Label>
                    <Textarea
                      value={localSettings.pre_appointment_2h_message || ''}
                      onChange={(e) => updateLocal('pre_appointment_2h_message', e.target.value)}
                      rows={4}
                    />
                  </div>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Lead Vacuum Settings */}
        <AccordionItem value="lead_vacuum" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-5 w-5 text-orange-500" />
              <div className="text-left">
                <div className="font-semibold flex items-center gap-2">
                  Conversão (Vácuo)
                  {localSettings.lead_vacuum_enabled && (
                    <Badge variant="default" className="text-xs">Ativo</Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground font-normal">
                  Follow-up para leads sem resposta
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Ativar follow-up de vácuo</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar mensagem quando lead não responder
                  </p>
                </div>
                <Switch
                  checked={localSettings.lead_vacuum_enabled}
                  onCheckedChange={(v) => updateLocal('lead_vacuum_enabled', v)}
                />
              </div>

              {localSettings.lead_vacuum_enabled && (
                <div className="space-y-4 pt-2 pl-4 border-l-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Horas sem resposta</Label>
                      <Input
                        type="number"
                        min={1}
                        max={168}
                        value={localSettings.lead_vacuum_hours || 24}
                        onChange={(e) => updateLocal('lead_vacuum_hours', parseInt(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Máximo de tentativas</Label>
                      <Input
                        type="number"
                        min={1}
                        max={5}
                        value={localSettings.lead_vacuum_max_attempts || 3}
                        onChange={(e) => updateLocal('lead_vacuum_max_attempts', parseInt(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Intervalo entre tentativas (h)</Label>
                      <Input
                        type="number"
                        min={1}
                        max={168}
                        value={localSettings.lead_vacuum_interval_hours || 24}
                        onChange={(e) => updateLocal('lead_vacuum_interval_hours', parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Mensagens (uma por tentativa)</Label>
                    {(localSettings.lead_vacuum_messages || []).map((msg, idx) => (
                      <div key={idx} className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Tentativa {idx + 1}</Label>
                        <Textarea
                          value={msg}
                          onChange={(e) => {
                            const msgs = [...(localSettings.lead_vacuum_messages || [])];
                            msgs[idx] = e.target.value;
                            updateLocal('lead_vacuum_messages', msgs);
                          }}
                          rows={3}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <Label>Exclusões</Label>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Excluir leads já convertidos</span>
                      <Switch
                        checked={localSettings.lead_vacuum_exclude_converted}
                        onCheckedChange={(v) => updateLocal('lead_vacuum_exclude_converted', v)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Excluir quem já agendou</span>
                      <Switch
                        checked={localSettings.lead_vacuum_exclude_scheduled}
                        onCheckedChange={(v) => updateLocal('lead_vacuum_exclude_scheduled', v)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Inactive Patient Settings */}
        <AccordionItem value="inactive" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <UserX className="h-5 w-5 text-purple-500" />
              <div className="text-left">
                <div className="font-semibold flex items-center gap-2">
                  Paciente Inativo
                  {localSettings.inactive_patient_enabled && (
                    <Badge variant="default" className="text-xs">Ativo</Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground font-normal">
                  Reativação de pacientes que não retornam
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Ativar reativação</Label>
                  <p className="text-sm text-muted-foreground">
                    Contatar pacientes inativos
                  </p>
                </div>
                <Switch
                  checked={localSettings.inactive_patient_enabled}
                  onCheckedChange={(v) => updateLocal('inactive_patient_enabled', v)}
                />
              </div>

              {localSettings.inactive_patient_enabled && (
                <div className="space-y-4 pt-2 pl-4 border-l-2">
                  <div className="space-y-2">
                    <Label>Dias sem consulta</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[localSettings.inactive_patient_days || 60]}
                        onValueChange={([v]) => updateLocal('inactive_patient_days', v)}
                        min={30}
                        max={180}
                        step={15}
                        className="flex-1"
                      />
                      <Badge variant="outline" className="min-w-[60px] justify-center">
                        {localSettings.inactive_patient_days || 60} dias
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Mensagem</Label>
                    <Textarea
                      value={localSettings.inactive_patient_message || ''}
                      onChange={(e) => updateLocal('inactive_patient_message', e.target.value)}
                      rows={5}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Exclusões</Label>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Excluir pacientes em tratamento ativo</span>
                      <Switch
                        checked={localSettings.inactive_exclude_in_treatment}
                        onCheckedChange={(v) => updateLocal('inactive_exclude_in_treatment', v)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Excluir quem já tem consulta agendada</span>
                      <Switch
                        checked={localSettings.inactive_exclude_scheduled}
                        onCheckedChange={(v) => updateLocal('inactive_exclude_scheduled', v)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Payment Reminder Settings */}
        <AccordionItem value="payment" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-red-500" />
              <div className="text-left">
                <div className="font-semibold flex items-center gap-2">
                  Pagamento
                  {localSettings.payment_reminder_enabled && (
                    <Badge variant="default" className="text-xs">Ativo</Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground font-normal">
                  Lembretes de pagamentos pendentes
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Ativar lembretes de pagamento</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar lembretes para pagamentos pendentes
                  </p>
                </div>
                <Switch
                  checked={localSettings.payment_reminder_enabled}
                  onCheckedChange={(v) => updateLocal('payment_reminder_enabled', v)}
                />
              </div>

              {localSettings.payment_reminder_enabled && (
                <div className="space-y-4 pt-2 pl-4 border-l-2">
                  <div className="space-y-2">
                    <Label>Dias após vencimento</Label>
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      value={localSettings.payment_reminder_days || 7}
                      onChange={(e) => updateLocal('payment_reminder_days', parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Mensagem</Label>
                    <Textarea
                      value={localSettings.payment_reminder_message || ''}
                      onChange={(e) => updateLocal('payment_reminder_message', e.target.value)}
                      rows={6}
                    />
                    <p className="text-xs text-muted-foreground">
                      Variáveis: {'{{payment_amount}}'}, {'{{payment_due_date}}'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Birthday Settings */}
        <AccordionItem value="birthday" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <Cake className="h-5 w-5 text-pink-500" />
              <div className="text-left">
                <div className="font-semibold flex items-center gap-2">
                  Aniversário
                  {localSettings.birthday_enabled && (
                    <Badge variant="default" className="text-xs">Ativo</Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground font-normal">
                  Mensagens de felicitação
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Ativar mensagens de aniversário</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar felicitações automáticas
                  </p>
                </div>
                <Switch
                  checked={localSettings.birthday_enabled}
                  onCheckedChange={(v) => updateLocal('birthday_enabled', v)}
                />
              </div>

              {localSettings.birthday_enabled && (
                <div className="space-y-4 pt-2 pl-4 border-l-2">
                  <div className="space-y-2">
                    <Label>Horário de envio</Label>
                    <Input
                      type="time"
                      value={localSettings.birthday_send_time || '09:00'}
                      onChange={(e) => updateLocal('birthday_send_time', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Mensagem</Label>
                    <Textarea
                      value={localSettings.birthday_message || ''}
                      onChange={(e) => updateLocal('birthday_message', e.target.value)}
                      rows={6}
                    />
                    <p className="text-xs text-muted-foreground">
                      Variáveis: {'{{patient_name}}'}, {'{{clinic_name}}'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* NPS Auto-Response Settings */}
        <AccordionItem value="nps" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <Star className="h-5 w-5 text-yellow-500" />
              <div className="text-left">
                <div className="font-semibold flex items-center gap-2">
                  Respostas NPS
                  {localSettings.nps_auto_response_enabled && (
                    <Badge variant="default" className="text-xs">Ativo</Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground font-normal">
                  Auto-resposta baseada na avaliação
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Ativar auto-resposta NPS</Label>
                  <p className="text-sm text-muted-foreground">
                    Responder automaticamente baseado na nota
                  </p>
                </div>
                <Switch
                  checked={localSettings.nps_auto_response_enabled}
                  onCheckedChange={(v) => updateLocal('nps_auto_response_enabled', v)}
                />
              </div>

              {localSettings.nps_auto_response_enabled && (
                <div className="space-y-6 pt-2">
                  {/* Promoters (9-10) */}
                  <div className="space-y-2 p-4 border rounded-lg bg-green-500/5 border-green-500/20">
                    <Label className="text-base flex items-center gap-2">
                      <Badge className="bg-green-500">9-10</Badge>
                      Promotores
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Agradecer e pedir avaliação no Google
                    </p>
                    <Textarea
                      value={localSettings.nps_promoter_message || ''}
                      onChange={(e) => updateLocal('nps_promoter_message', e.target.value)}
                      rows={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      Variável: {'{{google_review_link}}'}
                    </p>
                  </div>

                  {/* Passives (7-8) */}
                  <div className="space-y-2 p-4 border rounded-lg bg-yellow-500/5 border-yellow-500/20">
                    <Label className="text-base flex items-center gap-2">
                      <Badge className="bg-yellow-500">7-8</Badge>
                      Neutros
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Agradecer e pedir sugestões de melhoria
                    </p>
                    <Textarea
                      value={localSettings.nps_passive_message || ''}
                      onChange={(e) => updateLocal('nps_passive_message', e.target.value)}
                      rows={5}
                    />
                  </div>

                  {/* Detractors (0-6) */}
                  <div className="space-y-2 p-4 border rounded-lg bg-red-500/5 border-red-500/20">
                    <Label className="text-base flex items-center gap-2">
                      <Badge className="bg-red-500">0-6</Badge>
                      Detratores
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Pedir desculpas e solicitar feedback detalhado
                    </p>
                    <Textarea
                      value={localSettings.nps_detractor_message || ''}
                      onChange={(e) => updateLocal('nps_detractor_message', e.target.value)}
                      rows={5}
                    />
                  </div>

                  {/* Alert on detractor */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base">Alertar equipe em caso de detrator</Label>
                      <p className="text-sm text-muted-foreground">
                        Notificar quando receber nota 0-6
                      </p>
                    </div>
                    <Switch
                      checked={localSettings.nps_detractor_alert_enabled}
                      onCheckedChange={(v) => updateLocal('nps_detractor_alert_enabled', v)}
                    />
                  </div>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Reset to Defaults */}
      <div className="pt-4 border-t">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="text-muted-foreground">
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar Padrões
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Restaurar configurações padrão?</AlertDialogTitle>
              <AlertDialogDescription>
                Isso irá resetar todas as configurações de follow-up para os valores originais.
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => resetToDefaults()}>
                Restaurar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
