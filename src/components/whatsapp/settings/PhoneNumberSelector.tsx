/**
 * Componente: PhoneNumberSelector
 * Modal/Card para selecionar número de telefone após OAuth
 */

import { useState } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
    Phone,
    CheckCircle2,
    Loader2,
    X,
    Building2,
    Star,
    AlertCircle
} from 'lucide-react';
import { useWhatsAppOAuth, WhatsAppBusinessAccount } from '@/hooks/useWhatsAppOAuth';
import { cn } from '@/lib/utils';

interface PhoneNumberSelectorProps {
    onComplete?: () => void;
}

export function PhoneNumberSelector({ onComplete }: PhoneNumberSelectorProps) {
    const {
        session,
        isLoadingSession,
        selectPhoneAsync,
        isSelectingPhone,
        cancelOAuthSession
    } = useWhatsAppOAuth();

    const [selectedWaba, setSelectedWaba] = useState<string>('');
    const [selectedPhone, setSelectedPhone] = useState<string>('');

    if (isLoadingSession) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (!session || !session.wabas || session.wabas.length === 0) {
        return (
            <Card className="border-yellow-500/50 bg-yellow-500/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-600">
                        <AlertCircle className="h-5 w-5" />
                        Nenhum número encontrado
                    </CardTitle>
                    <CardDescription>
                        Não encontramos nenhum número de WhatsApp Business vinculado à sua conta do Facebook.
                        Certifique-se de que você tem acesso a uma conta WhatsApp Business.
                    </CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button variant="outline" onClick={cancelOAuthSession}>
                        Tentar novamente
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    const handleSelect = async () => {
        if (!selectedWaba || !selectedPhone) return;

        try {
            await selectPhoneAsync({
                wabaId: selectedWaba,
                phoneNumberId: selectedPhone
            });
            onComplete?.();
        } catch (error) {
            // Erro tratado pelo hook
        }
    };

    const getQualityColor = (quality: string) => {
        switch (quality?.toLowerCase()) {
            case 'green':
                return 'bg-green-500';
            case 'yellow':
                return 'bg-yellow-500';
            case 'red':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    return (
        <Card className="border-green-500/30 bg-gradient-to-br from-green-500/5 to-green-600/10">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="h-5 w-5" />
                            Conta conectada com sucesso!
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Selecione qual número de WhatsApp você deseja usar
                        </CardDescription>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={cancelOAuthSession}
                        className="h-8 w-8"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {session.wabas.map((waba) => (
                    <div key={waba.id} className="space-y-3">
                        {/* WABA Header */}
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Building2 className="h-4 w-4" />
                            <span>{waba.name || 'WhatsApp Business Account'}</span>
                            <Badge variant="outline" className="text-xs">
                                {waba.phone_numbers?.length || 0} número(s)
                            </Badge>
                        </div>

                        {/* Phone Numbers */}
                        <RadioGroup
                            value={selectedWaba === waba.id ? selectedPhone : ''}
                            onValueChange={(value) => {
                                setSelectedWaba(waba.id);
                                setSelectedPhone(value);
                            }}
                            className="space-y-2"
                        >
                            {waba.phone_numbers?.map((phone) => (
                                <div
                                    key={phone.id}
                                    className={cn(
                                        "flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all",
                                        selectedPhone === phone.id && selectedWaba === waba.id
                                            ? "border-green-500 bg-green-500/10"
                                            : "border-border hover:border-green-500/50 hover:bg-muted/50"
                                    )}
                                    onClick={() => {
                                        setSelectedWaba(waba.id);
                                        setSelectedPhone(phone.id);
                                    }}
                                >
                                    <RadioGroupItem value={phone.id} id={phone.id} />
                                    <Label
                                        htmlFor={phone.id}
                                        className="flex-1 cursor-pointer"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4 text-green-500" />
                                                    <span className="font-medium">{phone.display_phone_number}</span>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {phone.verified_name || 'Nome não verificado'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {phone.quality_rating && (
                                                    <div className="flex items-center gap-1">
                                                        <Star className="h-3 w-3 text-muted-foreground" />
                                                        <div
                                                            className={cn(
                                                                "w-2 h-2 rounded-full",
                                                                getQualityColor(phone.quality_rating)
                                                            )}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>
                ))}
            </CardContent>

            <CardFooter className="flex justify-between">
                <Button
                    variant="outline"
                    onClick={cancelOAuthSession}
                    disabled={isSelectingPhone}
                >
                    Cancelar
                </Button>
                <Button
                    onClick={handleSelect}
                    disabled={!selectedPhone || isSelectingPhone}
                    className="bg-green-600 hover:bg-green-700"
                >
                    {isSelectingPhone ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Configurando...
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Usar este número
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}
