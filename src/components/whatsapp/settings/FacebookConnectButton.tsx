/**
 * Componente: FacebookConnectButton
 * Botão para iniciar conexão OAuth com Facebook/WhatsApp
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageCircle, Zap, Shield, Clock } from 'lucide-react';
import { useMetaOAuth } from '@/hooks/useMetaOAuth';

// Ícone do Facebook
const FacebookIcon = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
);

export function FacebookConnectButton() {
    const {
        startOAuthFlow,
        isConnecting,
        isOAuthConfigured
    } = useMetaOAuth();

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
                    onClick={startOAuthFlow}
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
