import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Settings as SettingsIcon, User, Lock, Palette, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/hooks/useAuth';
import ProfileTab from '@/components/settings/ProfileTab';
import SecurityTab from '@/components/settings/SecurityTab';
import PreferencesTab from '@/components/settings/PreferencesTab';
import AccountTab from '@/components/settings/AccountTab';

const Settings = () => {
  const { profile, isLoading } = useUserProfile();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['profile', 'security', 'preferences', 'account'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-card rounded-xl p-8 shadow-card border-border">
        <div className="flex items-center gap-4">
          <SettingsIcon className="w-10 h-10 text-primary" />
          <div>
            <h1 className="text-3xl font-bold mb-2 text-card-foreground">Configurações</h1>
            <p className="text-muted-foreground text-lg">
              Gerencie suas informações pessoais, segurança e preferências
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Card className="bg-gradient-card shadow-card border-border">
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
              <TabsTrigger value="profile" className="flex items-center justify-center gap-2">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Perfil</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" />
                <span className="hidden sm:inline">Segurança</span>
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center justify-center gap-2">
                <Palette className="w-4 h-4" />
                <span className="hidden sm:inline">Preferências</span>
              </TabsTrigger>
              <TabsTrigger value="account" className="flex items-center justify-center gap-2">
                <Info className="w-4 h-4" />
                <span className="hidden sm:inline">Conta</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <ProfileTab profile={profile} user={user} />
            </TabsContent>

            <TabsContent value="security">
              <SecurityTab user={user} />
            </TabsContent>

            <TabsContent value="preferences">
              <PreferencesTab />
            </TabsContent>

            <TabsContent value="account">
              <AccountTab profile={profile} user={user} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;

