import { Card, CardContent } from "@/components/ui/card";
import { useCommercialLeads } from "@/hooks/useCommercialLeads";
import { COMMERCIAL_LEAD_STATUS_LABELS } from "@/types/commercial";
import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useMemo } from "react";

export function FunnelBoard() {
  const { leads, updateLead } = useCommercialLeads();

  const leadsByStatus = useMemo(() => {
    const statuses: Array<{ status: string; label: string; leads: typeof leads }> = [
      { status: "new", label: COMMERCIAL_LEAD_STATUS_LABELS.new, leads: [] },
      { status: "contacted", label: COMMERCIAL_LEAD_STATUS_LABELS.contacted, leads: [] },
      { status: "qualified", label: COMMERCIAL_LEAD_STATUS_LABELS.qualified, leads: [] },
      { status: "converted", label: COMMERCIAL_LEAD_STATUS_LABELS.converted, leads: [] },
      { status: "lost", label: COMMERCIAL_LEAD_STATUS_LABELS.lost, leads: [] },
    ];

    leads.forEach(lead => {
      const statusGroup = statuses.find(s => s.status === lead.status);
      if (statusGroup) {
        statusGroup.leads.push(lead);
      }
    });

    return statuses;
  }, [leads]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const leadId = active.id as string;
    const newStatus = over.id as string;

    await updateLead.mutateAsync({
      id: leadId,
      updates: { status: newStatus as any },
    });
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {leadsByStatus.map(statusGroup => (
          <Card key={statusGroup.status} className="bg-gradient-card shadow-card border-border">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4 text-center">
                {statusGroup.label}
                <span className="ml-2 text-sm text-muted-foreground">
                  ({statusGroup.leads.length})
                </span>
              </h3>
              <SortableContext
                items={statusGroup.leads.map(l => l.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {statusGroup.leads.map(lead => (
                    <FunnelLeadItem key={lead.id} lead={lead} />
                  ))}
                </div>
              </SortableContext>
            </CardContent>
          </Card>
        ))}
      </div>
    </DndContext>
  );
}

function FunnelLeadItem({ lead }: { lead: any }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: lead.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-background p-3 rounded-lg border border-border cursor-move hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-2">
        <div {...attributes} {...listeners} className="cursor-grab">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{lead.name}</p>
          {lead.phone && (
            <p className="text-xs text-muted-foreground">{lead.phone}</p>
          )}
        </div>
      </div>
    </div>
  );
}







