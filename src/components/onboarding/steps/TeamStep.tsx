/**
 * TeamStep Component
 *
 * Step 4: Team member management (optional)
 * - Add secretaries or other doctors
 * - Can be skipped
 * - Limited to memberLimit in free tier
 */

import { useState } from 'react';
import { Users, Plus, X, Mail, AlertCircle, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { OnboardingTeamMember, isValidEmail } from '@/types/onboarding';
import { cn } from '@/lib/utils';

interface TeamStepProps {
  members: OnboardingTeamMember[];
  onAdd: (member: Omit<OnboardingTeamMember, 'id'>) => boolean;
  onRemove: (memberId: string) => void;
  memberLimit: number;
  memberLimitReached: boolean;
}

export function TeamStep({ members, onAdd, onRemove, memberLimit, memberLimitReached }: TeamStepProps) {
  const [showForm, setShowForm] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    role: 'secretaria' as OnboardingTeamMember['role'],
  });
  const [emailError, setEmailError] = useState('');

  const handleAddMember = () => {
    // Validate email
    if (!isValidEmail(newMember.email)) {
      setEmailError('Digite um email valido');
      return;
    }

    // Check for duplicate email
    if (members.some(m => m.email.toLowerCase() === newMember.email.toLowerCase())) {
      setEmailError('Este email ja foi adicionado');
      return;
    }

    if (!newMember.name.trim()) return;

    // onAdd returns false if limit is reached
    const success = onAdd(newMember);
    if (success) {
      setNewMember({ name: '', email: '', role: 'secretaria' });
      setEmailError('');
      setShowForm(false);
    }
  };

  const handleEmailChange = (email: string) => {
    setNewMember(prev => ({ ...prev, email }));
    if (emailError) setEmailError('');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary to-blue-500">
          <Users className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white">Sua Equipe</h1>
        <p className="text-muted-foreground text-lg">
          Adicione membros agora ou depois
        </p>
        {/* Member counter */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-card rounded-full border border-border">
          <span className={cn(
            "text-sm font-medium",
            memberLimitReached ? "text-amber-400" : "text-muted-foreground"
          )}>
            {members.length} de {memberLimit} membro(s)
          </span>
          {memberLimitReached && (
            <Crown className="w-4 h-4 text-amber-400" />
          )}
        </div>
      </div>

      {/* Members List */}
      <div className="max-w-md mx-auto space-y-4">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border"
          >
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
              {member.name.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{member.name}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-3 h-3" />
                <span className="truncate">{member.email}</span>
              </div>
            </div>

            {/* Role badge */}
            <span className={cn(
              'text-xs px-2 py-1 rounded-full flex-shrink-0',
              member.role === 'secretaria'
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-primary/20 text-primary'
            )}>
              {member.role === 'secretaria' ? 'Secretaria' : 'Medico'}
            </span>

            {/* Remove button */}
            <button
              onClick={() => onRemove(member.id)}
              className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {/* Add Member Form */}
        {showForm ? (
          <div className="p-4 bg-card rounded-xl border border-border space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Nome</Label>
              <Input
                value={newMember.name}
                onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome completo"
                className="bg-card border-border text-white placeholder:text-zinc-600"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">E-mail</Label>
              <Input
                type="email"
                value={newMember.email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="email@exemplo.com"
                className={cn(
                  'bg-card border-border text-white placeholder:text-zinc-600',
                  emailError && 'border-destructive'
                )}
              />
              {emailError && (
                <p className="text-xs text-destructive">{emailError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">Funcao</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewMember(prev => ({ ...prev, role: 'secretaria' }))}
                  className={cn(
                    'flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all',
                    newMember.role === 'secretaria'
                      ? 'border-primary bg-primary/20 text-white'
                      : 'border-border text-muted-foreground hover:border-zinc-600'
                  )}
                >
                  Secretaria
                </button>
                <button
                  type="button"
                  onClick={() => setNewMember(prev => ({ ...prev, role: 'medico' }))}
                  className={cn(
                    'flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all',
                    newMember.role === 'medico'
                      ? 'border-primary bg-primary/20 text-white'
                      : 'border-border text-muted-foreground hover:border-zinc-600'
                  )}
                >
                  Medico
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowForm(false);
                  setNewMember({ name: '', email: '', role: 'secretaria' });
                  setEmailError('');
                }}
                className="flex-1 text-muted-foreground"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddMember}
                disabled={!newMember.name.trim() || !newMember.email.trim()}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Adicionar
              </Button>
            </div>
          </div>
        ) : memberLimitReached ? (
          <Alert className="bg-amber-500/10 border-amber-500/30">
            <Crown className="h-4 w-4 text-amber-400" />
            <AlertTitle className="text-amber-400">Limite atingido</AlertTitle>
            <AlertDescription className="text-amber-200/80">
              Voce pode adicionar ate {memberLimit} membro(s) no plano atual. Faça upgrade de plano para adicionar mais.
            </AlertDescription>
          </Alert>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-4 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:text-white hover:border-zinc-600 flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Adicionar Membro
          </button>
        )}
      </div>

      {/* Info text */}
      <div className="max-w-md mx-auto space-y-3 text-center">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Mail className="w-4 h-4" />
          <span>Um convite sera enviado por email</span>
        </div>

        {members.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Esta etapa e opcional. Voce pode adicionar membros da equipe depois nas configuracoes.
          </p>
        )}
      </div>
    </div>
  );
}
