'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface VisionMetricCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: string;
        direction: 'up' | 'down' | 'neutral';
    };
    description?: string;
    variant?: 'purple' | 'cyan' | 'orange' | 'green' | 'blue' | 'pink';
    className?: string;
}

export function VisionMetricCard({
    title,
    value,
    icon: Icon,
    trend,
    description,
    variant = 'blue',
    className,
}: VisionMetricCardProps) {

    const variants = {
        purple: {
            border: 'border-purple-500/20',
            iconBg: 'bg-purple-500/10',
            iconColor: 'text-purple-400',
            shadow: 'hover:shadow-purple-500/10',
            gradient: 'from-purple-500/20 to-transparent',
        },
        cyan: {
            border: 'border-cyan-500/20',
            iconBg: 'bg-cyan-500/10',
            iconColor: 'text-cyan-400',
            shadow: 'hover:shadow-cyan-500/10',
            gradient: 'from-cyan-500/20 to-transparent',
        },
        orange: {
            border: 'border-orange-500/20',
            iconBg: 'bg-orange-500/10',
            iconColor: 'text-orange-400',
            shadow: 'hover:shadow-orange-500/10',
            gradient: 'from-orange-500/20 to-transparent',
        },
        green: {
            border: 'border-emerald-500/20',
            iconBg: 'bg-emerald-500/10',
            iconColor: 'text-emerald-400',
            shadow: 'hover:shadow-emerald-500/10',
            gradient: 'from-emerald-500/20 to-transparent',
        },
        blue: {
            border: 'border-blue-500/20',
            iconBg: 'bg-blue-500/10',
            iconColor: 'text-blue-400',
            shadow: 'hover:shadow-blue-500/10',
            gradient: 'from-blue-500/20 to-transparent',
        },
        pink: {
            border: 'border-pink-500/20',
            iconBg: 'bg-pink-500/10',
            iconColor: 'text-pink-400',
            shadow: 'hover:shadow-pink-500/10',
            gradient: 'from-pink-500/20 to-transparent',
        },
    };

    const style = variants[variant] || variants.blue;

    return (
        <Card
            className={cn(
                'relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1',
                'bg-black/40 backdrop-blur-xl border border-white/5',
                // Remove existing heavy borders, rely on internal glow/gradients
                // style.border, 
                // Add specific shadow based on variant
                style.shadow,
                className
            )}
        >
            {/* Gradient Background Effect */}
            <div className={cn("absolute inset-0 opacity-10 pointer-events-none bg-gradient-to-br", style.gradient)} />

            {/* Top Glow Line */}
            <div className={cn("absolute top-0 left-0 right-0 h-[1px] opacity-50 bg-gradient-to-r from-transparent via-current to-transparent", style.iconColor)} />
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className={cn('p-3 rounded-xl transition-colors', style.iconBg)}>
                        <Icon className={cn('w-6 h-6', style.iconColor)} />
                    </div>
                    {trend && (
                        <div className={cn(
                            'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold',
                            trend.direction === 'up' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                trend.direction === 'down' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                        )}>
                            {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '•'} {trend.value}
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">{value}</h2>
                    </div>
                    {description && (
                        <p className="text-xs text-muted-foreground mt-1 font-normal">
                            {description}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
