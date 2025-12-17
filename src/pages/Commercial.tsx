import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, TrendingUp, ShoppingCart, Megaphone, BarChart3 } from "lucide-react";
import { CommercialDashboard } from "@/components/commercial/CommercialDashboard";
import { LeadsManagement } from "@/components/commercial/LeadsManagement";
import { SalesManagement } from "@/components/commercial/SalesManagement";
import { CampaignsManagement } from "@/components/commercial/CampaignsManagement";
import { CommercialReports } from "@/components/commercial/CommercialReports";

export default function Commercial() {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab") || "dashboard";
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  
  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  return (
    <div className="min-h-screen space-y-6 bg-background pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Target className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-card-foreground">Comercial</h1>
            <p className="text-muted-foreground text-sm sm:text-lg">Gestão de vendas e relacionamento com clientes</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 gap-2 h-auto p-1 bg-muted/50">
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
            Leads & Conversões
          </TabsTrigger>
          <TabsTrigger
            value="sales"
            className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all duration-200 font-medium py-3"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Vendas & Procedimentos
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

        <TabsContent value="dashboard" className="mt-6">
          <CommercialDashboard />
        </TabsContent>

        <TabsContent value="leads" className="mt-6">
          <LeadsManagement />
        </TabsContent>

        <TabsContent value="sales" className="mt-6">
          <SalesManagement />
        </TabsContent>

        <TabsContent value="campaigns" className="mt-6">
          <CampaignsManagement />
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <CommercialReports />
        </TabsContent>
      </Tabs>
    </div>
  );
}

