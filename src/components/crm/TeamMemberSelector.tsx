import { useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Users, Eye, ChevronDown, X } from 'lucide-react';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useUserProfile } from '@/hooks/useUserProfile';
import { cn } from '@/lib/utils';

interface TeamMemberSelectorProps {
  viewAllMode: boolean;
  selectedUserIds: string[];
  currentUserId: string;
  onViewAllModeChange: (enabled: boolean) => void;
  onSelectedUserIdsChange: (userIds: string[]) => void;
}

export function TeamMemberSelector({
  viewAllMode,
  selectedUserIds,
  currentUserId,
  onViewAllModeChange,
  onSelectedUserIdsChange,
}: TeamMemberSelectorProps) {
  const { profile } = useUserProfile();
  const { teamMembers, isLoading } = useTeamMembers();

  // Salvar no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem('crm_view_all_mode', JSON.stringify(viewAllMode));
  }, [viewAllMode]);

  useEffect(() => {
    if (selectedUserIds.length > 0) {
      localStorage.setItem('crm_selected_user_ids', JSON.stringify(selectedUserIds));
    } else {
      localStorage.removeItem('crm_selected_user_ids');
    }
  }, [selectedUserIds]);

  // Se não é admin nem dono, não renderiza o componente
  if (!profile || (profile.role !== 'admin' && profile.role !== 'dono')) {
    return null;
  }

  const handleToggleChange = (checked: boolean) => {
    onViewAllModeChange(checked);
    if (checked) {
      // Quando ativa, inclui automaticamente o usuário atual
      onSelectedUserIdsChange([currentUserId]);
    } else {
      // Quando desativa, limpa seleção
      onSelectedUserIdsChange([]);
    }
  };

  const handleToggleMember = (memberId: string) => {
    if (selectedUserIds.includes(memberId)) {
      // Não permite remover a si mesmo
      if (memberId === currentUserId && selectedUserIds.length === 1) {
        return;
      }
      // Remove o membro
      onSelectedUserIdsChange(selectedUserIds.filter(id => id !== memberId));
    } else {
      // Adiciona o membro
      onSelectedUserIdsChange([...selectedUserIds, memberId]);
    }
  };

  const handleSelectAll = () => {
    onSelectedUserIdsChange(teamMembers.map(m => m.id));
  };

  const handleClearSelection = () => {
    // Mantém apenas o usuário atual
    onSelectedUserIdsChange([currentUserId]);
  };

  const selectedMembers = teamMembers.filter(m => selectedUserIds.includes(m.id));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <Card className="flex items-center gap-3 px-4 py-2 border-2">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <Label htmlFor="view-all-mode" className="text-sm font-medium cursor-pointer">
              Visualizar CRM da Equipe
            </Label>
          </div>
          <Switch
            id="view-all-mode"
            checked={viewAllMode}
            onCheckedChange={handleToggleChange}
          />
        </Card>

        {viewAllMode && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-[280px] justify-between border-2" disabled={isLoading}>
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {selectedUserIds.length === 0 ? 'Selecione membros' : `${selectedUserIds.length} selecionado(s)`}
                </span>
                <ChevronDown className="w-4 h-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0" align="start">
              <div className="p-4 border-b space-y-2">
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleSelectAll}
                  >
                    Selecionar Todos
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleClearSelection}
                  >
                    Limpar Seleção
                  </Button>
                </div>
              </div>
              <div className="max-h-[300px] overflow-y-auto p-2">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-accent",
                      selectedUserIds.includes(member.id) && "bg-accent/50"
                    )}
                    onClick={() => handleToggleMember(member.id)}
                  >
                    <Checkbox
                      checked={selectedUserIds.includes(member.id)}
                      onCheckedChange={() => handleToggleMember(member.id)}
                    />
                    <div className="flex-1 flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {member.full_name || member.email}
                      </span>
                      {member.id === currentUserId && (
                        <Badge variant="outline" className="text-xs">
                          Você
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Badges dos membros selecionados */}
      {viewAllMode && selectedMembers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedMembers.map((member) => (
            <Badge 
              key={member.id} 
              variant="secondary" 
              className="px-3 py-1 flex items-center gap-2"
            >
              <span>{member.full_name || member.email}</span>
              {member.id !== currentUserId && (
                <X 
                  className="w-3 h-3 cursor-pointer hover:text-destructive" 
                  onClick={() => handleToggleMember(member.id)}
                />
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

