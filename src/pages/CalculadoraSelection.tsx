import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Calculator, 
  Target, 
  TrendingUp, 
  DollarSign,
  ArrowRight,
  Sparkles,
  BarChart3
} from "lucide-react"
import { Link } from "react-router-dom"

const CalculadoraSelection = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary via-primary to-primary/90 rounded-3xl p-8 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <Calculator className="w-12 h-12" />
          <div>
            <h1 className="text-4xl font-bold mb-3">Central de Calculadoras</h1>
            <p className="text-white/90 text-xl leading-relaxed">
              Ferramentas avançadas para otimizar seus investimentos e estratégias
            </p>
          </div>
        </div>
      </div>

      {/* Calculator Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Calculadora de Precificação */}
        <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <CardHeader className="p-8 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-4 bg-primary/10 rounded-2xl group-hover:bg-primary/15 group-hover:scale-110 transition-all duration-300">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <Badge variant="outline" className="px-4 py-2 rounded-xl border-primary/30 text-primary bg-primary/10 font-medium">
                <Sparkles className="h-4 w-4 mr-2" />
                Precificação
              </Badge>
            </div>
            
            <CardTitle className="text-2xl font-bold text-card-foreground mb-3 tracking-tight">
              Calculadora de Precificação
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground leading-relaxed">
              Monte propostas personalizadas com cálculos automáticos para serviços de marketing digital, automação e SaaS
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-8 pt-0 relative">
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="font-medium">Marketing Digital (Google Ads, Meta Ads)</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="font-medium">Automação com IA</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="font-medium">Desenvolvimento SaaS</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="font-medium">Propostas Única e Protagonista</span>
              </div>
            </div>
            
            <Link to="/calculadora-precificacao">
              <Button className="w-full group-hover:shadow-lg transition-all duration-300 bg-primary hover:bg-primary/90 rounded-2xl py-6 text-base font-semibold">
                Acessar Calculadora
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Calculadora de ROI */}
        <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <CardHeader className="p-8 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-4 bg-green-500/10 rounded-2xl group-hover:bg-green-500/15 group-hover:scale-110 transition-all duration-300">
                <Target className="h-8 w-8 text-green-600" />
              </div>
              <Badge variant="outline" className="px-4 py-2 rounded-xl border-green-500/30 text-green-600 bg-green-500/10 font-medium">
                <BarChart3 className="h-4 w-4 mr-2" />
                ROI Analysis
              </Badge>
            </div>
            
            <CardTitle className="text-2xl font-bold text-card-foreground mb-3 tracking-tight">
              Calculadora de ROI
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground leading-relaxed">
              Calcule o Retorno Sobre o Investimento para campanhas no Meta Ads com métricas precisas e projeções realistas
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-8 pt-0 relative">
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium">Análise de CPM e CPC</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium">Projeção de Vendas</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium">Cálculo ROAS e ROI</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium">Otimização de Campanhas</span>
              </div>
            </div>
            
            <Link to="/calculadora-roi">
              <Button className="w-full group-hover:shadow-lg transition-all duration-300 bg-green-600 hover:bg-green-700 rounded-2xl py-6 text-base font-semibold text-white">
                Acessar Calculadora
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Features Comparison */}
      <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-lg rounded-3xl">
        <CardHeader className="p-8">
          <CardTitle className="text-2xl font-bold text-center mb-3">Comparativo de Recursos</CardTitle>
          <CardDescription className="text-center text-base">
            Escolha a ferramenta ideal para sua necessidade
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Precificação Features */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Calculadora de Precificação
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Cálculo automático de propostas</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Gestão de múltiplos serviços</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Descontos automáticos por volume</span>
                </div>
              </div>
            </div>

            {/* ROI Features */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                Calculadora de ROI
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-green-500/5">
                  <BarChart3 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Análise de performance detalhada</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-green-500/5">
                  <Target className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Projeções baseadas em métricas reais</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-green-500/5">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Otimização de campanhas Meta Ads</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CalculadoraSelection