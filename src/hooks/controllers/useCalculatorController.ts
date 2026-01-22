import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

export interface ServiceState {
    // Marketing
    googleAdsEnabled: boolean;
    googleAdsInvestment: number;
    googleAdsIsHighInvestment: boolean;
    googleAdsPercentage: number;
    googleAdsFixedValue: number;
    metaAdsEnabled: boolean;
    metaAdsFixedValue: number;
    metaAdsInvestment: number;
    landingPageEnabled: boolean;
    landingPageValue: number;
    siteInstitucionalEnabled: boolean;
    siteInstitucionalValue: number;
    socialMediaEnabled: boolean;
    socialMediaPackage: string;
    applyMarketingDiscount: boolean;
    marketingDiscountPercent: number;

    // Automação IA
    automationEnabled: boolean;
    automationAgents: {
        sdr: boolean;
        followUp: boolean;
        vendedor: boolean;
        monitorador: boolean;
        agendamento: boolean;
        posVenda: boolean;
    };
    applyAutomationDiscount: boolean;
    automationDiscountPercent: number;

    // SaaS
    saasEnabled: boolean;
    saasPeriod: string;
    saasMaintenanceEnabled: boolean;

    // Propostas
    showProtagonista: boolean;
}

export const useCalculatorController = () => {
    const navigate = useNavigate();
    const [lockedROIValue, setLockedROIValue] = useState<number | null>(null);

    // Carrega o valor travado do localStorage ao montar o componente
    useEffect(() => {
        const stored = localStorage.getItem('lockedROIValue');
        if (stored) {
            setLockedROIValue(Number(stored));
        }

        // Listener para mudanças no localStorage (quando valor é travado/destravado)
        const handleStorageChange = () => {
            const updated = localStorage.getItem('lockedROIValue');
            setLockedROIValue(updated ? Number(updated) : null);
        };

        window.addEventListener('storage', handleStorageChange);

        // Polling para mudanças quando ambas as páginas estão abertas na mesma aba
        const interval = setInterval(handleStorageChange, 1000);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, []);

    const [services, setServices] = useState<ServiceState>({
        googleAdsEnabled: false,
        googleAdsInvestment: 0,
        googleAdsIsHighInvestment: false,
        googleAdsPercentage: 20,
        googleAdsFixedValue: 1500,
        metaAdsEnabled: false,
        metaAdsFixedValue: 1000,
        metaAdsInvestment: 0,
        landingPageEnabled: false,
        landingPageValue: 1500,
        siteInstitucionalEnabled: false,
        siteInstitucionalValue: 1000,
        socialMediaEnabled: false,
        socialMediaPackage: "package1",
        applyMarketingDiscount: false,
        marketingDiscountPercent: 30,
        automationEnabled: false,
        automationAgents: {
            sdr: false,
            followUp: false,
            vendedor: false,
            monitorador: false,
            agendamento: false,
            posVenda: false
        },
        applyAutomationDiscount: false,
        automationDiscountPercent: 30,
        saasEnabled: false,
        saasPeriod: "7-14",
        saasMaintenanceEnabled: false,
        showProtagonista: false
    });

    const updateService = useCallback((updates: Partial<ServiceState>) => {
        setServices(prev => ({ ...prev, ...updates }));
    }, []);

    const updateAgent = useCallback((agent: keyof ServiceState['automationAgents'], value: boolean) => {
        setServices(prev => ({
            ...prev,
            automationAgents: {
                ...prev.automationAgents,
                [agent]: value
            }
        }));
    }, []);

    // Cálculos
    const calculations = useMemo(() => {
        let marketingTotal = 0;
        let automationTotal = 0;
        let saasTotal = 0;
        let clientInvestmentTotal = 0;

        // Marketing - Google Ads
        if (services.googleAdsEnabled) {
            clientInvestmentTotal += services.googleAdsInvestment;

            if (services.googleAdsIsHighInvestment && services.googleAdsInvestment > 2250) {
                // ROI 400% = faturamento estimado 4x o investimento
                const estimatedRevenue = services.googleAdsInvestment * 4;
                marketingTotal += (estimatedRevenue * services.googleAdsPercentage) / 100;
            } else {
                marketingTotal += services.googleAdsFixedValue;
            }
        }

        // Marketing - Meta Ads
        if (services.metaAdsEnabled) {
            clientInvestmentTotal += services.metaAdsInvestment;
            marketingTotal += services.metaAdsFixedValue;
        }

        // Marketing - Landing Page
        if (services.landingPageEnabled) {
            marketingTotal += services.landingPageValue;
        }

        // Marketing - Site Institucional
        if (services.siteInstitucionalEnabled) {
            marketingTotal += services.siteInstitucionalValue;
        }

        // Marketing - Social Media
        if (services.socialMediaEnabled) {
            const socialMediaPrices: Record<string, number> = {
                "package1": 1000, // 2 videos + 6 posts
                "package2": 1500, // 3 videos + 8 posts
                "package3": 2000  // 4 videos + 10 posts
            };
            marketingTotal += socialMediaPrices[services.socialMediaPackage] || 0;
        }

        // Aplicar desconto de marketing se ambos os serviços estão ativos e desconto foi selecionado
        const allMarketingEnabled = services.googleAdsEnabled && services.metaAdsEnabled;
        if (allMarketingEnabled && services.applyMarketingDiscount) {
            marketingTotal *= (100 - services.marketingDiscountPercent) / 100;
        }

        // Automação IA
        if (services.automationEnabled) {
            automationTotal += 2000; // Taxa de implementação

            const enabledAgents = Object.values(services.automationAgents).filter(Boolean).length;
            automationTotal += enabledAgents * 1500; // R$ 1.500 por agente

            // Aplicar desconto de automação se 4+ agentes estão ativos e desconto foi selecionado
            if (enabledAgents >= 4 && services.applyAutomationDiscount) {
                automationTotal *= (100 - services.automationDiscountPercent) / 100;
            }
        }

        // SaaS
        if (services.saasEnabled) {
            const saasPrices: Record<string, number> = {
                "7-14": 1200,
                "15-30": 2400,
                "31-60": 4800,
                "61-120": 9600
            };
            saasTotal += saasPrices[services.saasPeriod] || 0;

            if (services.saasMaintenanceEnabled) {
                saasTotal += 350; // Manutenção mensal
            }
        }

        let total = marketingTotal + automationTotal + saasTotal;
        let totalWithInvestment = total + clientInvestmentTotal;

        const enabledAgents = Object.values(services.automationAgents).filter(Boolean).length;

        // Proposta Única: simples soma de todos os serviços sem desconto nenhum
        let marketingOriginal = 0;
        if (services.googleAdsEnabled) {
            if (services.googleAdsIsHighInvestment && services.googleAdsInvestment > 2250) {
                const estimatedRevenue = services.googleAdsInvestment * 4;
                marketingOriginal += (estimatedRevenue * services.googleAdsPercentage) / 100;
            } else {
                marketingOriginal += services.googleAdsFixedValue;
            }
        }
        if (services.metaAdsEnabled) {
            marketingOriginal += services.metaAdsFixedValue;
        }
        if (services.landingPageEnabled) {
            marketingOriginal += services.landingPageValue;
        }
        if (services.siteInstitucionalEnabled) {
            marketingOriginal += services.siteInstitucionalValue;
        }
        if (services.socialMediaEnabled) {
            const socialMediaPrices: Record<string, number> = {
                "package1": 1000,
                "package2": 1500,
                "package3": 2000
            };
            marketingOriginal += socialMediaPrices[services.socialMediaPackage] || 0;
        }

        let automationOriginal = 0;
        if (services.automationEnabled) {
            automationOriginal += 2000 + (enabledAgents * 1500);
        }

        // Proposta Única: apenas soma simples
        const propostaUnica = marketingOriginal + automationOriginal + saasTotal;

        // Proposta Protagonista: idêntica à única, mas com descontos aplicados se selecionados
        let protagonistaServicos = propostaUnica;

        // Aplicar desconto de marketing se configurado
        if (allMarketingEnabled && services.applyMarketingDiscount) {
            const marketingComDesconto = marketingOriginal * (100 - services.marketingDiscountPercent) / 100;
            protagonistaServicos = marketingComDesconto + automationOriginal + saasTotal;
        }

        // Aplicar desconto de automação se configurado (4+ agentes)
        if (enabledAgents >= 4 && services.applyAutomationDiscount && services.automationEnabled) {
            const automacaoComDesconto = automationOriginal * (100 - services.automationDiscountPercent) / 100;
            // Se já tem desconto de marketing aplicado, usar o marketing com desconto
            if (allMarketingEnabled && services.applyMarketingDiscount) {
                const marketingComDesconto = marketingOriginal * (100 - services.marketingDiscountPercent) / 100;
                protagonistaServicos = marketingComDesconto + automacaoComDesconto + saasTotal;
            } else {
                protagonistaServicos = marketingOriginal + automacaoComDesconto + saasTotal;
            }
        }

        // Dois cenários (investimento do cliente é ADICIONADO depois)
        const propostas = {
            unica: propostaUnica + clientInvestmentTotal,
            protagonista: protagonistaServicos + clientInvestmentTotal
        };

        return {
            marketing: marketingTotal,
            automation: automationTotal,
            saas: saasTotal,
            clientInvestment: clientInvestmentTotal,
            total,
            totalWithInvestment,
            propostas,
            canApplyMarketingDiscount: allMarketingEnabled,
            canApplyAutomationDiscount: enabledAgents >= 4,
            hasMarketingDiscount: allMarketingEnabled && services.applyMarketingDiscount,
            hasAutomationDiscount: enabledAgents >= 4 && services.applyAutomationDiscount
        };
    }, [services]);

    const downloadProposal = () => {
        const content = `
PROPOSTA DE MARKETING DIGITAL E AUTOMAÇÃO
==========================================

RESUMO DE CUSTOS:
-----------------
Marketing: R$ ${calculations.marketing.toLocaleString('pt-BR')}
${calculations.clientInvestment > 0 ? `Investimento do Cliente: R$ ${calculations.clientInvestment.toLocaleString('pt-BR')}` : ''}
Automação IA: R$ ${calculations.automation.toLocaleString('pt-BR')}
SaaS: R$ ${calculations.saas.toLocaleString('pt-BR')}

SUBTOTAL (Serviços): R$ ${calculations.total.toLocaleString('pt-BR')}
TOTAL COM INVESTIMENTO: R$ ${calculations.totalWithInvestment.toLocaleString('pt-BR')}

DETALHAMENTO DOS SERVIÇOS:
--------------------------
${services.googleAdsEnabled ? `
Google Ads:
- Valor da Gestão: R$ ${(services.googleAdsIsHighInvestment && services.googleAdsInvestment > 2250 ? (services.googleAdsInvestment * 4 * services.googleAdsPercentage) / 100 : services.googleAdsFixedValue).toLocaleString('pt-BR')}
${services.googleAdsInvestment > 0 ? `- Investimento Cliente: R$ ${services.googleAdsInvestment.toLocaleString('pt-BR')}` : ''}
` : ''}

${services.metaAdsEnabled ? `
Meta Ads (Facebook + Instagram):
- Valor da Gestão: R$ ${(services.metaAdsFixedValue + (services.metaAdsInvestment * 0.6)).toLocaleString('pt-BR')}
${services.metaAdsInvestment > 0 ? `- Investimento Cliente: R$ ${services.metaAdsInvestment.toLocaleString('pt-BR')}` : ''}
` : ''}

${services.landingPageEnabled ? `
Landing Page: R$ ${services.landingPageValue.toLocaleString('pt-BR')}
` : ''}

${services.siteInstitucionalEnabled ? `
Site Institucional: R$ ${services.siteInstitucionalValue.toLocaleString('pt-BR')}
` : ''}

${services.socialMediaEnabled ? `
Social Media: R$ ${(() => {
                    const prices: Record<string, number> = { "package1": 1000, "package2": 1500, "package3": 2000 };
                    return prices[services.socialMediaPackage]?.toLocaleString('pt-BR') || '0';
                })()}
- Detalhes: ${services.socialMediaPackage === "package1" ? "2 vídeos + 6 postagens" : services.socialMediaPackage === "package2" ? "3 vídeos + 8 postagens" : "4 vídeos + 10 postagens"}
` : ''}

${services.automationEnabled ? `
Automação por IA: R$ ${calculations.automation.toLocaleString('pt-BR')}
- Taxa de Implementação: R$ 2.000
- Agentes Ativos: ${Object.values(services.automationAgents).filter(Boolean).length} x R$ 1.500
- Agentes: ${Object.entries(services.automationAgents).filter(([_, active]) => active).map(([key, _]) => {
                    const agentNames: Record<string, string> = {
                        sdr: "SDR",
                        followUp: "Follow Up",
                        vendedor: "Vendedor/Tira Dúvidas",
                        monitorador: "Monitorador de Conversas",
                        agendamento: "Agendamento",
                        posVenda: "Pós-Venda"
                    };
                    return agentNames[key];
                }).join(', ')}
` : ''}

${services.saasEnabled ? `
SaaS Development: R$ ${calculations.saas.toLocaleString('pt-BR')}
- Prazo: ${services.saasPeriod} dias
${services.saasMaintenanceEnabled ? '- Manutenção Mensal: R$ 350' : ''}
` : ''}

DESCONTOS APLICADOS:
-------------------
${calculations.hasMarketingDiscount ? `✓ Desconto de ${services.marketingDiscountPercent}% no Marketing` : ''}
${calculations.hasAutomationDiscount ? `✓ Desconto de ${services.automationDiscountPercent}% na Automação` : ''}

PROPOSTAS:
----------
🔥 PROPOSTA ÚNICA: R$ ${calculations.propostas.unica.toLocaleString('pt-BR')}
   Simples soma de todos os serviços + investimento cliente (sem desconto)

${services.showProtagonista ? `🎯 PROPOSTA PROTAGONISTA: R$ ${calculations.propostas.protagonista.toLocaleString('pt-BR')}
   Desconto aplicado nos serviços + investimento cliente
` : ''}

Data: ${new Date().toLocaleDateString('pt-BR')}
  `.trim();

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `proposta-marketing-${new Date().getTime()}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return {
        state: {
            services,
            lockedROIValue,
            calculations
        },
        actions: {
            updateService,
            updateAgent,
            downloadProposal,
            navigate
        }
    };
};
