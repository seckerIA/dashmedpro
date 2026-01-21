import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import {
    Settings,
    Mail,
    Bell,
    Palette,
    Globe,
    Shield,
    Save,
    AlertTriangle
} from 'lucide-react';

export default function AdminSettings() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const [settings, setSettings] = useState({
        platformName: 'DashMedPro',
        supportEmail: 'suporte@dashmed.com',
        defaultPlan: 'pro',
        trialDays: 14,
        maintenanceMode: false,
        newSignupsEnabled: true,
        emailNotifications: true,
        slackNotifications: false,
        welcomeEmailTemplate: 'Bem-vindo ao DashMedPro! Sua conta foi criada com sucesso.',
        invoiceEmailTemplate: 'Sua fatura do DashMedPro está disponível.',
    });

    const handleSave = async () => {
        setIsLoading(true);
        try {
            // In production, save to a settings table or Supabase Vault
            await new Promise(resolve => setTimeout(resolve, 500));
            toast({ title: 'Sucesso', description: 'Configurações salvas!' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Configurações</h1>
                    <p className="text-muted-foreground">Configurações globais da plataforma</p>
                </div>
                <Button onClick={handleSave} disabled={isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
            </div>

            {/* Maintenance Mode Warning */}
            {settings.maintenanceMode && (
                <Card className="border-yellow-500/50 bg-yellow-500/5">
                    <CardContent className="flex items-center gap-3 py-4">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        <div>
                            <p className="font-medium text-yellow-600">Modo de Manutenção Ativo</p>
                            <p className="text-sm text-muted-foreground">
                                Usuários não-admin não conseguirão acessar a plataforma
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                {/* General Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="h-5 w-5" />
                            Geral
                        </CardTitle>
                        <CardDescription>Configurações básicas da plataforma</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label>Nome da Plataforma</Label>
                            <Input
                                value={settings.platformName}
                                onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Email de Suporte</Label>
                            <Input
                                type="email"
                                value={settings.supportEmail}
                                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Dias de Trial</Label>
                            <Input
                                type="number"
                                value={settings.trialDays}
                                onChange={(e) => setSettings({ ...settings, trialDays: Number(e.target.value) })}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Feature Flags */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Feature Flags
                        </CardTitle>
                        <CardDescription>Ativar/desativar funcionalidades</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Modo de Manutenção</Label>
                                <p className="text-sm text-muted-foreground">
                                    Bloqueia acesso de usuários comuns
                                </p>
                            </div>
                            <Switch
                                checked={settings.maintenanceMode}
                                onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                            />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Novos Cadastros</Label>
                                <p className="text-sm text-muted-foreground">
                                    Permitir criação de novas clínicas
                                </p>
                            </div>
                            <Switch
                                checked={settings.newSignupsEnabled}
                                onCheckedChange={(checked) => setSettings({ ...settings, newSignupsEnabled: checked })}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Notifications */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            Notificações
                        </CardTitle>
                        <CardDescription>Configurações de alertas</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Notificações por Email</Label>
                                <p className="text-sm text-muted-foreground">
                                    Receber alertas importantes por email
                                </p>
                            </div>
                            <Switch
                                checked={settings.emailNotifications}
                                onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                            />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Notificações Slack</Label>
                                <p className="text-sm text-muted-foreground">
                                    Enviar alertas para canal Slack
                                </p>
                            </div>
                            <Switch
                                checked={settings.slackNotifications}
                                onCheckedChange={(checked) => setSettings({ ...settings, slackNotifications: checked })}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Email Templates */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5" />
                            Templates de Email
                        </CardTitle>
                        <CardDescription>Personalizar mensagens automáticas</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label>Email de Boas-vindas</Label>
                            <Textarea
                                value={settings.welcomeEmailTemplate}
                                onChange={(e) => setSettings({ ...settings, welcomeEmailTemplate: e.target.value })}
                                rows={3}
                            />
                        </div>
                        <div>
                            <Label>Email de Fatura</Label>
                            <Textarea
                                value={settings.invoiceEmailTemplate}
                                onChange={(e) => setSettings({ ...settings, invoiceEmailTemplate: e.target.value })}
                                rows={3}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
