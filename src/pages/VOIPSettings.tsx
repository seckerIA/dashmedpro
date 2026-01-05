import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useVOIPConfig } from '@/hooks/useVOIPConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Save, Trash2, CheckCircle, AlertTriangle, Phone, MessageSquare, Server } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WhatsAppSettingsForm {
    whatsapp_phone_number_id: string;
    whatsapp_business_id: string;
    whatsapp_access_token: string;
    display_phone_number: string;
}

interface SIPSettingsForm {
    sip_domain: string;
    sip_username: string;
    sip_password: string;
    sip_server_hostname: string;
}

export default function VOIPSettings() {
    const {
        config,
        isLoading,
        isReady,
        hasWhatsAppConfig,
        hasSIPConfig,
        saveConfig,
        isSaving,
        toggleActive,
        deleteConfig,
        isActive
    } = useVOIPConfig();

    const waForm = useForm<WhatsAppSettingsForm>();
    const sipForm = useForm<SIPSettingsForm>();

    useEffect(() => {
        if (config) {
            waForm.setValue('whatsapp_phone_number_id', config.whatsapp_phone_number_id || '');
            waForm.setValue('whatsapp_business_id', config.whatsapp_business_id || '');
            waForm.setValue('whatsapp_access_token', ''); // Don't show token for security
            waForm.setValue('display_phone_number', config.display_phone_number || '');

            sipForm.setValue('sip_domain', config.sip_domain || '');
            sipForm.setValue('sip_username', config.sip_username || '');
            sipForm.setValue('sip_password', '');
            sipForm.setValue('sip_server_hostname', config.sip_server_hostname || '');
        }
    }, [config]);

    const onSaveWhatsApp = async (data: WhatsAppSettingsForm) => {
        try {
            await saveConfig({
                whatsapp_phone_number_id: data.whatsapp_phone_number_id,
                whatsapp_business_id: data.whatsapp_business_id,
                whatsapp_access_token: data.whatsapp_access_token || config?.whatsapp_access_token,
                display_phone_number: data.display_phone_number,
                recording_enabled: true,
            });
        } catch (e) {
            // Error handled in hook
        }
    };

    const onSaveSIP = async (data: SIPSettingsForm) => {
        try {
            await saveConfig({
                sip_domain: data.sip_domain,
                sip_username: data.sip_username,
                sip_password: data.sip_password || config?.sip_password,
                sip_server_hostname: data.sip_server_hostname,
            });
        } catch (e) {
            // Error handled in hook
        }
    };

    const handleToggleActive = async (enabled: boolean) => {
        try {
            await toggleActive(enabled);
        } catch (e) {
            // Error handled in hook
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="container max-w-4xl py-6 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Configurações de Voz (VoIP)</h1>
                <p className="text-muted-foreground">
                    Configure chamadas de voz via WhatsApp usando a Cloud API oficial.
                </p>
            </div>

            <div className="grid gap-6">
                {/* Status Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Phone className="h-5 w-5" />
                                Status do Sistema
                            </CardTitle>
                            <CardDescription>
                                {isReady ? 'Pronto para fazer e receber chamadas' : 'Configure as credenciais abaixo'}
                            </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Label htmlFor="active-mode">Ativo</Label>
                            <Switch
                                id="active-mode"
                                checked={isActive}
                                onCheckedChange={handleToggleActive}
                                disabled={!hasWhatsAppConfig}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4 mt-2">
                            {isReady ? (
                                <div className="flex items-center text-green-600 gap-2 font-medium">
                                    <CheckCircle className="h-5 w-5" />
                                    <span>Sistema Operacional</span>
                                </div>
                            ) : (
                                <div className="flex items-center text-amber-600 gap-2 font-medium">
                                    <AlertTriangle className="h-5 w-5" />
                                    <span>Configuração Necessária</span>
                                </div>
                            )}

                            <div className="flex gap-2 ml-auto">
                                {hasWhatsAppConfig && (
                                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">WhatsApp ✓</span>
                                )}
                                {hasSIPConfig && (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">SIP ✓</span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Info Alert */}
                <Alert>
                    <MessageSquare className="h-4 w-4" />
                    <AlertDescription>
                        <strong>Como funciona:</strong> As chamadas são feitas diretamente pelo WhatsApp do cliente,
                        usando o mesmo número que você já usa para mensagens. O cliente atende no WhatsApp dele
                        e você atende aqui no Dashboard.
                    </AlertDescription>
                </Alert>

                {/* Configuration Tabs */}
                <Tabs defaultValue="whatsapp" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="whatsapp" className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            WhatsApp Cloud API
                        </TabsTrigger>
                        <TabsTrigger value="sip" className="flex items-center gap-2">
                            <Server className="h-4 w-4" />
                            SIP Trunking (Opcional)
                        </TabsTrigger>
                    </TabsList>

                    {/* WhatsApp Tab */}
                    <TabsContent value="whatsapp">
                        <Card>
                            <CardHeader>
                                <CardTitle>Credenciais do WhatsApp</CardTitle>
                                <CardDescription>
                                    Encontre estes dados no{' '}
                                    <a
                                        href="https://developers.facebook.com/apps"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary underline"
                                    >
                                        Meta for Developers
                                    </a>
                                    {' '}{'>'} WhatsApp {'>'} API Setup.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={waForm.handleSubmit(onSaveWhatsApp)} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Phone Number ID</Label>
                                            <Input
                                                {...waForm.register('whatsapp_phone_number_id', { required: true })}
                                                placeholder="123456789012345"
                                            />
                                            <p className="text-xs text-muted-foreground">ID numérico do seu número no painel Meta</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Business Account ID</Label>
                                            <Input
                                                {...waForm.register('whatsapp_business_id')}
                                                placeholder="123456789012345"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Access Token</Label>
                                        <Textarea
                                            {...waForm.register('whatsapp_access_token', { required: !config?.whatsapp_access_token })}
                                            placeholder={config?.whatsapp_access_token ? '••••••••••••••••' : 'EAAxxxxxx...'}
                                            rows={3}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Token de acesso permanente da API (System User Token recomendado)
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Número de Exibição</Label>
                                        <Input
                                            {...waForm.register('display_phone_number')}
                                            placeholder="+5511999999999"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Seu número WhatsApp no formato internacional
                                        </p>
                                    </div>

                                    <div className="flex justify-between pt-4">
                                        {config && (
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                onClick={() => deleteConfig()}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Remover
                                            </Button>
                                        )}
                                        <Button type="submit" disabled={isSaving} className="ml-auto">
                                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            <Save className="mr-2 h-4 w-4" />
                                            Salvar WhatsApp
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* SIP Tab */}
                    <TabsContent value="sip">
                        <Card>
                            <CardHeader>
                                <CardTitle>Configuração SIP</CardTitle>
                                <CardDescription>
                                    Configure a ponte SIP para atender chamadas no navegador.
                                    Estas credenciais são fornecidas pelo Meta no painel de Voice Settings.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={sipForm.handleSubmit(onSaveSIP)} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>SIP Domain</Label>
                                            <Input
                                                {...sipForm.register('sip_domain')}
                                                placeholder="whatsapp.sip.meta.com"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Server Hostname</Label>
                                            <Input
                                                {...sipForm.register('sip_server_hostname')}
                                                placeholder="sip.meta.com"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Username</Label>
                                            <Input
                                                {...sipForm.register('sip_username')}
                                                placeholder="Seu número WhatsApp"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Password</Label>
                                            <Input
                                                {...sipForm.register('sip_password')}
                                                type="password"
                                                placeholder={config?.sip_password ? '••••••••' : 'Senha do painel Meta'}
                                            />
                                        </div>
                                    </div>

                                    <Alert className="bg-muted">
                                        <AlertDescription className="text-xs">
                                            <strong>Nota:</strong> A configuração SIP é opcional e avançada.
                                            As chamadas podem funcionar apenas com a configuração do WhatsApp acima
                                            se você usar um softphone externo ou a integração completa.
                                        </AlertDescription>
                                    </Alert>

                                    <div className="flex justify-end pt-4">
                                        <Button type="submit" disabled={isSaving}>
                                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            <Save className="mr-2 h-4 w-4" />
                                            Salvar SIP
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
