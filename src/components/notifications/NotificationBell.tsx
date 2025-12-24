import React, { useState } from 'react';
import { Bell, X, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return '📋';
      case 'task_completed':
        return '✅';
      case 'task_created':
        return '🆕';
      default:
        return '🔔';
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
      {/* Bell Button - Card Style */}
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="relative h-12 w-12 p-0 bg-gradient-to-br from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 border-2 border-primary/20 hover:border-primary/30 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 backdrop-blur-sm"
        >
          <Bell className="h-6 w-6 text-primary" />
          {unreadCount > 0 && (
            <>
              {/* Pulsing ring effect */}
              <div className="absolute inset-0 rounded-2xl bg-red-500/20 animate-pulse"></div>
              <Badge 
                className="absolute -top-2 -right-2 h-6 w-6 p-0 flex items-center justify-center text-xs bg-red-500 text-white border-2 border-white shadow-lg animate-bounce"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            </>
          )}
        </Button>
        
        {/* Subtle glow effect when there are notifications */}
        {unreadCount > 0 && (
          <div className="absolute inset-0 rounded-2xl bg-red-500/10 blur-xl opacity-50 animate-pulse -z-10"></div>
        )}
      </div>

      {/* Notifications Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <Card className="fixed right-8 top-20 w-80 max-h-96 z-50 shadow-2xl border border-gray-200 bg-white/95 backdrop-blur-xl dark:bg-gray-900/95 dark:border-gray-700">
            <CardHeader className="pb-3 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notificações
                </CardTitle>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={markAllAsRead}
                      className="h-8 px-3 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <CheckCheck className="h-3 w-3 mr-1" />
                      Limpar tudo
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 p-0 hover:bg-gray-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <Bell className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500 font-medium">Nenhuma notificação</p>
                  <p className="text-sm text-gray-400">Você receberá notificações aqui</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]" type="always">
                  <div className="space-y-1 p-2 pr-4">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={cn(
                          "p-3 rounded-lg cursor-pointer transition-all hover:bg-gray-50 border-l-4",
                          notification.read 
                            ? "border-transparent bg-gray-50/50" 
                            : "border-blue-500 bg-blue-50/30"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-lg flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className={cn(
                                "text-sm font-semibold truncate",
                                notification.read ? "text-gray-600" : "text-gray-900"
                              )}>
                                {notification.title}
                              </h4>
                              <span className="text-xs text-gray-400 flex-shrink-0">
                                {formatTime(notification.created_at)}
                              </span>
                            </div>
                            <p className={cn(
                              "text-sm mt-1 line-clamp-2",
                              notification.read ? "text-gray-500" : "text-gray-700"
                            )}>
                              {notification.message}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                          )}
                        </div>
                      </div>
                    ))}
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

