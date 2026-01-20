import { ReactNode } from 'react';
import { SuperAdminSidebar } from './SuperAdminSidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, Bell } from 'lucide-react';

interface SuperAdminLayoutProps {
    children: ReactNode;
}

export function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
    const { user, signOut } = useAuth();

    const userEmail = user?.email || '';
    const initials = userEmail.slice(0, 2).toUpperCase();

    return (
        <div className="h-screen flex overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0">
                <SuperAdminSidebar />
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-16 border-b bg-card flex items-center justify-between px-6">
                    <div>
                        <h2 className="text-lg font-semibold">Painel do Administrador</h2>
                        <p className="text-xs text-muted-foreground">Controle total da plataforma</p>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Notifications */}
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-4 w-4" />
                            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                                3
                            </Badge>
                        </Button>

                        {/* User Profile */}
                        <div className="flex items-center gap-3 border-l pl-4">
                            <div className="text-right">
                                <p className="text-sm font-medium">{userEmail}</p>
                                <p className="text-xs text-muted-foreground">Super Admin</p>
                            </div>
                            <Avatar className="h-9 w-9">
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                        </div>

                        {/* Logout */}
                        <Button variant="ghost" size="icon" onClick={signOut}>
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-auto p-6 bg-background">
                    {children}
                </main>
            </div>
        </div>
    );
}
