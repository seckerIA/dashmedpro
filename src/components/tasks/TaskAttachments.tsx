import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    useTaskAttachments,
    TaskAttachment,
    getFileIcon,
    formatFileSize,
    ALLOWED_FILE_TYPES,
    MAX_FILE_SIZE
} from '@/hooks/useTaskAttachments';
import {
    Paperclip,
    Upload,
    X,
    Download,
    Trash2,
    Loader2,
    FileText,
    Image as ImageIcon,
    File,
    AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskAttachmentsProps {
    taskId?: string;
    isEditing?: boolean;
    onFilesSelected?: (files: File[]) => void;
    pendingFiles?: File[];
    failedFiles?: File[];
    onRemovePendingFile?: (index: number) => void;
    onRemoveFailedFile?: (index: number) => void;
}

export function TaskAttachments({
    taskId,
    isEditing = false,
    onFilesSelected,
    pendingFiles = [],
    failedFiles = [],
    onRemovePendingFile,
    onRemoveFailedFile
}: TaskAttachmentsProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const {
        attachments,
        isLoading,
        uploadAttachment,
        deleteAttachment,
        isUploading,
        isDeleting
    } = useTaskAttachments(taskId);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0 && onFilesSelected) {
            onFilesSelected(files);
        }
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDownload = (attachment: TaskAttachment) => {
        window.open(attachment.file_url, '_blank');
    };

    const handleDelete = async (attachment: TaskAttachment) => {
        if (confirm('Deseja remover este anexo?')) {
            await deleteAttachment(attachment);
        }
    };

    const getFileTypeIcon = (fileType: string) => {
        if (fileType.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
        if (fileType === 'application/pdf') return <FileText className="h-4 w-4" />;
        return <File className="h-4 w-4" />;
    };

    const allFiles: Array<{ type: 'pending' | 'failed'; file: File; index: number } | { type: 'saved'; attachment: TaskAttachment }> = [
        ...pendingFiles.map((f, i) => ({ type: 'pending' as const, file: f, index: i })),
        ...failedFiles.map((f, i) => ({ type: 'failed' as const, file: f, index: i })),
        ...attachments.map(a => ({ type: 'saved' as const, attachment: a }))
    ];

    return (
        <div className="space-y-3">
            {/* Upload Button */}
            {isEditing && (
                <div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept={ALLOWED_FILE_TYPES.join(',')}
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="gap-2"
                    >
                        <Paperclip className="h-4 w-4" />
                        Anexar Arquivo
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                        PDF, DOC, XLS, imagens até 50MB
                    </p>
                </div>
            )}

            {/* Lista de Anexos */}
            {
                allFiles.length > 0 && (
                    <div className="space-y-2">
                        {allFiles.map((item, idx) => {
                            if (item.type === 'pending') {
                                const file = item.file as File;
                                return (
                                    <div
                                        key={`pending-${idx}`}
                                        className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg border border-dashed"
                                    >
                                        <div className="flex-shrink-0 text-muted-foreground">
                                            {getFileTypeIcon(file.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{file.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatFileSize(file.size)} • Aguardando upload
                                            </p>
                                        </div>
                                        {onRemovePendingFile && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => onRemovePendingFile(item.index as number)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                );
                            } else if (item.type === 'failed') {
                                const file = item.file as File;
                                return (
                                    <div
                                        key={`failed-${idx}`}
                                        className="flex items-center gap-3 p-2 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800"
                                    >
                                        <div className="flex-shrink-0 text-red-500">
                                            <AlertCircle className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate text-red-700 dark:text-red-400">{file.name}</p>
                                            <p className="text-xs text-red-600 dark:text-red-500">
                                                Falha no upload
                                            </p>
                                        </div>
                                        {onRemoveFailedFile && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20"
                                                onClick={() => onRemoveFailedFile(item.index as number)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                );
                            } else {
                                const attachment = (item as any).attachment as TaskAttachment;
                                return (
                                    <div
                                        key={attachment.id}
                                        className="flex items-center gap-3 p-2 bg-card rounded-lg border"
                                    >
                                        <div className="flex-shrink-0 text-primary">
                                            {getFileTypeIcon(attachment.file_type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatFileSize(attachment.file_size)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => handleDownload(attachment)}
                                            >
                                                <Download className="h-4 w-4" />
                                            </Button>
                                            {isEditing && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                    onClick={() => handleDelete(attachment)}
                                                    disabled={isDeleting}
                                                >
                                                    {isDeleting ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            }
                        })}
                    </div>
                )
            }

            {/* Loading State */}
            {
                isLoading && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Carregando anexos...</span>
                    </div>
                )
            }
        </div >
    );
}

// Componente compacto para exibir no TaskCard
export function TaskAttachmentsBadge({ taskId }: { taskId: string }) {
    const { attachments, isLoading } = useTaskAttachments(taskId);

    if (isLoading || attachments.length === 0) return null;

    return (
        <Badge variant="outline" className="gap-1 text-xs">
            <Paperclip className="h-3 w-3" />
            {attachments.length}
        </Badge>
    );
}
