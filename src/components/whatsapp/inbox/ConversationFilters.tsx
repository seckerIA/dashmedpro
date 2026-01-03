/**
 * Filtros para lista de conversas do WhatsApp
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  X,
  Inbox,
  UserCircle,
  Users,
  Settings,
  ChevronDown,
  ChevronUp,
  Clock,
  AlertOctagon,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useWhatsAppLabels } from '@/hooks/useWhatsAppLabels';
import { Loader2, Plus, Tag as TagIcon, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type {
  WhatsAppConversationFilters,
  WhatsAppConversationStatus,
  WhatsAppInboxStats,
} from '@/types/whatsapp';

interface ConversationFiltersProps {
  filters: WhatsAppConversationFilters;
  onFiltersChange: (filters: WhatsAppConversationFilters) => void;
  stats?: WhatsAppInboxStats;
}

const LABEL_COLORS = [
  '#EF4444', // red
  '#F97316', // orange
  '#EAB308', // yellow
  '#22C55E', // green
  '#06B6D4', // cyan
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#EC4899', // pink
];

const ASSIGNEE_OPTIONS: {
  value: string;
  label: string;
  icon: React.ReactNode;
}[] = [
    { value: 'all', label: 'Todos', icon: <Users className="h-4 w-4" /> },
    { value: 'me', label: 'Minhas', icon: <UserCircle className="h-4 w-4" /> },
    { value: 'unassigned', label: 'Não atribuídas', icon: <UserCircle className="h-4 w-4 text-muted-foreground" /> },
  ];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todas', icon: <Inbox className="h-4 w-4" /> },
  { value: 'open', label: 'Abertas', icon: <Clock className="h-3.5 w-3.5" /> },
  { value: 'pending', label: 'Pendentes', icon: <AlertOctagon className="h-3.5 w-3.5" /> },
  { value: 'resolved', label: 'Agendados', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
];

export function ConversationFilters({
  filters,
  onFiltersChange,
  stats,
}: ConversationFiltersProps) {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Labels logic
  const { labels, isLoading: isLoadingLabels, createLabel, isCreating: isCreatingLabel } = useWhatsAppLabels();
  const [isCreatingInline, setIsCreatingInline] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);
  const [isLabelsExpanded, setIsLabelsExpanded] = useState(true);

  // Ordenar labels por nome (A-Z)
  const sortedLabels = [...labels].sort((a, b) => a.name.localeCompare(b.name));

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return;
    await createLabel({
      name: newLabelName.trim(),
      color: newLabelColor
    });
    setNewLabelName('');
    setIsCreatingInline(false);
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  const handleSearchSubmit = () => {
    onFiltersChange({ ...filters, search: searchValue || undefined });
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const handleClearSearch = () => {
    setSearchValue('');
    onFiltersChange({ ...filters, search: undefined });
  };

  const handleStatusChange = (status: WhatsAppConversationStatus | 'all') => {
    onFiltersChange({
      ...filters,
      status: status === 'all' ? undefined : status,
    });
  };

  const handleAssigneeChange = (assignee: string) => {
    onFiltersChange({
      ...filters,
      assignedTo: assignee === 'all' ? undefined : assignee,
    });
  };

  const handleLabelToggle = (labelId: string) => {
    const currentLabels = filters.labelIds || [];
    const isSelected = currentLabels.includes(labelId);

    onFiltersChange({
      ...filters,
      labelIds: isSelected
        ? currentLabels.filter(id => id !== labelId)
        : [...currentLabels, labelId]
    });
  };

  const activeFiltersCount = [
    filters.status,
    filters.assignedTo,
    filters.leadStatus,
    filters.labelIds,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearchValue('');
    onFiltersChange({});
  };

  return (
    <div className="space-y-3 p-3 border-b">
      {/* Header com título e botão de configurações */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Conversas</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/whatsapp/settings')}
          title="Configurações do WhatsApp"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Barra de busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar conversas..."
          value={searchValue}
          onChange={e => handleSearchChange(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          onBlur={handleSearchSubmit}
          className="pl-9 pr-8"
        />
        {searchValue && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3"
            onClick={handleClearSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filtros de Status (Tabs) */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {STATUS_OPTIONS.map(option => {
          const isSelected = (option.value === 'all' && !filters.status) || filters.status === option.value;
          const count =
            option.value === 'open' ? stats?.open_count :
              option.value === 'pending' ? stats?.pending_count :
                option.value === 'resolved' ? stats?.resolved_count :
                  stats?.total_conversations;

          return (
            <Button
              key={option.value}
              variant={isSelected ? 'secondary' : 'ghost'}
              size="sm"
              className={cn(
                "h-9 px-3 gap-2 rounded-lg text-xs font-medium transition-all",
                isSelected ? "bg-primary/10 text-primary hover:bg-primary/15" : "text-muted-foreground hover:bg-muted"
              )}
              onClick={() => handleStatusChange(option.value as any)}
            >
              {option.icon}
              {option.label}
              {count !== undefined && count > 0 && (
                <span className={cn(
                  "ml-1 px-1.5 py-0.5 rounded-full text-[10px]",
                  isSelected ? "bg-primary/20" : "bg-muted-foreground/10"
                )}>
                  {count}
                </span>
              )}
            </Button>
          );
        })}
      </div>

      {/* Seção de Marcadores (Labels) - Única Seção */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between px-2 mb-1">
          <button
            onClick={() => setIsLabelsExpanded(!isLabelsExpanded)}
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            {isLabelsExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
            Marcadores ({sortedLabels.length})
          </button>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] text-muted-foreground hover:text-primary"
                onClick={clearAllFilters}
              >
                Limpar
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:text-primary"
              onClick={() => {
                setIsCreatingInline(!isCreatingInline);
                if (!isLabelsExpanded) setIsLabelsExpanded(true);
              }}
            >
              <Plus className={cn("h-3.5 w-3.5 transition-transform", isCreatingInline && "rotate-45")} />
            </Button>
          </div>
        </div>

        {/* Listagem de Labels - Com Colapso */}
        <div className={cn(
          "flex flex-col gap-1 transition-all duration-300 origin-top overflow-hidden",
          isLabelsExpanded ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className="flex flex-col gap-1 pr-1 custom-scrollbar overflow-y-auto">
            {isLoadingLabels ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground opacity-50" />
              </div>
            ) : labels.length === 0 && !isCreatingInline ? (
              <div className="px-2 py-6 text-center border-2 border-dashed rounded-xl bg-muted/20 border-muted/50 transition-colors hover:bg-muted/30">
                <TagIcon className="h-6 w-6 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-xs text-muted-foreground mb-3 font-medium">Nenhum marcador criado</p>
                <Button size="sm" variant="outline" className="h-8 text-[11px] gap-2 rounded-lg" onClick={() => setIsCreatingInline(true)}>
                  <Plus className="h-3 w-3" />
                  Criar marcador
                </Button>
              </div>
            ) : (
              <>
                {labels.map(label => {
                  const isSelected = filters.labelIds?.includes(label.id);
                  return (
                    <Button
                      key={label.id}
                      variant={isSelected ? 'secondary' : 'ghost'}
                      size="sm"
                      className={cn(
                        'h-10 justify-start gap-4 px-3 transition-all rounded-lg group',
                        isSelected ? 'bg-primary/10 text-primary hover:bg-primary/15' : 'hover:bg-muted/50'
                      )}
                      onClick={() => handleLabelToggle(label.id)}
                    >
                      <div
                        className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                        style={{ backgroundColor: `${label.color}20` }}
                      >
                        <TagIcon className="h-3 w-3" style={{ color: label.color }} />
                      </div>
                      <span className="flex-1 text-left text-sm font-medium truncate" style={{ color: isSelected ? undefined : label.color }}>
                        {label.name}
                      </span>
                      {isSelected && (
                        <div className="flex items-center justify-center w-5 h-5 bg-primary rounded-full animate-in zoom-in duration-200">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </Button>
                  );
                })}
              </>
            )}

            {/* Input para criar nova label inline com Seletor de Cor */}
            {isCreatingInline && (
              <div className="p-3 my-2 space-y-3 bg-muted/40 rounded-xl border border-muted-foreground/10 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-2 mb-1">
                  <TagIcon className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Novo Marcador</span>
                </div>

                <Input
                  placeholder="Ex: Lead Quente, Urgente..."
                  value={newLabelName}
                  onChange={e => setNewLabelName(e.target.value)}
                  autoFocus
                  className="h-9 text-xs bg-background border-none shadow-sm"
                  onKeyDown={e => e.key === 'Enter' && handleCreateLabel()}
                />

                <div className="space-y-2">
                  <span className="text-[9px] font-medium text-muted-foreground px-1">Escolher Cor</span>
                  <div className="grid grid-cols-8 gap-1.5 p-1">
                    {LABEL_COLORS.map(color => (
                      <button
                        key={color}
                        className={cn(
                          'w-5 h-5 rounded-full flex items-center justify-center transition-all hover:scale-125 hover:rotate-12',
                          newLabelColor === color ? 'ring-2 ring-primary ring-offset-2 ring-offset-muted/40 p-0.5' : ''
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewLabelColor(color)}
                      >
                        {newLabelColor === color && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="ghost" className="h-8 flex-1 text-[11px] rounded-lg" onClick={() => setIsCreatingInline(false)}>Cancelar</Button>
                  <Button size="sm" className="h-8 flex-1 text-[11px] rounded-lg shadow-sm" onClick={handleCreateLabel} disabled={isCreatingLabel || !newLabelName.trim()}>
                    {isCreatingLabel ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Salvar Marcador'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Filtros avançados (Atribuição e IA) */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            {/* Dropdown de atribuição */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-[11px] gap-1.5 px-2.5 rounded-lg border-muted-foreground/20">
                  <UserCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  {filters.assignedTo === 'me'
                    ? 'Minhas'
                    : filters.assignedTo === 'unassigned'
                      ? 'Não atribuídas'
                      : 'Atribuição'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">Filtrar por atendente</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {ASSIGNEE_OPTIONS.map(option => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => handleAssigneeChange(option.value)}
                    className={cn(
                      'gap-2 text-sm',
                      (filters.assignedTo === option.value ||
                        (!filters.assignedTo && option.value === 'all')) &&
                      'bg-muted font-medium'
                    )}
                  >
                    {option.icon}
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Popover de filtros extras (IA) */}
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-[11px] gap-1.5 px-2.5 rounded-lg border-muted-foreground/20">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                  Filtros
                  {(filters.leadStatus && filters.leadStatus !== 'all') && (
                    <Badge
                      variant="default"
                      className="h-4 min-w-4 p-0 text-[10px] bg-primary flex items-center justify-center rounded-full"
                    >
                      1
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64 p-4 rounded-xl shadow-xl">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Filtros Avançados</span>
                    {activeFiltersCount > 0 && (
                      <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px]" onClick={clearAllFilters}>Limpar</Button>
                    )}
                  </div>

                  {/* Status da IA (Lead Status) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-foreground/70">Qualificação IA</label>
                      <Badge variant="outline" className="text-[9px] h-4 px-1 rounded bg-primary/5 text-primary border-primary/20">AI Active</Badge>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                      {(['all', 'quente', 'morno', 'frio'] as const).map(
                        status => (
                          <Button
                            key={status}
                            variant={
                              (status === 'all' && !filters.leadStatus) ||
                                filters.leadStatus === status
                                ? 'secondary'
                                : 'ghost'
                            }
                            size="sm"
                            className={cn(
                              "h-9 text-xs justify-start px-3 gap-3 rounded-lg transition-all",
                              status === 'quente' && (filters.leadStatus === 'quente' ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'hover:bg-red-500/5'),
                              status === 'morno' && (filters.leadStatus === 'morno' ? 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20' : 'hover:bg-orange-500/5'),
                              status === 'frio' && (filters.leadStatus === 'frio' ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20' : 'hover:bg-blue-500/5')
                            )}
                            onClick={() =>
                              onFiltersChange({
                                ...filters,
                                leadStatus:
                                  status === 'all' ? undefined : status,
                              })
                            }
                          >
                            <div className={cn(
                              "w-2 h-2 rounded-full shadow-sm",
                              status === 'all' ? 'bg-slate-300' :
                                status === 'quente' ? 'bg-red-500' :
                                  status === 'morno' ? 'bg-orange-500' :
                                    'bg-blue-500'
                            )} />
                            <span className="font-medium">
                              {status === 'all'
                                ? 'Todas as qualificações'
                                : status === 'quente'
                                  ? 'Lead Quente'
                                  : status === 'morno'
                                    ? 'Lead Morno'
                                    : 'Lead Frio'}
                            </span>
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Notificação de não lidas discreta */}
          {stats && stats.unread_messages > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 rounded-full">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-green-600 uppercase tracking-tighter">
                {stats.unread_messages} novas
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
