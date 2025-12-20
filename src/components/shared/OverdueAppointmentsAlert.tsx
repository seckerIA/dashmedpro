import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Calendar, List } from "lucide-react";
import { useOverdueAppointments } from "@/hooks/useOverdueAppointments";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { OverdueAppointmentsList } from "./OverdueAppointmentsList";

export function OverdueAppointmentsAlert() {
  const { hasOverdue, overdueCount, isLoading } = useOverdueAppointments();
  const navigate = useNavigate();
  const [showList, setShowList] = useState(false);

  if (isLoading || !hasOverdue) {
    return null;
  }

  return (
    <>
      <Alert variant="destructive" className="border-red-500 bg-red-50 dark:bg-red-950">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle className="font-bold text-lg">Atenção: Consultas Pendentes!</AlertTitle>
        <AlertDescription className="mt-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-sm">
              Você tem <span className="font-bold text-lg">{overdueCount}</span> consulta(s) com mais de 12 horas
              sem marcação de comparecimento!{" "}
              <span className="font-medium">
                Verifique e atualize o status para manter o controle financeiro em dia.
              </span>
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowList(true)}
                variant="destructive"
                size="sm"
                className="bg-red-600 hover:bg-red-700 whitespace-nowrap"
              >
                <List className="h-4 w-4 mr-2" />
                Ver Lista ({overdueCount})
              </Button>
              <Button
                onClick={() => navigate("/calendar")}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900 whitespace-nowrap"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Ver Agenda
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      <OverdueAppointmentsList open={showList} onOpenChange={setShowList} />
    </>
  );
}
