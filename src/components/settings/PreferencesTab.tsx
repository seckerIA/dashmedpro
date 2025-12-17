import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { useTheme } from 'next-themes';
import { Palette, Bell, Moon, Sun, Monitor } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PreferencesTab = () => {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    toast({
      title: 'Tema alterado',
      description: `Tema alterado para ${newTheme === 'light' ? 'claro' : newTheme === 'dark' ? 'escuro' : 'sistema'}.`,
    });
  };

  const handleEmailNotificationsChange = (checked: boolean) => {
    setEmailNotifications(checked);
    toast({
      title: checked ? 'Notificações por email ativadas' : 'Notificações por email desativadas',
      description: 'Sua preferência foi salva.',
    });
  };

  const handlePushNotificationsChange = (checked: boolean) => {
    setPushNotifications(checked);
    toast({
      title: checked ? 'Notificações push ativadas' : 'Notificações push desativadas',
      description: 'Sua preferência foi salva.',
    });
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Aparência
          </CardTitle>
          <CardDescription>
            Escolha como o DashMed Pro deve aparecer para você
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Label>Tema</Label>
            <RadioGroup value={theme} onValueChange={handleThemeChange}>
              <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                <RadioGroupItem value="light" id="light" />
                <Label htmlFor="light" className="flex items-center gap-3 cursor-pointer flex-1">
                  <Sun className="w-5 h-5 text-primary" />
                  <div>
                    <div className="font-medium">Claro</div>
                    <div className="text-sm text-muted-foreground">
                      Tema claro com fundo branco
                    </div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                <RadioGroupItem value="dark" id="dark" />
                <Label htmlFor="dark" className="flex items-center gap-3 cursor-pointer flex-1">
                  <Moon className="w-5 h-5 text-primary" />
                  <div>
                    <div className="font-medium">Escuro</div>
                    <div className="text-sm text-muted-foreground">
                      Tema escuro com fundo preto
                    </div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                <RadioGroupItem value="system" id="system" />
                <Label htmlFor="system" className="flex items-center gap-3 cursor-pointer flex-1">
                  <Monitor className="w-5 h-5 text-primary" />
                  <div>
                    <div className="font-medium">Sistema</div>
                    <div className="text-sm text-muted-foreground">
                      Seguir preferência do sistema
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notificações
          </CardTitle>
          <CardDescription>
            Gerencie como e quando você recebe notificações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Notificações por Email</Label>
                <p className="text-sm text-muted-foreground">
                  Receba notificações importantes por email
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={emailNotifications}
                onCheckedChange={handleEmailNotificationsChange}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications">Notificações Push</Label>
                <p className="text-sm text-muted-foreground">
                  Receba notificações em tempo real no navegador
                </p>
              </div>
              <Switch
                id="push-notifications"
                checked={pushNotifications}
                onCheckedChange={handlePushNotificationsChange}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Mais opções de personalização em breve
            </p>
            <p className="text-xs text-muted-foreground">
              Estamos trabalhando em mais opções de preferências e personalização
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PreferencesTab;






