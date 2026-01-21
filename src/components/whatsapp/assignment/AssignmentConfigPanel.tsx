/**
 * Painel de configuração de atribuição automática
 * Usado nas configurações do WhatsApp
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Users,
    Settings2,
    Trash2,
    User,
    Loader2,
} from 'lucide-react';
import { useWhatsAppAssignment } from '@/hooks/useWhatsAppAssignment';
import { useSecretaryDoctorLinks } from '@/hooks/useSecretaryDoctors';
import { useAuth } from '@/hooks/useAuth';

export function AssignmentConfigPanel() {
    const { user } = useAuth();
    const {
        config,
        isLoadingConfig,
        updateConfig,
        isUpdatingConfig,
        pool,
        isLoadingPool,
        addToPool,
        removeFromPool,
        updatePoolMember,
    } = useWhatsAppAssignment();

    const { allLinks } = useSecretaryDoctorLinks();
    const [isAddingSecretary, setIsAddingSecretary] = useState(false);

    // Secretárias vinculadas que ainda não estão no pool
    const linkedSecretaries = allLinks.filter(
        link => link.doctor_id === user?.id
    );
    const availableToAdd = linkedSecretaries.filter(
        link => !pool.find(p => p.secretary_id === link.secretary_id)
    );

    const handleAddSecretary = async (secretaryId: string) => {
        setIsAddingSecretary(true);
        try {
            await addToPool({ secretaryId });
        } finally {
            setIsAddingSecretary(false);
        }
    };

    if (isLoadingConfig) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Configurações Gerais */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings2 className="h-5 w-5" />
                        Configurações de Atribuição
                    </CardTitle>
                    <CardDescription>
                        Configure como as conversas serão distribuídas entre as secretárias
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Modo de Atribuição */}
                    <div className="space-y-2">
                        <Label>Modo de Atribuição</Label>
                        <Select
                            value={config?.assignment_mode || 'manual'}
                            onValueChange={(value: 'manual' | 'round_robin' | 'weighted') =>
                                updateConfig({ assignment_mode: value })
                            }
                            disabled={isUpdatingConfig}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="manual">
                                    <div className="flex flex-col">
                                        <span>Manual</span>
                                        <span className="text-xs text-muted-foreground">
                                            Atribua conversas manualmente
                                        </span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="round_robin">
                                    <div className="flex flex-col">
                                        <span>Round-Robin</span>
                                        <span className="text-xs text-muted-foreground">
                                            Distribui igualmente entre secretárias
                                        </span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="weighted">
                                    <div className="flex flex-col">
                                        <span>Round-Robin Ponderado</span>
                                        <span className="text-xs text-muted-foreground">
                                            Distribui baseado no peso de cada secretária
                                        </span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Auto-atribuir novas conversas */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Atribuir Automaticamente</Label>
                            <p className="text-xs text-muted-foreground">
                                Novas conversas são atribuídas automaticamente
                            </p>
                        </div>
                        <Switch
                            checked={config?.auto_assign_new_conversations || false}
                            onCheckedChange={(checked) =>
                                updateConfig({ auto_assign_new_conversations: checked })
                            }
                            disabled={config?.assignment_mode === 'manual' || isUpdatingConfig}
                        />
                    </div>

                    {/* Notificar ao atribuir */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Notificar Secretária</Label>
                            <p className="text-xs text-muted-foreground">
                                Envia notificação quando uma conversa é atribuída
                            </p>
                        </div>
                        <Switch
                            checked={config?.notify_on_assignment !== false}
                            onCheckedChange={(checked) =>
                                updateConfig({ notify_on_assignment: checked })
                            }
                            disabled={isUpdatingConfig}
                        />
                    </div>

                    {/* Limite por secretária */}
                    <div className="space-y-2">
                        <Label>Limite de Conversas por Secretária</Label>
                        <p className="text-xs text-muted-foreground">
                            Máximo de conversas abertas simultâneas
                        </p>
                        <Input
                            type="number"
                            min={1}
                            max={200}
                            value={config?.max_open_per_secretary || 50}
                            onChange={(e) =>
                                updateConfig({ max_open_per_secretary: parseInt(e.target.value) })
                            }
                            className="w-24"
                            disabled={isUpdatingConfig}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Pool de Secretárias */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Pool de Secretárias
                    </CardTitle>
                    <CardDescription>
                        Secretárias disponíveis para receber conversas
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingPool ? (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                    ) : pool.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Nenhuma secretária no pool</p>
                            <p className="text-xs">Adicione secretárias para habilitar a atribuição automática</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pool.map((member) => (
                                <div
                                    key={member.id}
                                    className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                                >
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={member.secretary?.avatar_url || undefined} />
                                        <AvatarFallback>
                                            {member.secretary?.full_name?.[0] || <User className="h-4 w-4" />}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">
                                            {member.secretary?.full_name || member.secretary?.email}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Badge variant="secondary" className="text-xs">
                                                {member.total_assigned} atribuídas
                                            </Badge>
                                            {!member.is_available && (
                                                <Badge variant="outline" className="text-xs text-orange-600">
                                                    Indisponível
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Peso (apenas se weighted) */}
                                    {config?.assignment_mode === 'weighted' && (
                                        <div className="flex items-center gap-2 w-32">
                                            <Label className="text-xs shrink-0">Peso:</Label>
                                            <Slider
                                                value={[member.weight]}
                                                min={1}
                                                max={10}
                                                step={1}
                                                onValueChange={([value]) =>
                                                    updatePoolMember({ id: member.id, weight: value })
                                                }
                                                className="flex-1"
                                            />
                                            <span className="text-xs font-mono w-4">{member.weight}</span>
                                        </div>
                                    )}

                                    {/* Toggle disponibilidade */}
                                    <Switch
                                        checked={member.is_available}
                                        onCheckedChange={(checked) =>
                                            updatePoolMember({ id: member.id, is_available: checked })
                                        }
                                        title={member.is_available ? 'Disponível' : 'Indisponível'}
                                    />

                                    {/* Remover */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeFromPool(member.id)}
                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Adicionar Secretária */}
                    {availableToAdd.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                            <Label className="text-sm">Adicionar ao Pool</Label>
                            <div className="flex gap-2 mt-2">
                                <Select
                                    onValueChange={handleAddSecretary}
                                    disabled={isAddingSecretary}
                                >
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Selecionar secretária..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableToAdd.map((link) => (
                                            <SelectItem key={link.secretary_id} value={link.secretary_id}>
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4" />
                                                    {link.secretary?.full_name || link.secretary?.email}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {linkedSecretaries.length === 0 && (
                        <p className="text-xs text-muted-foreground mt-4">
                            Vincule secretárias na aba "Equipe" para adicioná-las ao pool.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
