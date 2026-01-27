'use client';

/**
 * Tab de Pipeline - Kanban de Deals
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PipelineBoard } from '@/components/crm/PipelineBoard';
import { useCRM } from '@/hooks/useCRM';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from '@/hooks/use-toast';
import { Filter, Plus, Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { CRMDealWithContact, CRMPipelineStage } from '@/types/crm';
import { DealForm } from '@/components/crm/DealForm';
import { ContactForm } from '@/components/crm/ContactForm';


export function PipelineTab() {
    const router = useRouter();
    const { user } = useAuth();
    const { isAdmin } = useUserProfile();
    const [searchQuery, setSearchQuery] = useState('');

    const {
        deals,
        isLoading,
        updateDeal,
        updateDealsPositions,
        deleteDeal,
        isDeletingDeal,
    } = useCRM();

    const [isDealFormOpen, setIsDealFormOpen] = useState(false);
    const [isContactFormOpen, setIsContactFormOpen] = useState(false);


    // Filtrar deals pela busca
    const filteredDeals = deals.filter(deal => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            deal.title?.toLowerCase().includes(query) ||
            deal.contact?.full_name?.toLowerCase().includes(query) ||
            deal.contact?.phone?.includes(query) ||
            deal.contact?.email?.toLowerCase().includes(query)
        );
    });

    const handleReorderDealsInStage = async (stage: string, dealIds: string[]) => {
        try {
            const updates = dealIds.map((dealId, index) => ({
                id: dealId,
                position: index,
            }));

            await updateDealsPositions(updates);

            toast({
                title: 'Ordem atualizada',
                description: 'Os contatos foram reordenados com sucesso.',
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: 'Não foi possível reordenar os contatos.',
            });
        }
    };

    const handleUpdateDealStage = async (dealId: string, newStage: string, position?: number) => {
        try {
            const updateData: Partial<CRMDealWithContact> = { stage: newStage as CRMPipelineStage };

            if (position !== undefined && position !== null) {
                updateData.position = position;
            }

            await updateDeal({
                dealId,
                data: updateData,
            });
        } catch (error) {
            console.error('Erro ao atualizar deal:', error);
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: 'Não foi possível atualizar o contato.',
            });
            throw error;
        }
    };

    const handleDeleteDeal = async (dealId: string) => {
        if (!dealId) {
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: 'ID do contrato não fornecido.',
            });
            return;
        }

        try {
            await deleteDeal(dealId);
            toast({
                title: 'Contrato excluído',
                description: 'O contrato foi excluído com sucesso.',
            });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            toast({
                variant: 'destructive',
                title: 'Erro ao excluir contrato',
                description: errorMessage,
            });
        }
    };

    const handleWhatsApp = (deal: CRMDealWithContact) => {
        if (deal.contact?.phone) {
            const cleanPhone = deal.contact.phone.replace(/\D/g, '');
            router.push(`/whatsapp?phone=${cleanPhone}`);
        } else {
            toast({
                variant: 'destructive',
                title: 'WhatsApp não disponível',
                description: 'Este contato não possui telefone cadastrado.',
            });
        }
    };

    const handleEmail = (deal: CRMDealWithContact) => {
        if (deal.contact?.email) {
            window.open(`mailto:${deal.contact.email}?subject=Follow-up: ${deal.title}`);
        } else {
            toast({
                variant: 'destructive',
                title: 'Email não disponível',
                description: 'Este contato não possui email cadastrado.',
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex gap-3">
                    <Button onClick={() => setIsContactFormOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Contato
                    </Button>
                    <Button variant="outline" onClick={() => setIsDealFormOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Deal
                    </Button>

                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar contatos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Button variant="outline">
                        <Filter className="w-4 h-4 mr-2" />
                        Filtros
                    </Button>
                </div>
            </div>

            {/* Pipeline Board */}
            <PipelineBoard
                deals={filteredDeals}
                onUpdateDeal={handleUpdateDealStage}
                onReorderDealsInStage={handleReorderDealsInStage}
                onEditDeal={(deal) => console.log('Edit deal:', deal)}
                onDeleteDeal={handleDeleteDeal}
                isDeletingDeal={isDeletingDeal}
                onDealClick={(deal) => console.log('Deal clicked:', deal)}
                onCall={handleWhatsApp}
                onEmail={handleEmail}
                onWhatsApp={handleWhatsApp}
            />

            <DealForm open={isDealFormOpen} onOpenChange={setIsDealFormOpen} />
            <ContactForm open={isContactFormOpen} onOpenChange={setIsContactFormOpen} />
        </div>
    );
}
