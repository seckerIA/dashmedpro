'use client';

/**
 * Página CRM - Gestão de Relacionamento com Clientes
 * Inclui: Dashboard, Pipeline, Leads, Vendas, Campanhas e Relatórios
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    Target,
    TrendingUp,
    ShoppingCart,
    Megaphone,
    BarChart3,
    Workflow,
    Brain,
    Loader2,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserProfile } from '@/hooks/useUserProfile';

// Components
import { PipelineTab } from '@/components/crm/tabs/PipelineTab';
import { DoctorDashboard } from '@/components/dashboard/DoctorDashboard';
import { LeadsTab } from '@/components/crm/tabs/LeadsTab';
import { SalesTab } from '@/components/crm/tabs/SalesTab';
import { CampaignsTab } from '@/components/crm/tabs/CampaignsTab';
import { ReportsTab } from '@/components/crm/tabs/ReportsTab';

export default function CRMPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isSecretaria, isLoading: isLoadingProfile } = useUserProfile();

    const tabFromUrl = searchParams.get('tab') || 'pipeline';
    const [activeTab, setActiveTab] = useState(tabFromUrl);

    // Sync tab from URL
    useEffect(() => {
        if (tabFromUrl) {
            setActiveTab(tabFromUrl);
        }
    }, [tabFromUrl]);

    // Redireciona secretária se tentar acessar tab de inteligência
    useEffect(() => {
        if (isSecretaria && activeTab === 'intelligence') {
            setActiveTab('dashboard');
            router.replace('/crm?tab=dashboard');
        }
    }, [isSecretaria, activeTab, router]);

    const handleTabChange = (nextTab: string) => {
        setActiveTab(nextTab);
        router.push(`/crm?tab=${nextTab}`);
    };

    if (isLoadingProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="min-h-screen space-y-6 bg-background pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3">
                        <Target className="h-8 w-8 text-white drop-shadow-glow" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-card-foreground">CRM</h1>
                        <p className="text-muted-foreground text-sm sm:text-lg">
                            Gestão de vendas e relacionamento com clientes
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 gap-2 h-auto p-1 bg-muted/50">
                    <TabsTrigger
                        value="pipeline"
                        className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all duration-200 font-medium py-3"
                    >
                        <Workflow className="w-4 h-4 mr-2" />
                        Pipeline
                    </TabsTrigger>
                    <TabsTrigger
                        value="dashboard"
                        className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all duration-200 font-medium py-3"
                    >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Dashboard
                    </TabsTrigger>
                    <TabsTrigger
                        value="leads"
                        className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all duration-200 font-medium py-3"
                    >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Leads
                    </TabsTrigger>
                    <TabsTrigger
                        value="sales"
                        className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all duration-200 font-medium py-3"
                    >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Vendas
                    </TabsTrigger>
                    <TabsTrigger
                        value="campaigns"
                        className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all duration-200 font-medium py-3"
                    >
                        <Megaphone className="w-4 h-4 mr-2" />
                        Campanhas
                    </TabsTrigger>
                    <TabsTrigger
                        value="reports"
                        className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all duration-200 font-medium py-3"
                    >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Relatórios
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="pipeline" className="mt-6">
                    <PipelineTab />
                </TabsContent>

                <TabsContent value="dashboard" className="mt-6">
                    <DoctorDashboard />
                </TabsContent>

                <TabsContent value="leads" className="mt-6">
                    <LeadsTab />
                </TabsContent>

                <TabsContent value="sales" className="mt-6">
                    <SalesTab />
                </TabsContent>

                <TabsContent value="campaigns" className="mt-6">
                    <CampaignsTab />
                </TabsContent>

                <TabsContent value="reports" className="mt-6">
                    <ReportsTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
