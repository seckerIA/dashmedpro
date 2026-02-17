/**
 * Componente: FacebookConnectButton
 * Botão para iniciar conexão OAuth com Facebook/WhatsApp
 * Mostra estado conectado com opção de desconectar
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageCircle, Zap, Shield, Clock, CheckCircle, Unlink, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useMetaOAuth } from '@/hooks/useMetaOAuth';
import { useWhatsAppConfig } from '@/hooks/useWhatsAppConfig';

// Ícone do Facebook
const FacebookIcon = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
);

export function FacebookConnectButton() {
    const {
        startWhatsAppOAuthFlow,
        isConnecting,
        isOAuthConfigured
    } = useMetaOAuth();

    const {
        config,
        isConfigured,
        isActive,
        deleteConfig,
        deactivate,
        isDeleting,
        isDeactivating,
    } = useWhatsAppConfig();

    // Estado: Não configurado (FB_APP_ID ausente)
    if (!isOAuthConfigured) {
        return (
            <Card className="border-dashed border-2 border-muted">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-muted-foreground">
                        <MessageCircle className="h-5 w-5" />
                        Conexão Rápida
                    </CardTitle>
                    <CardDescription>
                        Conexão automática via Facebook não disponível no momento.
                        Use as credenciais manuais abaixo.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    // Estado: Já conectado
    if (isConfigured && config) {
        return (
            <Card className={`border ${isActive
                ? 'bg-green-500/5 border-green-500/20'
                : 'bg-yellow-500/5 border-yellow-500/20'
            }`}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle className={`h-5 w-5 ${isActive ? 'text-green-500' : 'text-yellow-500'}`} />
                                WhatsApp Conectado
                                <Badge variant={isActive ? 'default' : 'secondary'} className={`text-xs ${isActive ? 'bg-green-600' : ''}`}>
                                    {isActive ? 'Ativo' : 'Inativo'}
                                </Badge>
                            </CardTitle>
                            <CardDescription className="mt-1">
                                {config.verified_name || 'Nome não verificado'}
                                {config.display_phone_number && ` • ${config.display_phone_number}`}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-muted-foreground text-xs">Phone Number ID</p>
                            <p className="font-mono text-xs mt-1 truncate">{config.phone_number_id || '—'}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-muted-foreground text-xs">Business Account</p>
                            <p className="font-mono text-xs mt-1 truncate">{config.business_account_id || '—'}</p>
                        </div>
                    </div>
                    {(config as any).oauth_connected && (
                        <Badge variant="outline" className="text-xs">
                            <Zap className="h-3 w-3 mr-1" />
                            Conectado via Facebook OAuth
                        </Badge>
                    )}
                </CardContent>
                <CardFooter className="flex gap-2">
                    {/* Desativar/Reativar */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deactivate()}
                        disabled={isDeactivating || !isActive}
                        className={!isActive ? 'opacity-50' : ''}
                    >
                        {isDeactivating ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                            <Unlink className="h-4 w-4 mr-1" />
                        )}
                        Desativar
                    </Button>

                    {/* Remover integração */}
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="destructive"
                                size="sm"
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                    <Trash2 className="h-4 w-4 mr-1" />
                                )}
                                Remover Integração
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Remover integração do WhatsApp?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Todas as configurações serão removidas (Phone ID, Token, Webhook).
                                    As conversas existentes serão mantidas.
                                    Você poderá reconectar a qualquer momento.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteConfig()}>
                                    Sim, remover tudo
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardFooter>
            </Card>
        );
    }

    // Estado: Não conectado — mostrar botão de conectar
    return (
        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-600/10 border-blue-500/20">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-blue-500" />
                            Conexão Rápida
                            <Badge variant="secondary" className="text-xs">Recomendado</Badge>
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Conecte sua conta do WhatsApp Business em segundos
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Benefícios */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        <span>Setup em 30 segundos</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Shield className="h-4 w-4 text-green-500" />
                        <span>Seguro e oficial</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span>Sem copiar credenciais</span>
                    </div>
                </div>

                {/* Botão de Conexão */}
                <Button
                    onClick={startWhatsAppOAuthFlow}
                    disabled={isConnecting}
                    className="w-full h-12 bg-[#1877F2] hover:bg-[#166FE5] text-white font-medium text-base"
                    size="lg"
                >
                    {isConnecting ? (
                        <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Conectando...
                        </>
                    ) : (
                        <>
                            <FacebookIcon />
                            <span className="ml-2">Conectar com Facebook</span>
                        </>
                    )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                    Você será redirecionado para o Facebook para autorizar a conexão com seu WhatsApp Business
                </p>
            </CardContent>
        </Card>
    );
}
