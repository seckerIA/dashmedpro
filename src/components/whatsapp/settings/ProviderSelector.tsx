import { MessageCircle, QrCode } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { WhatsAppProvider } from '@/types/whatsapp';

interface ProviderSelectorProps {
  onSelect: (provider: WhatsAppProvider) => void;
}

export function ProviderSelector({ onSelect }: ProviderSelectorProps) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card
        className="cursor-pointer transition-all hover:border-green-500/50 hover:shadow-md"
        onClick={() => onSelect('meta')}
      >
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-green-500/10">
              <MessageCircle className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <CardTitle className="text-base">Meta Business API</CardTitle>
              <CardDescription className="text-xs">API oficial do WhatsApp</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-1.5">
            <li>- Conta Business verificada</li>
            <li>- Requer aprovacao do Meta</li>
            <li>- Ideal para envio em massa</li>
            <li>- Templates pre-aprovados</li>
          </ul>
        </CardContent>
      </Card>

      <Card
        className="cursor-pointer transition-all hover:border-emerald-500/50 hover:shadow-md"
        onClick={() => onSelect('evolution')}
      >
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10">
              <QrCode className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <CardTitle className="text-base">Evolution API (QR Code)</CardTitle>
              <CardDescription className="text-xs">Conexao via QR Code</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-1.5">
            <li>- Conexao instantanea via QR Code</li>
            <li>- Sem necessidade de conta Business</li>
            <li>- Configuracao rapida</li>
            <li>- Servidor proprio (self-hosted)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
