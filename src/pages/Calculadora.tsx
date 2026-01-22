import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useCalculatorController } from "@/hooks/controllers/useCalculatorController"
import { Calculator as CalculatorIcon, TrendingUp, Bot, Code, Star, Target, Crown, ArrowRight, Lock } from "lucide-react"

const Calculadora = () => {
  const { state, actions } = useCalculatorController();

  const {
    services,
    lockedROIValue,
    calculations
  } = state;

  const {
    updateService,
    updateAgent,
    downloadProposal,
    navigate
  } = actions;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-brand rounded-xl p-8 text-white shadow-brand">
        <div className="flex items-center gap-4">
          <CalculatorIcon className="w-10 h-10" />
          <div>
            <h1 className="text-3xl font-bold mb-2">Calculadora de Precificação</h1>
            <p className="text-white/90 text-lg">
              Monte propostas personalizadas com cálculos automáticos
            </p>
          </div>
        </div>
      </div>

      {/* Card ROI - Novo card verde para acessar calculadora de ROI */}
      <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-200/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Target className="w-5 h-5" />
            Calculadora de ROI
          </CardTitle>
          <CardDescription>
            Calcule o Retorno Sobre o Investimento das suas campanhas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Valor Travado da ROI:</p>
              {lockedROIValue ? (
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-green-600" />
                  <span className="text-lg font-bold text-green-700">
                    R$ {lockedROIValue.toLocaleString('pt-BR')}
                  </span>
                </div>
              ) : (
                <span className="text-muted-foreground">Nenhum valor travado</span>
              )}
            </div>
            <Button
              onClick={() => navigate('/calculadora-roi')}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              Acessar ROI <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Serviços - Coluna esquerda */}
        <div className="lg:col-span-2 space-y-6">

          {/* Marketing */}
          <Card className="bg-gradient-card shadow-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Marketing Digital
              </CardTitle>
              <CardDescription>Gestão de tráfego e campanhas publicitárias</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Google Ads */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="google-ads" className="text-base font-medium">Gestor de Tráfego (Google Ads)</Label>
                  <Switch
                    id="google-ads"
                    checked={services.googleAdsEnabled}
                    onCheckedChange={(checked) => updateService({ googleAdsEnabled: checked })}
                  />
                </div>

                {services.googleAdsEnabled && (
                  <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                    <div className="space-y-2">
                      <Label>Investimento do Cliente (R$)</Label>
                      <Input
                        type="number"
                        value={services.googleAdsInvestment}
                        onChange={(e) => updateService({ googleAdsInvestment: Number(e.target.value) })}
                        placeholder="Ex: 5000"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={services.googleAdsIsHighInvestment}
                        onCheckedChange={(checked) => updateService({ googleAdsIsHighInvestment: checked })}
                      />
                      <Label>Investimento acima de R$ 2.250 (usar porcentagem)</Label>
                    </div>

                    {services.googleAdsIsHighInvestment && (
                      <div className="space-y-2">
                        <Label>Porcentagem sobre faturamento estimado: {services.googleAdsPercentage}%</Label>
                        <Slider
                          value={[services.googleAdsPercentage]}
                          onValueChange={([value]) => updateService({ googleAdsPercentage: value })}
                          max={25}
                          min={15}
                          step={1}
                          className="w-full"
                        />
                        <div className="text-sm text-muted-foreground">
                          Faturamento estimado (ROI 400%): R$ {(services.googleAdsInvestment * 4).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    )}

                    {(!services.googleAdsIsHighInvestment || services.googleAdsInvestment <= 2250) && (
                      <div className="space-y-2">
                        <Label>Valor da Gestão (R$)</Label>
                        <Input
                          type="number"
                          value={services.googleAdsFixedValue}
                          onChange={(e) => updateService({ googleAdsFixedValue: Number(e.target.value) })}
                          placeholder="Ex: 1500"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              {/* Meta Ads */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="meta-ads" className="text-base font-medium">MetaADS (Facebook + Instagram)</Label>
                  <Switch
                    id="meta-ads"
                    checked={services.metaAdsEnabled}
                    onCheckedChange={(checked) => updateService({ metaAdsEnabled: checked })}
                  />
                </div>

                {services.metaAdsEnabled && (
                  <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                    <div className="space-y-2">
                      <Label>Valor Fixo (R$)</Label>
                      <Input
                        type="number"
                        value={services.metaAdsFixedValue}
                        onChange={(e) => updateService({ metaAdsFixedValue: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Investimento do Cliente (R$)</Label>
                      <Input
                        type="number"
                        value={services.metaAdsInvestment}
                        onChange={(e) => updateService({ metaAdsInvestment: Number(e.target.value) })}
                        placeholder="Ex: 10000"
                      />
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Landing Page */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="landing-page" className="text-base font-medium">Landing Page</Label>
                  <Switch
                    id="landing-page"
                    checked={services.landingPageEnabled}
                    onCheckedChange={(checked) => updateService({ landingPageEnabled: checked })}
                  />
                </div>

                {services.landingPageEnabled && (
                  <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                    <div className="space-y-2">
                      <Label>Valor: R$ {services.landingPageValue.toLocaleString('pt-BR')}</Label>
                      <Slider
                        value={[services.landingPageValue]}
                        onValueChange={([value]) => updateService({ landingPageValue: value })}
                        max={2000}
                        min={1500}
                        step={50}
                        className="w-full"
                      />
                      <div className="text-sm text-muted-foreground">
                        Variação: R$ 1.500 - R$ 2.000
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Site Institucional */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="site-institucional" className="text-base font-medium">Site Institucional</Label>
                  <Switch
                    id="site-institucional"
                    checked={services.siteInstitucionalEnabled}
                    onCheckedChange={(checked) => updateService({ siteInstitucionalEnabled: checked })}
                  />
                </div>

                {services.siteInstitucionalEnabled && (
                  <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                    <div className="space-y-2">
                      <Label>Valor: R$ {services.siteInstitucionalValue.toLocaleString('pt-BR')}</Label>
                      <Slider
                        value={[services.siteInstitucionalValue]}
                        onValueChange={([value]) => updateService({ siteInstitucionalValue: value })}
                        max={1500}
                        min={1000}
                        step={50}
                        className="w-full"
                      />
                      <div className="text-sm text-muted-foreground">
                        Variação: R$ 1.000 - R$ 1.500
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Social Media */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="social-media" className="text-base font-medium">Social Media</Label>
                  <Switch
                    id="social-media"
                    checked={services.socialMediaEnabled}
                    onCheckedChange={(checked) => updateService({ socialMediaEnabled: checked })}
                  />
                </div>

                {services.socialMediaEnabled && (
                  <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                    <div className="space-y-3">
                      <Label>Pacotes disponíveis:</Label>
                      {[
                        { key: "package1", label: "2 vídeos + 6 postagens", price: "R$ 1.000" },
                        { key: "package2", label: "3 vídeos + 8 postagens", price: "R$ 1.500" },
                        { key: "package3", label: "4 vídeos + 10 postagens", price: "R$ 2.000" }
                      ].map(({ key, label, price }) => (
                        <div key={key} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id={key}
                            name="socialMediaPackage"
                            checked={services.socialMediaPackage === key}
                            onChange={() => updateService({ socialMediaPackage: key })}
                            className="w-4 h-4 text-primary"
                          />
                          <Label htmlFor={key}>{label} - {price}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {calculations.canApplyMarketingDiscount && (
                <div className="space-y-3">
                  <Separator />
                  <div className="flex items-center justify-between p-3 bg-accent/20 rounded-lg">
                    <Label htmlFor="marketing-discount" className="text-sm font-medium">
                      Aplicar desconto no marketing
                    </Label>
                    <Switch
                      id="marketing-discount"
                      checked={services.applyMarketingDiscount}
                      onCheckedChange={(checked) => updateService({ applyMarketingDiscount: checked })}
                    />
                  </div>
                  {services.applyMarketingDiscount && (
                    <div className="space-y-2 pl-4">
                      <Label>Desconto (%): {services.marketingDiscountPercent}%</Label>
                      <Slider
                        value={[services.marketingDiscountPercent]}
                        onValueChange={([value]) => updateService({ marketingDiscountPercent: value })}
                        max={50}
                        min={10}
                        step={5}
                        className="w-full"
                      />
                      <Badge className="bg-green-500 text-white">
                        Desconto de {services.marketingDiscountPercent}% aplicado no marketing
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Automação por IA */}
          <Card className="bg-gradient-card shadow-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                Automação por I.A.
              </CardTitle>
              <CardDescription>Agentes inteligentes para automatizar processos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="automation" className="text-base font-medium">Ativar Automação</Label>
                <Switch
                  id="automation"
                  checked={services.automationEnabled}
                  onCheckedChange={(checked) => updateService({ automationEnabled: checked })}
                />
              </div>

              {services.automationEnabled && (
                <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                  <Badge variant="outline">Taxa de implementação: R$ 2.000</Badge>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Agentes (R$ 1.500 cada):</Label>

                    {Object.entries({
                      sdr: "SDR",
                      followUp: "Follow Up",
                      vendedor: "Vendedor/Tira Dúvidas",
                      monitorador: "Monitorador de Conversas",
                      agendamento: "Agendamento",
                      posVenda: "Pós-Venda"
                    }).map(([key, label]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Switch
                          checked={services.automationAgents[key as keyof typeof services.automationAgents]}
                          onCheckedChange={(checked) => updateAgent(key as keyof typeof services.automationAgents, checked)}
                        />
                        <Label>{label}</Label>
                      </div>
                    ))}
                  </div>

                  {calculations.canApplyAutomationDiscount && (
                    <div className="space-y-3">
                      <Separator />
                      <div className="flex items-center justify-between p-3 bg-accent/20 rounded-lg">
                        <Label htmlFor="automation-discount" className="text-sm font-medium">
                          Aplicar desconto na automação (4+ agentes)
                        </Label>
                        <Switch
                          id="automation-discount"
                          checked={services.applyAutomationDiscount}
                          onCheckedChange={(checked) => updateService({ applyAutomationDiscount: checked })}
                        />
                      </div>
                      {services.applyAutomationDiscount && (
                        <div className="space-y-2 pl-4">
                          <Label>Desconto (%): {services.automationDiscountPercent}%</Label>
                          <Slider
                            value={[services.automationDiscountPercent]}
                            onValueChange={([value]) => updateService({ automationDiscountPercent: value })}
                            max={50}
                            min={10}
                            step={5}
                            className="w-full"
                          />
                          <Badge className="bg-green-500 text-white">
                            Desconto de {services.automationDiscountPercent}% aplicado na automação
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* SaaS e MicroSaaS */}
          <Card className="bg-gradient-card shadow-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5 text-primary" />
                SaaS e MicroSaaS
              </CardTitle>
              <CardDescription>Desenvolvimento de software personalizado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="saas" className="text-base font-medium">Incluir SaaS</Label>
                <Switch
                  id="saas"
                  checked={services.saasEnabled}
                  onCheckedChange={(checked) => updateService({ saasEnabled: checked })}
                />
              </div>

              {services.saasEnabled && (
                <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                  <div className="space-y-3">
                    <Label>Prazo de desenvolvimento:</Label>
                    {[
                      { key: "7-14", label: "7 a 14 dias", price: "R$ 1.200" },
                      { key: "15-30", label: "15 a 30 dias", price: "R$ 2.400" },
                      { key: "31-60", label: "31 a 60 dias", price: "R$ 4.800" },
                      { key: "61-120", label: "61 a 120 dias", price: "R$ 9.600" }
                    ].map(({ key, label, price }) => (
                      <div key={key} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id={key}
                          name="saasPeriod"
                          checked={services.saasPeriod === key}
                          onChange={() => updateService({ saasPeriod: key })}
                          className="w-4 h-4 text-primary"
                        />
                        <Label htmlFor={key}>{label} - {price}</Label>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={services.saasMaintenanceEnabled}
                      onCheckedChange={(checked) => updateService({ saasMaintenanceEnabled: checked })}
                    />
                    <Label>Manutenção mensal (+R$ 350)</Label>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resumo - Coluna direita */}
        <div className="space-y-6">
          {/* Resumo de Custos */}
          <Card className="bg-gradient-card shadow-card border-border sticky top-4 max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Resumo de Custos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Marketing:</span>
                  <span className="font-medium">R$ {calculations.marketing.toLocaleString('pt-BR')}</span>
                </div>
                {calculations.clientInvestment > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>+ Investimento do Cliente:</span>
                    <span>R$ {calculations.clientInvestment.toLocaleString('pt-BR')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Automação IA:</span>
                  <span className="font-medium">R$ {calculations.automation.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between">
                  <span>SaaS:</span>
                  <span className="font-medium">R$ {calculations.saas.toLocaleString('pt-BR')}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-semibold">
                  <span>Subtotal (Serviços):</span>
                  <span>R$ {calculations.total.toLocaleString('pt-BR')}</span>
                </div>
                {calculations.clientInvestment > 0 && (
                  <div className="flex justify-between text-lg font-bold text-primary">
                    <span>Total com Investimento:</span>
                    <span>R$ {calculations.totalWithInvestment.toLocaleString('pt-BR')}</span>
                  </div>
                )}
                {calculations.clientInvestment === 0 && (
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-primary">R$ {calculations.total.toLocaleString('pt-BR')}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Propostas */}
          <Card className="bg-gradient-card shadow-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                Cenários de Proposta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Proposta Única */}
              <div className="p-4 rounded-lg bg-gradient-brand text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4" />
                    <span className="font-bold">Proposta Única</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-white border-white hover:bg-white hover:text-primary"
                    onClick={() => updateService({ showProtagonista: !services.showProtagonista })}
                  >
                    {services.showProtagonista ? "Desativar" : "Ativar"} Protagonista
                  </Button>
                </div>
                <div className="text-2xl font-bold">
                  R$ {calculations.propostas.unica.toLocaleString('pt-BR')}
                </div>
                <p className="text-sm text-white/80">
                  Simples soma de todos os serviços + investimento cliente (sem desconto)
                </p>
              </div>

              {/* Proposta Protagonista */}
              {services.showProtagonista && (
                <div className="p-4 rounded-lg bg-gradient-accent border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-primary" />
                    <span className="font-bold">Proposta Protagonista</span>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    R$ {calculations.propostas.protagonista.toLocaleString('pt-BR')}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Desconto aplicado nos serviços + investimento cliente
                  </p>
                </div>
              )}

            </CardContent>
          </Card>

          {/* Gerar Proposta Detalhada */}
          <Card className="bg-gradient-card shadow-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                Gerar Proposta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-semibold">Detalhamento dos Serviços:</h4>

                {services.googleAdsEnabled && (
                  <div className="p-3 rounded-lg bg-accent/20">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Google Ads</span>
                      <span>R$ {(services.googleAdsIsHighInvestment && services.googleAdsInvestment > 2250
                        ? (services.googleAdsInvestment * 4 * services.googleAdsPercentage) / 100
                        : services.googleAdsFixedValue).toLocaleString('pt-BR')}</span>
                    </div>
                    {services.googleAdsInvestment > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Investimento cliente: R$ {services.googleAdsInvestment.toLocaleString('pt-BR')}
                      </div>
                    )}
                  </div>
                )}

                {services.metaAdsEnabled && (
                  <div className="p-3 rounded-lg bg-accent/20">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Meta Ads</span>
                      <span>R$ {(services.metaAdsFixedValue + (services.metaAdsInvestment * 0.6)).toLocaleString('pt-BR')}</span>
                    </div>
                    {services.metaAdsInvestment > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Investimento cliente: R$ {services.metaAdsInvestment.toLocaleString('pt-BR')}
                      </div>
                    )}
                  </div>
                )}

                {services.landingPageEnabled && (
                  <div className="p-3 rounded-lg bg-accent/20">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Landing Page</span>
                      <span>R$ {services.landingPageValue.toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                )}

                {services.siteInstitucionalEnabled && (
                  <div className="p-3 rounded-lg bg-accent/20">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Site Institucional</span>
                      <span>R$ {services.siteInstitucionalValue.toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                )}

                {services.socialMediaEnabled && (
                  <div className="p-3 rounded-lg bg-accent/20">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Social Media</span>
                      <span>R$ {(() => {
                        const prices: Record<string, number> = {
                          "package1": 1000,
                          "package2": 1500,
                          "package3": 2000
                        }
                        return prices[services.socialMediaPackage]?.toLocaleString('pt-BR') || '0'
                      })()}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {services.socialMediaPackage === "package1" && "2 vídeos + 6 postagens"}
                      {services.socialMediaPackage === "package2" && "3 vídeos + 8 postagens"}
                      {services.socialMediaPackage === "package3" && "4 vídeos + 10 postagens"}
                    </div>
                  </div>
                )}

                {calculations.hasMarketingDiscount && (
                  <div className="text-sm text-green-600 font-medium">
                    ✓ Desconto de {services.marketingDiscountPercent}% aplicado no marketing
                  </div>
                )}

                {services.automationEnabled && (
                  <div className="p-3 rounded-lg bg-accent/20">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Automação IA</span>
                      <span>R$ {calculations.automation.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Taxa implementação: R$ 2.000
                      <br />
                      Agentes ativos: {Object.values(services.automationAgents).filter(Boolean).length} x R$ 1.500
                    </div>
                  </div>
                )}

                {calculations.hasAutomationDiscount && (
                  <div className="text-sm text-green-600 font-medium">
                    ✓ Desconto de {services.automationDiscountPercent}% aplicado na automação
                  </div>
                )}

                {services.saasEnabled && (
                  <div className="p-3 rounded-lg bg-accent/20">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">SaaS Development</span>
                      <span>R$ {calculations.saas.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Prazo: {services.saasPeriod} dias
                      {services.saasMaintenanceEnabled && " + Manutenção mensal"}
                    </div>
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Proposta Única:</span>
                    <span className="text-primary">R$ {calculations.propostas.unica.toLocaleString('pt-BR')}</span>
                  </div>
                  {services.showProtagonista && (
                    <div className="flex justify-between font-bold text-lg">
                      <span>Proposta Protagonista:</span>
                      <span className="text-primary">R$ {calculations.propostas.protagonista.toLocaleString('pt-BR')}</span>
                    </div>
                  )}
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={downloadProposal}
              >
                <Crown className="w-4 h-4 mr-2" />
                Download da Proposta
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Calculadora