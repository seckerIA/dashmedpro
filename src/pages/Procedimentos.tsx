import { ProceduresCatalog } from '@/components/commercial/ProceduresCatalog';

const Procedimentos = () => {
    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-3xl font-bold">Tabela de Preços</h1>
                <p className="text-muted-foreground">
                    Gerencie os procedimentos e valores da sua clínica
                </p>
            </div>

            <ProceduresCatalog />
        </div>
    );
};

export default Procedimentos;
