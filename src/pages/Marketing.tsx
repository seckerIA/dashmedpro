import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Megaphone, Settings, BarChart3, LayoutDashboard, Users, FileText } from "lucide-react";
import { MarketingDashboard } from "@/components/marketing/MarketingDashboard";
import { AdPlatformsIntegration } from "@/components/commercial/AdPlatformsIntegration";
import { AdCampaignsList } from "@/components/commercial/AdCampaignsList";
import { LeadFormsList } from "@/components/marketing/LeadFormsList";
import { MarketingLeadsConversions } from "@/components/marketing/MarketingLeadsConversions";
import { MarketingReports } from "@/components/marketing/MarketingReports";
import { MarketingOnboarding, MarketingHelpCard } from "@/components/marketing/MarketingOnboarding";
import { MetaConnectionGate } from "@/components/marketing/MetaConnectionGate";

export default function Marketing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab") || "dashboard";
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("tab", value);
      return params;
    });
  };

  return (
    <MetaConnectionGate>
      <div className="min-h-screen space-y-6 bg-background pb-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Megaphone className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-card-foreground">Marketing</h1>
              <p className="text-muted-foreground text-sm sm:text-lg">
                Gestão de campanhas de anúncios e estratégias de marketing digital
              </p>
            </div>
          </div>
        </div>

        {/* Onboarding */}
        <MarketingOnboarding />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 gap-2 h-auto p-1 bg-muted/50">
          <TabsTrigger
            value="dashboard"
            className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all duration-200 font-medium py-3"
          >
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger
            value="campaigns"
            className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all duration-200 font-medium py-3"
          >
            <Megaphone className="w-4 h-4 mr-2" />
            Campanhas
          </TabsTrigger>
          <TabsTrigger
            value="forms"
            className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all duration-200 font-medium py-3"
          >
            <FileText className="w-4 h-4 mr-2" />
            Formulários
          </TabsTrigger>
          <TabsTrigger
            value="leads"
            className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all duration-200 font-medium py-3"
          >
            <Users className="w-4 h-4 mr-2" />
            Leads
          </TabsTrigger>
          <TabsTrigger
            value="reports"
            className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all duration-200 font-medium py-3"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Relatórios
          </TabsTrigger>
          <TabsTrigger
            value="integrations"
            className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all duration-200 font-medium py-3"
          >
            <Settings className="w-4 h-4 mr-2" />
            Integrações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <MarketingDashboard />
        </TabsContent>

        <TabsContent value="campaigns" className="mt-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Campanhas de Anúncios</h2>
              <p className="text-sm text-muted-foreground">
                Campanhas sincronizadas das suas contas de anúncio ativas
              </p>
            </div>
            <AdCampaignsList />
          </div>
        </TabsContent>

        <TabsContent value="forms" className="mt-6">
          <LeadFormsList />
        </TabsContent>

        <TabsContent value="leads" className="mt-6">
          <MarketingLeadsConversions />
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <MarketingReports />
        </TabsContent>

        <TabsContent value="integrations" className="mt-6">
          <AdPlatformsIntegration />
        </TabsContent>
        </Tabs>
      </div>
    </MetaConnectionGate>
  );
}

