/**
 * Componente: TemplateManager
 * Gerencia templates de mensagens WhatsApp (listar, criar, deletar, sincronizar)
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  RefreshCw,
  Plus,
  Trash2,
  Loader2,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  MessageSquare,
} from 'lucide-react';
import { useWhatsAppTemplates } from '@/hooks/useWhatsAppTemplates';
import { useWhatsAppConfig } from '@/hooks/useWhatsAppConfig';
import type { WhatsAppTemplate, WhatsAppTemplateCategory, WhatsAppTemplateComponent } from '@/types/whatsapp';

// =========================================
// Status Badge
// =========================================
function TemplateStatusBadge({ status }: { status: string }) {
  if (status === 'approved') {
    return (
      <Badge variant="default" className="bg-green-600 text-xs">
        <CheckCircle className="h-3 w-3 mr-1" />
        Approved
      </Badge>
    );
  }
  if (status === 'rejected') {
    return (
      <Badge variant="destructive" className="text-xs">
        <XCircle className="h-3 w-3 mr-1" />
        Rejected
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-xs">
      <Clock className="h-3 w-3 mr-1" />
      Pending
    </Badge>
  );
}

// =========================================
// Category Badge
// =========================================
function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    MARKETING: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    UTILITY: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    AUTHENTICATION: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  };
  return (
    <Badge variant="outline" className={`text-xs ${colors[category] || ''}`}>
      {category}
    </Badge>
  );
}

// =========================================
// Template Card
// =========================================
function TemplateCard({
  template,
  onDelete,
  isDeleting,
}: {
  template: WhatsAppTemplate;
  onDelete: (id: string, name: string) => void;
  isDeleting: boolean;
}) {
  const bodyComponent = (template.components as WhatsAppTemplateComponent[])?.find(
    (c) => c.type === 'BODY'
  );
  const headerComponent = (template.components as WhatsAppTemplateComponent[])?.find(
    (c) => c.type === 'HEADER'
  );
  const footerComponent = (template.components as WhatsAppTemplateComponent[])?.find(
    (c) => c.type === 'FOOTER'
  );

  return (
    <Card className="border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-2">
            {/* Header */}
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium text-sm truncate">{template.name}</h4>
              <TemplateStatusBadge status={template.status} />
              <CategoryBadge category={template.category} />
              <Badge variant="outline" className="text-xs">
                {template.language}
              </Badge>
            </div>

            {/* Preview */}
            <div className="space-y-1 rounded-lg bg-muted/50 p-3">
              {headerComponent?.text && (
                <p className="text-xs font-semibold text-muted-foreground">
                  {headerComponent.text}
                </p>
              )}
              {bodyComponent?.text && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {bodyComponent.text}
                </p>
              )}
              {footerComponent?.text && (
                <p className="text-xs text-muted-foreground/70 italic">
                  {footerComponent.text}
                </p>
              )}
              {!bodyComponent?.text && !headerComponent?.text && (
                <p className="text-xs text-muted-foreground italic">
                  Sem conteúdo de texto
                </p>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              ID: {template.template_id}
            </p>
          </div>

          {/* Actions */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" disabled={isDeleting}>
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Deletar template &quot;{template.name}&quot;?</AlertDialogTitle>
                <AlertDialogDescription>
                  O template será removido da Meta e do banco local. Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(template.id, template.name)}>
                  Deletar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

// =========================================
// Create Template Form
// =========================================
function CreateTemplateForm({
  onSubmit,
  isSubmitting,
  onCancel,
}: {
  onSubmit: (data: {
    name: string;
    language: string;
    category: WhatsAppTemplateCategory;
    components: WhatsAppTemplateComponent[];
  }) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<WhatsAppTemplateCategory>('UTILITY');
  const [language, setLanguage] = useState('pt_BR');
  const [headerText, setHeaderText] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [footerText, setFooterText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !bodyText.trim()) return;

    const components: WhatsAppTemplateComponent[] = [];

    if (headerText.trim()) {
      components.push({ type: 'HEADER', format: 'TEXT', text: headerText.trim() });
    }

    components.push({ type: 'BODY', text: bodyText.trim() });

    if (footerText.trim()) {
      components.push({ type: 'FOOTER', text: footerText.trim() });
    }

    onSubmit({ name: name.trim(), language, category, components });
  };

  return (
    <Card className="border-2 border-dashed border-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Template
        </CardTitle>
        <CardDescription>
          Crie um template de mensagem para aprovação da Meta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name + Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <Label htmlFor="tpl-name">Nome do Template</Label>
              <Input
                id="tpl-name"
                placeholder="confirmacao_consulta"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Apenas letras, números e underscores
              </p>
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as WhatsAppTemplateCategory)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTILITY">Utility</SelectItem>
                  <SelectItem value="MARKETING">Marketing</SelectItem>
                  <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Idioma</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt_BR">Português (BR)</SelectItem>
                  <SelectItem value="en_US">English (US)</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Header (optional) */}
          <div>
            <Label htmlFor="tpl-header">Header (opcional)</Label>
            <Input
              id="tpl-header"
              placeholder="Ex: Confirmação de Consulta"
              value={headerText}
              onChange={(e) => setHeaderText(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Body (required) */}
          <div>
            <Label htmlFor="tpl-body">
              Corpo da Mensagem <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="tpl-body"
              placeholder={"Olá {{1}}, sua consulta está confirmada para {{2}}.\nEndereço: {{3}}"}
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              rows={4}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use {'{{1}}'}, {'{{2}}'}, etc. para variáveis dinâmicas
            </p>
          </div>

          {/* Footer (optional) */}
          <div>
            <Label htmlFor="tpl-footer">Footer (opcional)</Label>
            <Input
              id="tpl-footer"
              placeholder="Ex: Enviado pelo DashMedPro"
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isSubmitting || !name.trim() || !bodyText.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Template
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// =========================================
// Main: TemplateManager
// =========================================
export function TemplateManager() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const {
    templates,
    isLoading,
    syncTemplates,
    isSyncing,
    createTemplate,
    isCreating,
    deleteTemplate,
    isDeleting,
  } = useWhatsAppTemplates();
  const { isConfigured } = useWhatsAppConfig();

  const handleCreate = async (data: {
    name: string;
    language: string;
    category: WhatsAppTemplateCategory;
    components: WhatsAppTemplateComponent[];
  }) => {
    try {
      await createTemplate(data);
      setShowCreateForm(false);
    } catch {
      // Error handled by mutation's onError callback (toast)
      // Keep form open so user can retry
    }
  };

  const handleDelete = async (templateId: string, templateName: string) => {
    await deleteTemplate({ templateId, templateName });
  };

  // Not configured
  if (!isConfigured) {
    return (
      <Card className="border-dashed border-2 border-muted">
        <CardContent className="py-8 text-center text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Configure o WhatsApp primeiro para gerenciar templates.</p>
          <p className="text-sm mt-1">
            Use a aba &quot;Conexão Rápida&quot; ou &quot;Credenciais&quot;.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Message Templates
              </CardTitle>
              <CardDescription className="mt-1">
                Gerencie templates de mensagem aprovados pela Meta para enviar mensagens proativas
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => syncTemplates()}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                Sincronizar
              </Button>
              <Button
                size="sm"
                onClick={() => setShowCreateForm(true)}
                disabled={showCreateForm}
              >
                <Plus className="h-4 w-4 mr-1" />
                Novo Template
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Create Form */}
      {showCreateForm && (
        <CreateTemplateForm
          onSubmit={handleCreate}
          isSubmitting={isCreating}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Template List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Nenhum template encontrado</p>
            <p className="text-sm mt-1">
              Clique em &quot;Sincronizar&quot; para importar templates da Meta ou crie um novo.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Stats */}
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>{templates.length} template{templates.length !== 1 ? 's' : ''}</span>
            <span className="text-green-500">
              {templates.filter((t) => t.status === 'approved').length} approved
            </span>
            <span className="text-yellow-500">
              {templates.filter((t) => t.status === 'pending').length} pending
            </span>
            <span className="text-red-500">
              {templates.filter((t) => t.status === 'rejected').length} rejected
            </span>
          </div>

          {/* Cards */}
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onDelete={handleDelete}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      )}
    </div>
  );
}
