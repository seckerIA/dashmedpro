import { Button } from '@/components/ui/button';

interface EmptyStateProps {
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    icon?: React.ReactNode;
}

export function EmptyState({
    title,
    description,
    actionLabel,
    onAction,
    icon
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            {icon && (
                <div className="mb-4 text-muted-foreground opacity-50">
                    {icon}
                </div>
            )}
            <h3 className="text-lg font-semibold mb-2 text-foreground">
                {title}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
                {description}
            </p>
            {actionLabel && onAction && (
                <Button onClick={onAction} size="lg">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
