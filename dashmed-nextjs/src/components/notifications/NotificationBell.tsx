'use client'

import React, { useState } from 'react';
import { Bell, X, CheckCheck, Calendar, ClipboardCheck, Sparkles, MessageSquare, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
    className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return 'Agora';
        if (diffInMinutes < 60) return `${diffInMinutes} min`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
        if (diffInMinutes < 2880) return 'Ontem';
        return `${Math.floor(diffInMinutes / 1440)} dias`;
    };

    const getNotificationConfig = (type: string) => {
        switch (type) {
            case 'task_assigned':
                return {
                    icon: ClipboardCheck,
                    color: 'bg-blue-500',
                    bgLight: 'bg-blue-500/10',
                    textColor: 'text-blue-600'
                };
            case 'task_completed':
                return {
                    icon: Sparkles,
                    color: 'bg-green-500',
                    bgLight: 'bg-green-500/10',
                    textColor: 'text-green-600'
                };
            case 'task_created':
                return {
                    icon: Calendar,
                    color: 'bg-purple-500',
                    bgLight: 'bg-purple-500/10',
                    textColor: 'text-purple-600'
                };
            case 'call_scheduled':
                return {
                    icon: Clock,
                    color: 'bg-orange-500',
                    bgLight: 'bg-orange-500/10',
                    textColor: 'text-orange-600'
                };
            case 'message':
                return {
                    icon: MessageSquare,
                    color: 'bg-cyan-500',
                    bgLight: 'bg-cyan-500/10',
                    textColor: 'text-cyan-600'
                };
            case 'alert':
                return {
                    icon: AlertCircle,
                    color: 'bg-red-500',
                    bgLight: 'bg-red-500/10',
                    textColor: 'text-red-600'
                };
            default:
                return {
                    icon: Bell,
                    color: 'bg-amber-500',
                    bgLight: 'bg-amber-500/10',
                    textColor: 'text-amber-600'
                };
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.read) {
            await markAsRead(notification.id);
        }
        setIsOpen(false);
    };

    return (
        <div className={cn("relative", className)}>
            {/* Bell Button */}
            <div className="relative">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative h-10 w-10 p-0 bg-muted/50 hover:bg-muted border border-border hover:border-primary/30 rounded-xl transition-all duration-200 hover:scale-105"
                >
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    {unreadCount > 0 && (
                        <Badge
                            className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white border-2 border-background shadow-md"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </div>

            {/* Notifications Panel */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Panel */}
                    <Card className="fixed right-4 top-16 w-96 max-w-[calc(100vw-32px)] z-50 shadow-2xl border border-border bg-card/95 backdrop-blur-xl overflow-hidden">
                        {/* Header */}
                        <CardHeader className="pb-3 pt-4 px-4 border-b border-border bg-muted/30">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-primary/10">
                                        <Bell className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold text-foreground">Notificações</h3>
                                        {unreadCount > 0 && (
                                            <p className="text-xs text-muted-foreground">{unreadCount} não lida{unreadCount > 1 ? 's' : ''}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {unreadCount > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={markAllAsRead}
                                            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                                        >
                                            <CheckCheck className="h-4 w-4 mr-1" />
                                            Marcar todas
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsOpen(false)}
                                        className="h-8 w-8 p-0 hover:bg-muted rounded-lg"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                                        <span className="text-sm text-muted-foreground">Carregando...</span>
                                    </div>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="text-center py-12 px-4">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                                        <Bell className="h-8 w-8 text-muted-foreground/50" />
                                    </div>
                                    <p className="text-foreground font-medium mb-1">Tudo em dia!</p>
                                    <p className="text-sm text-muted-foreground">Nenhuma notificação no momento</p>
                                </div>
                            ) : (
                                <ScrollArea className="max-h-[400px]">
                                    <div className="divide-y divide-border">
                                        {notifications.map((notification) => {
                                            const config = getNotificationConfig(notification.type);
                                            const IconComponent = config.icon;

                                            return (
                                                <div
                                                    key={notification.id}
                                                    onClick={() => handleNotificationClick(notification)}
                                                    className={cn(
                                                        "p-4 cursor-pointer transition-all duration-200 group",
                                                        notification.read
                                                            ? "bg-transparent hover:bg-muted/50"
                                                            : "bg-primary/5 hover:bg-primary/10"
                                                    )}
                                                >
                                                    <div className="flex gap-3">
                                                        {/* Icon */}
                                                        <div className={cn(
                                                            "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                                                            config.bgLight
                                                        )}>
                                                            <IconComponent className={cn("h-5 w-5", config.textColor)} />
                                                        </div>

                                                        {/* Content */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <h4 className={cn(
                                                                    "text-sm font-semibold leading-tight",
                                                                    notification.read ? "text-muted-foreground" : "text-foreground"
                                                                )}>
                                                                    {notification.title}
                                                                </h4>
                                                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {formatTime(notification.created_at)}
                                                                    </span>
                                                                    {!notification.read && (
                                                                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <p className={cn(
                                                                "text-sm mt-1 line-clamp-2 leading-relaxed",
                                                                notification.read ? "text-muted-foreground/70" : "text-muted-foreground"
                                                            )}>
                                                                {notification.message}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </ScrollArea>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
