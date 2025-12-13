import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"

interface PlaceholderPageProps {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

const PlaceholderPage = ({ title, description, icon: Icon }: PlaceholderPageProps) => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-card rounded-xl p-8 shadow-card border-border">
        <div className="flex items-center gap-4">
          <Icon className="w-10 h-10 text-primary" />
          <div>
            <h1 className="text-3xl font-bold mb-2 text-card-foreground">{title}</h1>
            <p className="text-muted-foreground text-lg">{description}</p>
          </div>
        </div>
      </div>

      {/* Em Breve Card */}
      <Card className="bg-gradient-card shadow-card border-border max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-gradient-accent">
              <Clock className="w-12 h-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Em Breve</CardTitle>
          <CardDescription className="text-lg">
            Esta funcionalidade está sendo desenvolvida e estará disponível em breve.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="space-y-2">
            <p className="text-muted-foreground">
              Estamos trabalhando para trazer esta funcionalidade para você.
            </p>
            <p className="text-muted-foreground">
              Enquanto isso, explore as outras funcionalidades disponíveis.
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <Link to="/">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar ao Dashboard
              </Button>
            </Link>
            <Link to="/calculadora">
              <Button className="bg-gradient-brand hover:bg-primary/90">
                Ir para Calculadora
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Features Preview */}
      <Card className="bg-gradient-card shadow-card border-border max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Funcionalidades Previstas</CardTitle>
          <CardDescription>
            O que você pode esperar quando esta seção estiver pronta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-gradient-accent">
              <h4 className="font-medium text-card-foreground mb-2">Interface Intuitiva</h4>
              <p className="text-sm text-muted-foreground">
                Design moderno e fácil de usar, seguindo os padrões da plataforma DashMed Pro
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-accent">
              <h4 className="font-medium text-card-foreground mb-2">Integração Completa</h4>
              <p className="text-sm text-muted-foreground">
                Conectado com todas as outras funcionalidades da plataforma
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-accent">
              <h4 className="font-medium text-card-foreground mb-2">Relatórios Detalhados</h4>
              <p className="text-sm text-muted-foreground">
                Análises e métricas para otimizar seus resultados
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-accent">
              <h4 className="font-medium text-card-foreground mb-2">Automação Inteligente</h4>
              <p className="text-sm text-muted-foreground">
                Processos automatizados para maior eficiência
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PlaceholderPage