import { DashboardWrapper } from '@/components/dashboard/DashboardWrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Dashboard | DashMed Pro',
    description: 'Painel de controle médico',
};

export default function DashboardPage() {
    return (
        <div className="flex-1 h-[calc(100vh-4rem)] overflow-hidden bg-background">
            <DashboardWrapper />
        </div>
    );
}
