import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ScriptSelector } from "@/components/prospecting/ScriptSelector";
import { ProspectingSession } from "@/components/prospecting/ProspectingSession";
import { StartDailyReportCard } from "@/components/prospecting/StartDailyReportCard";
import { HistoricalReportsPanel } from "@/components/prospecting/HistoricalReportsPanel";
import { ContactForm } from "@/components/crm/ContactForm";
import { Button } from "@/components/ui/button";
import { ProspectingScript } from "@/types/prospecting";
import { useProspectingSessions } from "@/hooks/useProspectingSessions";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";
import { BarChart3 } from "lucide-react";

export default function ProspectingGuide() {
  const navigate = useNavigate();
  const [selectedScript, setSelectedScript] = useState<ProspectingScript | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [showHistoricalPanel, setShowHistoricalPanel] = useState(false);
  const [pendingSessionData, setPendingSessionData] = useState<{
    scriptId?: string;
    result: 'atendimento_encerrado' | 'contato_decisor';
  } | null>(null);
  const { createSession } = useProspectingSessions();
  const { toast } = useToast();
  const { isAdmin } = useUserProfile();

  const handleSelectScript = (script: ProspectingScript) => {
    setSelectedScript(script);
    setSessionActive(true);
  };

  const handleExit = () => {
    setSessionActive(false);
    setSelectedScript(null);
    setPendingSessionData(null);
  };

  const handleFinish = async (result: 'atendimento_encerrado' | 'contato_decisor') => {
    if (result === 'contato_decisor') {
      console.log('🎯 Usuário escolheu: Contato do Decisor Adquirido');
      // Guardar dados para registrar depois de criar o contato
      setPendingSessionData({
        scriptId: selectedScript?.id,
        result,
      });
      console.log('📝 Dados da sessão salvos:', { scriptId: selectedScript?.id, result });
      // Importante: Sair da sessão PRIMEIRO para desmontar a tela preta
      setSessionActive(false);
      setSelectedScript(null);
      console.log('🚪 Sessão encerrada, abrindo formulário...');
      // Depois abrir o formulário (pequeno delay para garantir renderização)
      setTimeout(() => {
        console.log('✅ Abrindo formulário de contato');
        setShowContactForm(true);
      }, 100);
    } else {
      // Registrar sessão imediatamente
      try {
        await createSession({
          scriptId: selectedScript?.id,
          result,
        });
        
        toast({
          title: 'Atendimento registrado',
          description: 'O atendimento foi contabilizado nas suas métricas.',
        });
        handleExit();
      } catch (error) {
        console.error('Error finishing session:', error);
      }
    }
  };

  const handleContactCreated = async (dealId?: string) => {
    console.log('💾 handleContactCreated chamado com dealId:', dealId);
    console.log('📊 pendingSessionData:', pendingSessionData);
    
    // Registrar a sessão agora que o contato foi criado
    if (pendingSessionData) {
      try {
        console.log('🔄 Tentando registrar sessão...');
        await createSession({
          scriptId: pendingSessionData.scriptId,
          result: pendingSessionData.result,
        });
        console.log('✅ Sessão registrada com sucesso!');
        
        toast({
          title: 'Sucesso! 🎉',
          description: 'Contato adicionado ao CRM e atendimento contabilizado na sua meta.',
        });
      } catch (error) {
        console.error('❌ Erro ao criar sessão:', error);
        toast({
          variant: 'destructive',
          title: 'Erro ao registrar atendimento',
          description: 'O contato foi criado mas o atendimento não foi contabilizado.',
        });
      }
    } else {
      console.log('⚠️ Nenhum pendingSessionData encontrado');
      toast({
        title: 'Contato adicionado ao CRM',
        description: 'O lead foi registrado com sucesso no pipeline.',
      });
    }
    
    console.log('🧹 Limpando estados...');
    setShowContactForm(false);
    setPendingSessionData(null);
    
    // Navegar para o CRM e destacar o deal criado
    console.log('🚀 Navegando para CRM...');
    if (dealId) {
      navigate(`/crm?highlightDeal=${dealId}`);
    } else {
      navigate('/crm');
    }
  };

  if (sessionActive && selectedScript) {
    return (
      <>
        <ProspectingSession
          script={selectedScript}
          onExit={handleExit}
          onFinish={handleFinish}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-4">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-full border border-primary/20">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-primary">Sistema de Performance Ativo</span>
          </div>
          {isAdmin && (
            <Button
              onClick={() => setShowHistoricalPanel(true)}
              variant="outline"
              className="gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Relatórios Históricos
            </Button>
          )}
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
          Guia de Prospecção
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Ferramentas e scripts para maximizar sua performance em prospecção
        </p>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Card para iniciar relatório diário */}
        <StartDailyReportCard />
        
        {/* Seção de Scripts */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              Scripts de Prospecção
            </h2>
          </div>
          
          <ScriptSelector
            onSelectScript={handleSelectScript}
            onCreateNew={() => {
              // Criar novo é feito pelo ScriptConfiguration
            }}
          />
        </div>
      </div>


      {/* Modal de cadastro de contato */}
      {showContactForm && (
        <ContactForm
          initialStage="lead_novo"
          onSuccess={handleContactCreated}
          onCancel={() => {
            console.log('❌ Usuário cancelou o formulário');
            setShowContactForm(false);
            setPendingSessionData(null);
          }}
          forceOpen={showContactForm}
          trigger={<Button style={{ display: 'none' }} />}
        />
      )}

      {/* Painel de Relatórios Históricos */}
      <HistoricalReportsPanel
        isOpen={showHistoricalPanel}
        onClose={() => setShowHistoricalPanel(false)}
      />
    </div>
  );
}

