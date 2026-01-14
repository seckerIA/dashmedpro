import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Zap } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { RecurringTransactionsManager } from "@/components/financial/RecurringTransactionsManager"

const FinancialRecurring = () => {
    const navigate = useNavigate()

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/financeiro')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Zap className="h-6 w-6 text-orange-500" />
                        Transações Recorrentes
                    </h1>
                    <p className="text-muted-foreground">Gerencie receitas e despesas que se repetem automaticamente</p>
                </div>
            </div>

            {/* Componente de Recorrências */}
            <RecurringTransactionsManager />
        </div>
    )
}

export default FinancialRecurring
