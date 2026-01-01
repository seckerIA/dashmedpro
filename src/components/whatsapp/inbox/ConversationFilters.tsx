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
  Clock,
  CheckCircle2,
  AlertOctagon,
  UserCircle,
  Users,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

const STATUS_OPTIONS: {
  value: WhatsAppConversationStatus | 'all';
  label: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  { value: 'all', label: 'Todas', icon: <Inbox className="h-4 w-4" />, color: '' },
  { value: 'open', label: 'Abertas', icon: <Inbox className="h-4 w-4" />, color: 'text-green-500' },
  { value: 'pending', label: 'Pendentes', icon: <Clock className="h-4 w-4" />, color: 'text-yellow-500' },
  { value: 'resolved', label: 'Resolvidas', icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-blue-500' },
  { value: 'spam', label: 'Spam', icon: <AlertOctagon className="h-4 w-4" />, color: 'text-red-500' },
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

export function ConversationFilters({
  filters,
  onFiltersChange,
  stats,
}: ConversationFiltersProps) {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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

  const activeFiltersCount = [
    filters.status,
    filters.assignedTo,
    filters.priority,
    filters.labelId,
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

      {/* Filtros rápidos de status */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {STATUS_OPTIONS.map(option => {
          const isActive =
            (option.value === 'all' && !filters.status) ||
            filters.status === option.value;

          // Contagem por status
          let count: number | undefined;
          if (stats) {
            switch (option.value) {
              case 'all':
                count = stats.total_conversations;
                break;
              case 'open':
                count = stats.open_count;
                break;
              case 'pending':
                count = stats.pending_count;
                break;
              case 'resolved':
                count = stats.resolved_count;
                break;
            }
          }

          return (
            <Button
              key={option.value}
              variant={isActive ? 'secondary' : 'ghost'}
              size="sm"
              className={cn(
                'h-8 gap-1.5 flex-shrink-0',
                isActive && 'bg-muted'
              )}
              onClick={() => handleStatusChange(option.value)}
            >
              <span className={option.color}>{option.icon}</span>
              <span>{option.label}</span>
              {count !== undefined && count > 0 && (
                <Badge
                  variant="secondary"
                  className="h-5 min-w-5 px-1.5 text-[10px]"
                >
                  {count}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      {/* Filtros avançados */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Dropdown de atribuição */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <UserCircle className="h-4 w-4 mr-1.5" />
                {filters.assignedTo === 'me'
                  ? 'Minhas'
                  : filters.assignedTo === 'unassigned'
                  ? 'Não atribuídas'
                  : 'Atribuição'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Filtrar por atendente</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ASSIGNEE_OPTIONS.map(option => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => handleAssigneeChange(option.value)}
                  className={cn(
                    'gap-2',
                    (filters.assignedTo === option.value ||
                      (!filters.assignedTo && option.value === 'all')) &&
                      'bg-muted'
                  )}
                >
                  {option.icon}
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Popover de filtros extras */}
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5">
                <Filter className="h-4 w-4" />
                Filtros
                {activeFiltersCount > 0 && (
                  <Badge
                    variant="default"
                    className="h-5 min-w-5 px-1.5 text-[10px] bg-green-500"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64">
              <div className="space-y-4">
                <div className="font-medium text-sm">Filtros avançados</div>

                {/* Prioridade */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">
                    Prioridade
                  </label>
                  <div className="flex gap-1">
                    {(['all', 'urgent', 'high', 'normal', 'low'] as const).map(
                      priority => (
                        <Button
                          key={priority}
                          variant={
                            (priority === 'all' && !filters.priority) ||
                            filters.priority === priority
                              ? 'secondary'
                              : 'outline'
                          }
                          size="sm"
                          className="h-7 text-xs flex-1"
                          onClick={() =>
                            onFiltersChange({
                              ...filters,
                              priority:
                                priority === 'all' ? undefined : priority,
                            })
                          }
                        >
                          {priority === 'all'
                            ? 'Todas'
                            : priority === 'urgent'
                            ? 'Urgente'
                            : priority === 'high'
                            ? 'Alta'
                            : priority === 'normal'
                            ? 'Normal'
                            : 'Baixa'}
                        </Button>
                      )
                    )}
                  </div>
                </div>

                {/* Limpar filtros */}
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={clearAllFilters}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Limpar filtros
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Badge de não lidas */}
        {stats && stats.unread_messages > 0 && (
          <Badge
            variant="default"
            className="bg-green-500 hover:bg-green-500"
          >
            {stats.unread_messages} não lida{stats.unread_messages !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>
    </div>
  );
}
