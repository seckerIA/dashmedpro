import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSalesCalls } from '@/hooks/useSalesCalls';
import { SalesCallForm } from '@/components/calendar/SalesCallForm';
import { DailyCallsList } from '@/components/calendar/DailyCallsList';
import { WeeklyCalendarView } from '@/components/calendar/WeeklyCalendarView';
import { CallDetailsModal } from '@/components/calendar/CallDetailsModal';
import { SalesCallWithRelations, SalesCallStatus } from '@/types/salesCalls';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  List,
  Filter,
  Loader2
} from 'lucide-react';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek,
  endOfWeek,
  addMonths,
  format
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedView, setSelectedView] = useState<'week' | 'list'>('week');
  const [statusFilter, setStatusFilter] = useState<SalesCallStatus | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingCall, setEditingCall] = useState<SalesCallWithRelations | null>(null);
  const [selectedCall, setSelectedCall] = useState<SalesCallWithRelations | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Definir range de datas baseado na visualização com useMemo
  const dateRange = useMemo(() => {
    if (selectedView === 'week') {
      return {
        startDate: startOfWeek(currentDate, { weekStartsOn: 0 }),
        endDate: endOfWeek(currentDate, { weekStartsOn: 0 }),
      };
    } else {
      // Para lista, mostrar próximo mês
      return {
        startDate: new Date(),
        endDate: endOfMonth(addMonths(new Date(), 1)),
      };
    }
  }, [selectedView, currentDate]);
  
  const { calls, isLoading } = useSalesCalls({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const handleNewCall = () => {
    setEditingCall(null);
    setShowForm(true);
  };

  const handleEditCall = (call: SalesCallWithRelations) => {
    setEditingCall(call);
    setShowForm(true);
    setShowDetailsModal(false);
  };

  const handleViewCall = (call: SalesCallWithRelations) => {
    setSelectedCall(call);
    setShowDetailsModal(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingCall(null);
  };

  const scheduledCallsCount = calls.filter(c => c.status === 'scheduled').length;
  const todayCallsCount = calls.filter(c => {
    const callDate = new Date(c.scheduled_at);
    const today = new Date();
    return callDate.toDateString() === today.toDateString() && c.status === 'scheduled';
  }).length;

  return (
    <div className="min-h-screen space-y-6 bg-background pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl border border-primary/20">
            <CalendarIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Calendário</h1>
            <p className="text-sm text-muted-foreground">
              {scheduledCallsCount} calls agendadas · {todayCallsCount} hoje
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select 
            value={statusFilter} 
            onValueChange={(value) => setStatusFilter(value as SalesCallStatus | 'all')}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="scheduled">Agendadas</SelectItem>
              <SelectItem value="completed">Realizadas</SelectItem>
              <SelectItem value="cancelled">Canceladas</SelectItem>
              <SelectItem value="no_show">Não Compareceu</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            onClick={handleNewCall}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Call
          </Button>
        </div>
      </div>

      {/* Current Month/Week Display */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
            </h2>
            <p className="text-sm text-muted-foreground">
              {calls.length} {calls.length === 1 ? 'call' : 'calls'} no período
            </p>
          </div>
        </div>
      </Card>

      {/* Tabs de Visualização */}
      <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as 'week' | 'list')}>
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="week" className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            Semana
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            Lista
          </TabsTrigger>
        </TabsList>

        {/* Visualização Semanal */}
        <TabsContent value="week" className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <WeeklyCalendarView
              calls={calls}
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              onCallClick={handleViewCall}
            />
          )}
        </TabsContent>

        {/* Visualização Lista */}
        <TabsContent value="list" className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <DailyCallsList
              calls={calls}
              onEditCall={handleEditCall}
              onViewCall={handleViewCall}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Floating Action Button - Mobile */}
      <Button
        onClick={handleNewCall}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg sm:hidden z-50"
        size="icon"
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Modals */}
      <SalesCallForm
        open={showForm}
        onOpenChange={handleFormClose}
        editCall={editingCall}
      />

      <CallDetailsModal
        call={selectedCall}
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
        onEdit={handleEditCall}
      />
    </div>
  );
}

