import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Megaphone, Settings, BarChart3, LayoutDashboard, Users, FileText, Calendar as CalendarIcon } from "lucide-react";
import { MarketingDashboard } from "@/components/marketing/MarketingDashboard";
import { AdPlatformsIntegration } from "@/components/commercial/AdPlatformsIntegration";
import { AdCampaignsList } from "@/components/commercial/AdCampaignsList";
import { LeadFormsList } from "@/components/marketing/LeadFormsList";
import { MarketingLeadsConversions } from "@/components/marketing/MarketingLeadsConversions";
import { MarketingReports } from "@/components/marketing/MarketingReports";
import { MarketingOnboarding } from "@/components/marketing/MarketingOnboarding";
import { MetaConnectionGate } from "@/components/marketing/MetaConnectionGate";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, startOfDay, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";

function clampDateToToday(d: Date): Date {
  const today = startOfDay(new Date());
  const day = startOfDay(d);
  return isAfter(day, today) ? today : day;
}

/** Período de marketing não pode incluir dias futuros (métricas reais só até hoje). */
function clampMarketingDateRange(range: DateRange | undefined): DateRange | undefined {
  if (!range?.from) return range;
  const from = clampDateToToday(range.from);
  // Preserva seleção em dois passos (intervalo): primeiro clique só define `from`.
  if (range.to === undefined) {
    return { from, to: undefined };
  }
  let to = clampDateToToday(range.to);
  if (startOfDay(from) > startOfDay(to)) to = from;
  return { from, to };
}

export default function Marketing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab") || "dashboard";
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  const [dateRange, setDateRange] = useState<DateRange | undefined>(() =>
    clampMarketingDateRange({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    })
  );

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
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Megaphone className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-card-foreground">Marketing</h1>
              <p className="text-muted-foreground text-sm">
                Gestão de campanhas de anúncios e estratégias de marketing digital
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn(
                  "justify-start text-left font-normal w-[240px] bg-card",
                  !dateRange && "text-muted-foreground"
                )}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/y")} -{" "}
                        {format(dateRange.to, "dd/MM/y")}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/y")
                    )
                  ) : (
                    <span>Selecione um período</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="flex border-b border-border">
                  <div className="flex flex-col gap-2 p-3 border-r border-border min-w-[140px] bg-muted/10">
                    <div className="text-xs font-semibold text-muted-foreground mb-1 px-1">Período</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start text-xs font-normal"
                      onClick={() =>
                        setDateRange(
                          clampMarketingDateRange({
                            from: startOfMonth(new Date()),
                            to: endOfMonth(new Date()),
                          })
                        )}
                    >
                      Este mês
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start text-xs font-normal"
                      onClick={() =>
                        setDateRange(
                          clampMarketingDateRange({
                            from: startOfMonth(subMonths(new Date(), 1)),
                            to: endOfMonth(subMonths(new Date(), 1)),
                          })
                        )}
                    >
                      Mês passado
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start text-xs font-normal"
                      onClick={() =>
                        setDateRange(
                          clampMarketingDateRange({
                            from: startOfMonth(subMonths(new Date(), 3)),
                            to: new Date(),
                          })
                        )}
                    >
                      Últimos 3 meses
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start text-xs font-normal"
                      onClick={() =>
                        setDateRange(
                          clampMarketingDateRange({
                            from: startOfMonth(subMonths(new Date(), 6)),
                            to: new Date(),
                          })
                        )}
                    >
                      Últimos 6 meses
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start text-xs font-normal"
                      onClick={() =>
                        setDateRange(
                          clampMarketingDateRange({
                            from: startOfMonth(subMonths(new Date(), 12)),
                            to: new Date(),
                          })
                        )}
                    >
                      Últimos 12 meses
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start text-xs font-normal"
                      onClick={() =>
                        setDateRange(
                          clampMarketingDateRange({
                            from: startOfYear(new Date()),
                            to: endOfYear(new Date()),
                          })
                        )}
                    >
                      Este ano
                    </Button>
                  </div>
                  <div className="p-0">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={(r) => setDateRange(clampMarketingDateRange(r))}
                      disabled={(date) => isAfter(startOfDay(date), startOfDay(new Date()))}
                      numberOfMonths={2}
                      locale={ptBR}
                      className="p-3"
                      toYear={new Date().getFullYear()}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
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

        <TabsContent value="dashboard" className="mt-6 outline-none">
          <MarketingDashboard 
            startDate={dateRange?.from} 
            endDate={dateRange?.to ?? dateRange?.from} 
          />
        </TabsContent>

        <TabsContent value="campaigns" className="mt-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Campanhas de Anúncios</h2>
              <p className="text-sm text-muted-foreground">
                Campanhas sincronizadas das suas contas de anúncio ativas
              </p>
            </div>
            <AdCampaignsList
              startDate={dateRange?.from}
              endDate={dateRange?.to ?? dateRange?.from}
            />
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

