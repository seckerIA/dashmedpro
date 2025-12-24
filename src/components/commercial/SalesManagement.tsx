import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ProceduresCatalog } from "./ProceduresCatalog";
import { SalesList } from "./SalesList";
import { SaleForm } from "./SaleForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SalesManagement() {
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [activeTab, setActiveTab] = useState("procedures");

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Vendas & Procedimentos</h2>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="procedures">Catálogo de Procedimentos</TabsTrigger>
          <TabsTrigger value="sales">Vendas</TabsTrigger>
        </TabsList>

        <TabsContent value="procedures" className="mt-6">
          <ProceduresCatalog />
        </TabsContent>

        <TabsContent value="sales" className="mt-6">
          <SalesList />
        </TabsContent>
      </Tabs>

      {/* Sale Form Modal */}
      <SaleForm
        open={showSaleForm}
        onOpenChange={setShowSaleForm}
      />
    </div>
  );
}












