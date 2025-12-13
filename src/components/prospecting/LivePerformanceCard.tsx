"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Phone, Users, TrendingUp, Clock, CheckCircle, BarChart3, X, Pause, Play, Settings } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDailyReport } from "@/hooks/useDailyReport";
import { useProspectingSessions } from "@/hooks/useProspectingSessions";
import { DailyReportSummaryModal } from "./DailyReportSummaryModal";
import { AnimatedProgressBar } from "./AnimatedProgressBar";

export function LivePerformanceCard() {
  const [isCardVisible, setIsCardVisible] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const { todayReport: todayMetrics, finishReport, isFinishing, isReportActive } = useDailyReport();
  const { todayStats } = useProspectingSessions();

  const handleToggleModal = () => setIsCardVisible(prev => !prev);

  const handleCloseModal = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setIsCardVisible(false);
  };

  const handleFinishReport = () => {
    finishReport();
  };

  const dailyCallsGoal = todayMetrics?.goal_calls ?? 0;
  const dailyContactsGoal = todayMetrics?.goal_contacts ?? 0;
  const totalCalls = todayStats?.total ?? 0;
  const totalContacts = todayStats?.contatosDecisores ?? 0;
  const conversionRate = totalCalls > 0 ? (totalContacts / totalCalls) * 100 : 0;

  return (
    <>
      {/* Botão Toggle Flutuante */}
      <motion.button
        onClick={handleToggleModal}
        className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg hover:shadow-xl transition-all duration-300 bg-red-600 cursor-pointer hover:bg-red-700"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5 }}
        title="Performance Diária - Clique para ver detalhes"
      >
        <AnimatePresence mode="wait">
          {isCardVisible ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <BarChart3 className="h-6 w-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

          {/* Modal do Card de Performance */}
      {isCardVisible && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={handleCloseModal}
          />
          
          {/* Card Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleCloseModal}>
            <div className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
                <Card
                  className={cn(
                    "relative w-full overflow-hidden border-red-500/50 bg-gradient-to-br from-red-900 via-red-800 to-red-900 p-8 shadow-2xl backdrop-blur-xl",
                    todayMetrics?.is_paused && "border-yellow-500/50"
                  )}
                >
                  {/* Botão de Fechar */}
                  <button
                    onClick={handleCloseModal}
                    className="absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-red-800 hover:bg-red-700 transition-colors"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>

                  {/* Glass morphism overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 backdrop-blur-3xl" />

                  {/* Animated gradient border effect */}
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 opacity-50 blur-xl" />

                  {/* Indicador de Pausa */}
                  {todayMetrics?.is_paused && (
                    <div className="absolute top-0 left-0 right-0 bg-yellow-500/20 border-b-2 border-yellow-500 p-2 text-center">
                      <p className="text-sm font-semibold text-yellow-700 flex items-center justify-center gap-2">
                        <Pause className="h-4 w-4" />
                        Cronômetro Pausado
                      </p>
                    </div>
                  )}

                  <div className={cn("relative z-10 space-y-6", todayMetrics?.is_paused && "mt-8")}>
                    {/* Header */}
                    <div className="flex items-center justify-between">
                <div>
                        <h2 className="text-2xl font-bold text-white">
                          Performance Diária
                        </h2>
                        <p className="text-sm text-red-200">
                          {todayMetrics ? 'Acompanhe seu progresso em tempo real' : 'Inicie um expediente para começar'}
                  </p>
                </div>
                      {todayMetrics && (
                        <motion.div
                          className="flex items-center gap-2 rounded-full bg-black px-4 py-2 backdrop-blur-sm"
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.5 }}
                        >
                          <Clock className="h-4 w-4 text-red-400" />
                          <span className="font-mono text-sm font-semibold text-white">
                            {'0h 0m'}
                          </span>
                        </motion.div>
                      )}
              </div>

                    {/* Botões de Controle */}
                    {todayMetrics ? (
                      <div className="flex gap-2">
                        {isReportActive ? (
                          <Button
                            onClick={handleFinishReport}
                            disabled={isFinishing}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            {isFinishing ? (
                              <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-600 rounded-full animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4" />
                                Finalizar Expediente
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button
                            onClick={() => {
                              // Navegar para a página de prospecção para iniciar expediente
                              window.location.href = '/prospeccao';
                            }}
                            className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                          >
                            <Play className="h-4 w-4" />
                            Iniciar Expediente
                          </Button>
                        )}
                        
                        <Button
                          onClick={() => setIsSummaryModalOpen(true)}
                          variant="outline"
                          size="sm"
                          className="gap-2"
                        >
                          <BarChart3 className="h-4 w-4" />
                          Resumo Diário
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-lg text-red-200 mb-4">
                          Nenhum expediente ativo encontrado
                        </p>
                        <p className="text-sm text-red-300 mb-6">
                          Vá para a página de Prospecção e inicie um expediente para ver suas métricas aqui
                        </p>
                        <Button
                          onClick={() => {
                            // Navegar para a página de prospecção para iniciar expediente
                            window.location.href = '/prospeccao';
                          }}
                          className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                        >
                          <Play className="h-4 w-4" />
                          Iniciar Expediente
                        </Button>
                      </div>
                    )}

                    {todayMetrics && (
                      <>
                        {/* Progress Bars */}
                        <div className="space-y-4 rounded-xl border border-red-600 bg-black p-6 backdrop-blur-sm">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center font-semibold">
                              <span className="text-white">Atendimentos Realizados</span>
                              <span className="text-white">{totalCalls}/{dailyCallsGoal}</span>
                            </div>
                            <AnimatedProgressBar value={totalCalls} maxValue={dailyCallsGoal} />
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center font-semibold">
                              <span className="text-white">Contatos Alcançados</span>
                              <span className="text-white">{totalContacts}/{dailyContactsGoal}</span>
                            </div>
                            <AnimatedProgressBar value={totalContacts} maxValue={dailyContactsGoal} variant="green" />
                          </div>
                        </div>

                        {/* Conversion Rate */}
                        <motion.div
                          className="flex items-center justify-between rounded-xl border border-red-600 bg-black p-6 backdrop-blur-sm"
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="rounded-full bg-red-800/30 p-3">
                              <TrendingUp className="h-6 w-6 text-red-400" />
                      </div>
                            <div>
                              <p className="text-sm text-red-200">Taxa de Conversão</p>
                              <p className="text-2xl font-bold text-white">
                                {conversionRate.toFixed(1)}%
                              </p>
                      </div>
                    </div>
                          <motion.div
                            className="text-4xl font-bold text-red-400"
                            animate={{
                              scale: [1, 1.1, 1],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              repeatType: "reverse",
                            }}
                          >
                            {conversionRate >= 50 ? "📈" : "📊"}
                          </motion.div>
                        </motion.div>

                        {/* Motivational Message */}
                        <motion.div
                          className="rounded-xl border border-red-600 bg-black p-4 text-center backdrop-blur-sm"
                          initial={{ scale: 0.95 }}
                          animate={{ scale: 1 }}
                          transition={{
                            duration: 0.5,
                            repeat: Infinity,
                            repeatType: "reverse",
                            repeatDelay: 3,
                          }}
                        >
                          <p className="text-lg font-semibold text-white">
                            {conversionRate >= 50 ? "🎉 Metas Atingidas! Excepcional!" : "⚡ Vamos lá! Você consegue!"}
                          </p>
                        </motion.div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                          <motion.div
                            className="rounded-lg border border-red-600 bg-black p-4 backdrop-blur-sm"
                            whileHover={{ scale: 1.05 }}
                          >
                            <div className="flex items-center gap-2">
                              <Phone className="h-5 w-5 text-red-400" />
                              <span className="text-sm text-red-200">Atendimentos</span>
                            </div>
                            <p className="mt-1 text-2xl font-bold text-white">
                              {totalCalls}
                            </p>
                          </motion.div>
                          <motion.div
                            className="rounded-lg border border-red-600 bg-black p-4 backdrop-blur-sm"
                            whileHover={{ scale: 1.05 }}
                          >
                            <div className="flex items-center gap-2">
                              <Users className="h-5 w-5 text-red-400" />
                              <span className="text-sm text-red-200">Contatos</span>
                  </div>
                            <p className="mt-1 text-2xl font-bold text-white">
                              {totalContacts}
                            </p>
                          </motion.div>
                        </div>
                      </>
                    )}
                  </div>
                </Card>
            </div>
            </div>
        </>
      )}

      {/* Modal de Resumo */}
      {todayMetrics && (
        <DailyReportSummaryModal 
          open={isSummaryModalOpen}
          onOpenChange={setIsSummaryModalOpen}
          report={todayMetrics}
        />
      )}
    </>
  );
}
