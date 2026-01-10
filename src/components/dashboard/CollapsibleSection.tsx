/**
 * CollapsibleSection - Wrapper para seções expandíveis
 * 
 * Permite colapsar/expandir conteúdo para reduzir sobrecarga visual.
 * Persiste preferência do usuário no localStorage.
 */

import { useState, useEffect, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
    id: string;
    title: string;
    icon?: React.ElementType;
    badge?: string | number;
    defaultOpen?: boolean;
    persistState?: boolean;
    children: ReactNode;
    className?: string;
}

export function CollapsibleSection({
    id,
    title,
    icon: Icon,
    badge,
    defaultOpen = false,
    persistState = true,
    children,
    className,
}: CollapsibleSectionProps) {
    const storageKey = `collapsible-${id}`;

    const [isOpen, setIsOpen] = useState(() => {
        if (persistState && typeof window !== 'undefined') {
            const saved = localStorage.getItem(storageKey);
            if (saved !== null) {
                return saved === 'true';
            }
        }
        return defaultOpen;
    });

    // Persistir estado no localStorage
    useEffect(() => {
        if (persistState && typeof window !== 'undefined') {
            localStorage.setItem(storageKey, String(isOpen));
        }
    }, [isOpen, storageKey, persistState]);

    return (
        <Card className={cn("bg-card border-border overflow-hidden", className)}>
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {/* Ícone de Expansão */}
                                <div className="p-1 rounded-md bg-muted/50">
                                    {isOpen ? (
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </div>

                                {/* Ícone Customizado */}
                                {Icon && (
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <Icon className="h-4 w-4 text-primary" />
                                    </div>
                                )}

                                {/* Título */}
                                <CardTitle className="text-base font-medium">
                                    {title}
                                </CardTitle>

                                {/* Badge */}
                                {badge !== undefined && (
                                    <Badge variant="secondary" className="text-xs">
                                        {badge}
                                    </Badge>
                                )}
                            </div>

                            {/* Indicador de Estado */}
                            <span className="text-xs text-muted-foreground">
                                {isOpen ? "Clique para minimizar" : "Clique para expandir"}
                            </span>
                        </div>
                    </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                    <CardContent className="pt-0 pb-5">
                        {children}
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}

export default CollapsibleSection;
