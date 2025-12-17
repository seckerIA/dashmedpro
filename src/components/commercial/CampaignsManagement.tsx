import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CampaignsList } from "./CampaignsList";
import { CampaignForm } from "./CampaignForm";

export function CampaignsManagement() {
  const [searchParams] = useSearchParams();
  const action = searchParams.get("action");
  const [showCampaignForm, setShowCampaignForm] = useState(action === "new");
  
  useEffect(() => {
    if (action === "new") {
      setShowCampaignForm(true);
    }
  }, [action]);

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Campanhas & Promoções</h2>
        <Button
          onClick={() => setShowCampaignForm(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Campanha
        </Button>
      </div>

      {/* Campaigns List */}
      <CampaignsList />

      {/* Campaign Form Modal */}
      <CampaignForm
        open={showCampaignForm}
        onOpenChange={setShowCampaignForm}
      />
    </div>
  );
}

