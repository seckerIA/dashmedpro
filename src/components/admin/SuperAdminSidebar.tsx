import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Building2,
    Users,
    DollarSign,
    Activity,
    Settings,
    FileText,
    Database,
    Shield
} from 'lucide-react';

const menuItems = [
    {
        title: 'PRINCIPAL',
        items: [
            { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
            { name: 'Clínicas', icon: Building2, path: '/admin/clinicas' },
            { name: 'Usuários', icon: Users, path: '/admin/usuarios' },
        ]
    },
    {
        title: 'GESTÃO SAAS',
        items: [
            { name: 'Financeiro', icon: DollarSign, path: '/admin/financeiro' },
            { name: 'Métricas', icon: Activity, path: '/admin/metricas' },
            { name: 'Logs', icon: FileText, path: '/admin/logs' },
        ]
    },
    {
        title: 'SISTEMA',
        items: [
            { name: 'Banco de Dados', icon: Database, path: '/admin/database' },
            { name: 'Segurança', icon: Shield, path: '/admin/seguranca' },
            { name: 'Configurações', icon: Settings, path: '/admin/configuracoes' },
        ]
    }
];

export function SuperAdminSidebar() {
    const location = useLocation();

    return (
        <div className="h-full flex flex-col border-r bg-card">
            {/* Logo */}
            <div className="p-6 border-b">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                        <Shield className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg">Super Admin</h1>
                        <p className="text-xs text-muted-foreground">Gestão de Plataforma</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4">
                <div className="space-y-6">
                    {menuItems.map((section) => (
                        <div key={section.title}>
                            <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                {section.title}
                            </h3>
                            <div className="space-y-1">
                                {section.items.map((item) => {
                                    const isActive = location.pathname === item.path;
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                                isActive
                                                    ? "bg-primary text-primary-foreground"
                                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                            )}
                                        >
                                            <item.icon className="h-4 w-4" />
                                            {item.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </nav>
        </div>
    );
}
