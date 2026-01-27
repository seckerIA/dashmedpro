'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface VisionCardProps {
    children: ReactNode;
    className?: string;
    title?: string;
    action?: ReactNode;
}

export function VisionCard({ children, className, title, action }: VisionCardProps) {
    return (
        <div className={cn(
            'relative rounded-2xl border border-white/5 bg-black/40 backdrop-blur-xl shadow-card overflow-hidden transition-all duration-300 hover:border-white/10',
            className
        )}>
            {(title || action) && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                    {title && <h3 className="font-semibold text-lg tracking-tight text-foreground">{title}</h3>}
                    {action && <div>{action}</div>}
                </div>
            )}
            <div className="p-6 text-card-foreground">
                {children}
            </div>
        </div>
    );
}
