/**
 * Informações do contato na sidebar do chat
 */

import { useState } from 'react';
import {
  Phone,
  Mail,
  User,
  Calendar,
  ExternalLink,
  Copy,
  Check,
  Edit2,
  Building2,
  CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CONVERSATION_STATUS_CONFIG, PRIORITY_CONFIG } from '@/types/whatsapp';
import type { WhatsAppConversationWithRelations } from '@/types/whatsapp';

interface ContactInfoProps {
  conversation: WhatsAppConversationWithRelations;
  onEditContact?: () => void;
  onViewInCRM?: () => void;
}

export function ContactInfo({
  conversation,
  onEditContact,
  onViewInCRM,
}: ContactInfoProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const contact = conversation.contact;
  const displayName =
    conversation.contact_name ||
    contact?.name ||
    conversation.phone_number;
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const statusConfig = CONVERSATION_STATUS_CONFIG[conversation.status];
  const priorityConfig = PRIORITY_CONFIG[conversation.priority];

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header com avatar e nome */}
      <div className="text-center">
        <Avatar className="h-20 w-20 mx-auto mb-3">
          <AvatarImage
            src={
              conversation.contact_profile_picture ||
              contact?.avatar_url ||
              undefined
            }
          />
          <AvatarFallback className="bg-green-500/10 text-green-600 text-2xl font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>

        <h3 className="font-semibold text-lg">{displayName}</h3>

        {/* Status badges */}
        <div className="flex items-center justify-center gap-2 mt-2">
          {statusConfig && (
            <Badge variant="secondary" className={statusConfig.color}>
              {statusConfig.label}
            </Badge>
          )}
          {priorityConfig && conversation.priority !== 'normal' && (
            <Badge variant="outline" className={priorityConfig.color}>
              {priorityConfig.label}
            </Badge>
          )}
        </div>

        {/* Link para CRM */}
        {contact && (
          <Button
            variant="link"
            size="sm"
            className="mt-2 text-green-600"
            onClick={onViewInCRM}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Ver no CRM
          </Button>
        )}
      </div>

      <Separator />

      {/* Informações de contato */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">
          Informações de contato
        </h4>

        {/* Telefone */}
        <InfoRow
          icon={<Phone className="h-4 w-4" />}
          label="Telefone"
          value={conversation.phone_number}
          onCopy={() => handleCopy(conversation.phone_number, 'phone')}
          copied={copiedField === 'phone'}
        />

        {/* Email */}
        {contact?.email && (
          <InfoRow
            icon={<Mail className="h-4 w-4" />}
            label="Email"
            value={contact.email}
            onCopy={() => handleCopy(contact.email!, 'email')}
            copied={copiedField === 'email'}
          />
        )}

        {/* Atribuído para */}
        {conversation.assigned_to_profile && (
          <InfoRow
            icon={<User className="h-4 w-4" />}
            label="Atribuído"
            value={
              conversation.assigned_to_profile.full_name ||
              conversation.assigned_to_profile.email ||
              'Atendente'
            }
          />
        )}
      </div>

      {/* Informações do paciente (se vinculado ao CRM) */}
      {contact && (
        <>
          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-muted-foreground">
                Dados do paciente
              </h4>
              {onEditContact && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={onEditContact}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Convênio */}
            {contact.health_insurance_type && (
              <InfoRow
                icon={<CreditCard className="h-4 w-4" />}
                label="Convênio"
                value={
                  contact.health_insurance_type === 'particular'
                    ? 'Particular'
                    : contact.health_insurance_type === 'convenio'
                    ? 'Convênio'
                    : contact.health_insurance_type
                }
              />
            )}

            {/* Data de nascimento */}
            {contact.birth_date && (
              <InfoRow
                icon={<Calendar className="h-4 w-4" />}
                label="Nascimento"
                value={new Date(contact.birth_date).toLocaleDateString('pt-BR')}
              />
            )}
          </div>
        </>
      )}

      {/* Metadados da conversa */}
      <Separator />

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">
          Sobre a conversa
        </h4>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Criada em</p>
            <p>
              {conversation.created_at
                ? new Date(conversation.created_at).toLocaleDateString('pt-BR')
                : '-'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Última mensagem</p>
            <p>
              {conversation.last_message_at
                ? new Date(conversation.last_message_at).toLocaleDateString('pt-BR')
                : '-'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Linha de informação com ícone
 */
function InfoRow({
  icon,
  label,
  value,
  onCopy,
  copied,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onCopy?: () => void;
  copied?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-muted-foreground">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm truncate">{value}</p>
      </div>
      {onCopy && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 flex-shrink-0"
                onClick={onCopy}
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{copied ? 'Copiado!' : 'Copiar'}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
