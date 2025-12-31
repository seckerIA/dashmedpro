/**
 * Sidebar completa da conversa com info, notas e labels
 */

import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ContactInfo } from './ContactInfo';
import { ConversationNotes } from './ConversationNotes';
import { LabelManager } from './LabelManager';
import type { WhatsAppConversationWithRelations } from '@/types/whatsapp';

interface ConversationSidebarProps {
  conversation: WhatsAppConversationWithRelations;
  onClose?: () => void;
}

export function ConversationSidebar({
  conversation,
  onClose,
}: ConversationSidebarProps) {
  const navigate = useNavigate();

  const handleViewInCRM = () => {
    if (conversation.contact_id) {
      navigate(`/crm/contacts/${conversation.contact_id}`);
    }
  };

  const handleEditContact = () => {
    if (conversation.contact_id) {
      navigate(`/crm/contacts/${conversation.contact_id}/edit`);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="font-medium">Detalhes</h3>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Info do contato */}
          <ContactInfo
            conversation={conversation}
            onEditContact={conversation.contact_id ? handleEditContact : undefined}
            onViewInCRM={conversation.contact_id ? handleViewInCRM : undefined}
          />

          <Separator />

          {/* Labels */}
          <LabelManager conversationId={conversation.id} />

          <Separator />

          {/* Notas internas */}
          <ConversationNotes conversationId={conversation.id} />
        </div>
      </ScrollArea>
    </div>
  );
}
