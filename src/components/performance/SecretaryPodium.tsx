import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';
import type { SecretaryPerformance } from '@/hooks/useSecretaryPerformance';

interface SecretaryPodiumProps {
  rankings: SecretaryPerformance[];
  isLoading?: boolean;
}

const initialsOf = (name: string) => name
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((s) => s[0]?.toUpperCase())
  .join('') || '?';

interface PodiumStepProps {
  position: 1 | 2 | 3;
  data?: SecretaryPerformance;
}

const STEP_CONFIG: Record<1 | 2 | 3, {
  label: string;
  height: string;
  bg: string;
  border: string;
  text: string;
  Icon: typeof Trophy;
  delay: number;
  iconColor: string;
}> = {
  1: {
    label: '1º LUGAR',
    height: 'h-44 sm:h-52',
    bg: 'bg-gradient-to-b from-amber-500/20 via-amber-500/10 to-amber-600/30',
    border: 'border-amber-500/40',
    text: 'text-amber-400',
    Icon: Trophy,
    delay: 0.1,
    iconColor: 'text-amber-400',
  },
  2: {
    label: '2º LUGAR',
    height: 'h-32 sm:h-40',
    bg: 'bg-gradient-to-b from-slate-300/15 via-slate-300/5 to-slate-400/20',
    border: 'border-slate-400/30',
    text: 'text-slate-300',
    Icon: Medal,
    delay: 0.25,
    iconColor: 'text-slate-300',
  },
  3: {
    label: '3º LUGAR',
    height: 'h-24 sm:h-28',
    bg: 'bg-gradient-to-b from-orange-500/15 via-orange-500/5 to-orange-700/20',
    border: 'border-orange-700/30',
    text: 'text-orange-400',
    Icon: Award,
    delay: 0.4,
    iconColor: 'text-orange-400',
  },
};

function PodiumStep({ position, data }: PodiumStepProps) {
  const cfg = STEP_CONFIG[position];
  const Icon = cfg.Icon;

  if (!data) {
    return (
      <div className="flex flex-col items-center min-w-0 flex-1 max-w-[200px]">
        <div className="flex flex-col items-center gap-2 mb-3 opacity-40">
          <span className={cn('text-xs font-bold tracking-widest', cfg.text)}>{cfg.label}</span>
          <Avatar className="h-16 w-16 sm:h-20 sm:w-20 ring-2 ring-border">
            <AvatarFallback className="bg-muted text-muted-foreground">--</AvatarFallback>
          </Avatar>
          <p className="text-sm text-muted-foreground">Sem dados</p>
        </div>
        <div
          className={cn(
            'w-full rounded-t-xl border border-b-0 flex items-center justify-center',
            cfg.height,
            'bg-muted/20 border-border/40',
          )}
        >
          <span className="text-3xl sm:text-5xl font-black text-muted-foreground/40">{position}</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: cfg.delay, ease: 'easeOut' }}
      className="flex flex-col items-center min-w-0 flex-1 max-w-[220px]"
    >
      <div className="flex flex-col items-center gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          <Icon className={cn('h-4 w-4', cfg.iconColor)} />
          <span className={cn('text-xs font-bold tracking-widest', cfg.text)}>{cfg.label}</span>
        </div>
        <Avatar className={cn('h-16 w-16 sm:h-20 sm:w-20 ring-2 shadow-lg', cfg.border)}>
          {data.avatarUrl ? <AvatarImage src={data.avatarUrl} alt={data.fullName} /> : null}
          <AvatarFallback className={cn('text-lg font-bold', cfg.bg, cfg.text)}>
            {initialsOf(data.fullName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col items-center min-w-0 max-w-full">
          <p className="text-sm sm:text-base font-semibold text-foreground truncate max-w-[180px]" title={data.fullName}>
            {data.fullName}
          </p>
          <p className="text-base sm:text-lg font-bold text-emerald-400 tabular-nums">
            {formatCurrency(data.revenue)}
          </p>
          <p className="text-[11px] text-muted-foreground tabular-nums">
            {data.appointmentsPaid} {data.appointmentsPaid === 1 ? 'venda' : 'vendas'}
            {data.appointmentsPaid > 0 && ` · ticket ${formatCurrency(data.averageTicket)}`}
          </p>
        </div>
      </div>
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: 'auto' }}
        transition={{ duration: 0.6, delay: cfg.delay + 0.1, ease: 'easeOut' }}
        className={cn(
          'w-full rounded-t-xl border border-b-0 flex items-center justify-center shadow-inner',
          cfg.height,
          cfg.bg,
          cfg.border,
        )}
      >
        <span className={cn('text-4xl sm:text-6xl font-black', cfg.text)}>{position}</span>
      </motion.div>
    </motion.div>
  );
}

export function SecretaryPodium({ rankings, isLoading }: SecretaryPodiumProps) {
  const top3 = [rankings[0], rankings[1], rankings[2]];

  return (
    <Card className="border-border/50 bg-gradient-to-br from-background to-muted/30 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-400" />
          Top 3 secretárias por caixa no período
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2 pb-6">
        {isLoading ? (
          <div className="flex items-end justify-center gap-2 sm:gap-4 h-64 px-2">
            {[2, 1, 3].map((p) => (
              <div key={p} className="flex-1 max-w-[200px]">
                <div className="animate-pulse bg-muted rounded-t-xl h-32" />
              </div>
            ))}
          </div>
        ) : rankings.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">Sem dados de agendamentos pagos no período.</p>
            <p className="text-xs mt-1 opacity-75">
              As métricas começam a popular conforme as secretárias agendam consultas
              (campo <code className="px-1 py-0.5 rounded bg-muted">scheduled_by</code>).
            </p>
          </div>
        ) : (
          <div className="flex items-end justify-center gap-1 sm:gap-3 px-2">
            <PodiumStep position={2} data={top3[1]} />
            <PodiumStep position={1} data={top3[0]} />
            <PodiumStep position={3} data={top3[2]} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
