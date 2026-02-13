/**
 * Notas internas da conversa (não visíveis para o paciente)
 */

import { useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  StickyNote,
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useWhatsAppNotes } from '@/hooks/useWhatsAppNotes';
import type { WhatsAppInternalNote } from '@/types/whatsapp';

interface ConversationNotesProps {
  conversationId: string;
}

export function ConversationNotes({ conversationId }: ConversationNotesProps) {
  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    notes,
    isLoading,
    createNote,
    isCreating,
    updateNote,
    isUpdating,
    deleteNote,
    isDeleting,
  } = useWhatsAppNotes({ conversationId });

  const handleCreate = useCallback(async () => {
    if (!newNote.trim()) return;
    await createNote(newNote.trim());
    setNewNote('');
  }, [newNote, createNote]);

  const handleStartEdit = useCallback((note: WhatsAppInternalNote) => {
    setEditingId(note.id);
    setEditContent(note.content);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingId || !editContent.trim()) return;
    await updateNote({ noteId: editingId, content: editContent.trim() });
    setEditingId(null);
    setEditContent('');
  }, [editingId, editContent, updateNote]);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditContent('');
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deletingId) return;
    await deleteNote(deletingId);
    setDeletingId(null);
  }, [deletingId, deleteNote]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <StickyNote className="h-4 w-4 text-yellow-500" />
        <h4 className="text-sm font-medium">Notas internas</h4>
        <span className="text-xs text-muted-foreground">
          ({notes.length})
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        Notas privadas visíveis apenas para a equipe
      </p>

      {/* Input para nova nota */}
      <div className="space-y-2">
        <Textarea
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          placeholder="Adicionar uma nota..."
          className="min-h-[80px] resize-none text-sm"
        />
        <Button
          size="sm"
          onClick={handleCreate}
          disabled={!newNote.trim() || isCreating}
          className="w-full"
        >
          {isCreating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Adicionar nota
        </Button>
      </div>

      {/* Lista de notas */}
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : notes.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhuma nota adicionada
        </p>
      ) : (
        <div className="space-y-3">
          {notes.map(note => (
            <NoteItem
              key={note.id}
              note={note}
              isEditing={editingId === note.id}
              editContent={editContent}
              onEditContentChange={setEditContent}
              onStartEdit={() => handleStartEdit(note)}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={handleCancelEdit}
              onDelete={() => setDeletingId(note.id)}
              isUpdating={isUpdating}
            />
          ))}
        </div>
      )}

      {/* Dialog de confirmação de delete */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover nota?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A nota será permanentemente removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/**
 * Item de nota individual
 */
function NoteItem({
  note,
  isEditing,
  editContent,
  onEditContentChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  isUpdating,
}: {
  note: WhatsAppInternalNote;
  isEditing: boolean;
  editContent: string;
  onEditContentChange: (content: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  isUpdating: boolean;
}) {
  const user = (note as any).user;
  const userName = user?.full_name || user?.email || 'Usuário';
  const userInitials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const timeAgo = note.created_at
    ? formatDistanceToNow(new Date(note.created_at), {
        addSuffix: true,
        locale: ptBR,
      })
    : '';

  return (
    <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={user?.avatar_url || undefined} />
            <AvatarFallback className="text-[10px] bg-yellow-500/20">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium">{userName}</span>
        </div>
        <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={editContent}
            onChange={e => onEditContentChange(e.target.value)}
            className="min-h-[60px] resize-none text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancelEdit}
              disabled={isUpdating}
            >
              <X className="h-3 w-3 mr-1" />
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={onSaveEdit}
              disabled={!editContent.trim() || isUpdating}
            >
              {isUpdating ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Check className="h-3 w-3 mr-1" />
              )}
              Salvar
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm whitespace-pre-wrap">{note.content}</p>

          {/* Actions */}
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onStartEdit}
            >
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-red-500 hover:text-red-600"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
