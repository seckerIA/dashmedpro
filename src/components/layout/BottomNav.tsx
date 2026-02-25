import { Home, Calendar, MessageCircle, Users, Menu, MoreHorizontal } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";
import { AppSidebar } from "./AppSidebar";

const navItems = [
  { icon: Home, label: "Início", path: "/dashboard" },
  { icon: Calendar, label: "Agenda", path: "/calendar" },
  { icon: MessageCircle, label: "WhatsApp", path: "/whatsapp" },
  { icon: Users, label: "CRM", path: "/crm" },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t border-border" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full min-h-[48px] gap-1 transition-colors rounded-lg active:bg-muted",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
              <span className={cn(
                "text-[10px]",
                isActive ? "font-semibold" : "font-medium"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button
              className="flex flex-col items-center justify-center flex-1 h-full min-h-[48px] gap-1 text-muted-foreground transition-colors rounded-lg active:bg-muted"
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-[10px] font-medium">Mais</span>
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Menu de navegação</SheetTitle>
            </SheetHeader>
            <AppSidebar isCollapsed={false} onNavigate={() => setSheetOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
