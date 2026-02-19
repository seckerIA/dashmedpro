import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface VisionCardProps {
    children: ReactNode;
    className?: string;
    title?: string;
    action?: ReactNode;
}

export function VisionCard({ children, className, title, action }: VisionCardProps) {
    return (
        <div className={cn(
            "relative rounded-2xl border border-border bg-card shadow-sm overflow-hidden transition-all duration-300",
            className
        )}>
            {(title || action) && (
                <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-2">
                        {title && <h3 className="font-semibold text-lg tracking-tight text-foreground">{title}</h3>}
                    </div>
                    {action && <div>{action}</div>}
                </div>
            )}
            <div className="p-4 md:p-6 text-card-foreground">
                {children}
            </div>
        </div>
    );
}
