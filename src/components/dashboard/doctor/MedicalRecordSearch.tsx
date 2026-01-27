import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileText, Clock, ChevronRight, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePatients } from "@/hooks/usePatients";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Patient } from "@/types/medicalRecords";

// Simple debounce hook implementation
function useDebounceValue<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

export function MedicalRecordSearch() {
    const navigate = useNavigate();
    const { user } = useAuth();
    // Using searchPatients from usePatients hook
    const { searchPatients, patients: defaultPatients, isLoading: isLoadingDefault } = usePatients();

    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<Patient[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const debouncedSearchTerm = useDebounceValue(searchTerm, 500);

    useEffect(() => {
        const performSearch = async () => {
            if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                // Assuming searchPatients returns a Promise<Patient[]>
                const results = await searchPatients(debouncedSearchTerm);
                setSearchResults(results);
            } catch (error) {
                console.error("Search error:", error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        };

        performSearch();
    }, [debouncedSearchTerm, searchPatients]);

    // Determine what to display: search results or recent patients (default list)
    // Note: usePatients doesn't exactly have "recent" history, so we use the default list as fallback
    // which usually contains patients with recent appointments if optimized, or just a list.
    // Ideally, we'd have a specific `useRecentPatients` hook.
    const displayList = (searchTerm.length >= 2) ? searchResults : (defaultPatients || []).slice(0, 5);
    const isLoading = (searchTerm.length >= 2) ? isSearching : isLoadingDefault;
    const listTitle = (searchTerm.length >= 2) ? "Resultados da Pesquisa" : "Pacientes Recentes";

    const handlePatientClick = (patientId: string) => {
        navigate(`/prontuarios?id=${patientId}`);
    };

    return (
        <Card className="h-full border-border shadow-sm flex flex-col bg-card/50">
            <CardHeader className="pb-3 space-y-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        Prontuários & Histórico
                    </CardTitle>
                </div>
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Pesquisar paciente por nome ou CPF..."
                        className="pl-9 bg-background focus-visible:ring-primary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                if (searchResults.length > 0) {
                                    handlePatientClick(searchResults[0].id);
                                } else {
                                    // Navigate to full list with search param if no direct hit
                                    navigate(`/prontuarios?search=${searchTerm}`);
                                }
                            }
                        }}
                    />
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
                <div className="px-6 pb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider flex justify-between items-center">
                    <span>{listTitle}</span>
                    {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                </div>

                <ScrollArea className="flex-1 min-h-0">
                    <div className="divide-y divide-border/50">
                        {!isLoading && displayList.length === 0 && (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                {searchTerm.length >= 2 ? "Nenhum paciente encontrado." : "Nenhum paciente recente."}
                            </div>
                        )}

                        {displayList.map((patient) => (
                            <div
                                key={patient.id}
                                className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                                onClick={() => handlePatientClick(patient.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9 border border-border/50">
                                        <AvatarImage src={patient.profile_picture_url || ""} />
                                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                            {patient.full_name?.substring(0, 2).toUpperCase() || "PAC"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium text-sm text-foreground leading-none mb-1">
                                            {patient.full_name}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            {(patient as any).last_appointment ? (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {format(new Date((patient as any).last_appointment), "dd/MM 'às' HH:mm")}
                                                </span>
                                            ) : (
                                                <span className="italic">Sem consultas recentes</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                <div className="p-4 border-t mt-auto shrink-0">
                    <Button
                        variant="outline"
                        className="w-full text-xs gap-2"
                        onClick={() => navigate('/prontuarios')}
                    >
                        Ver todos os prontuários
                        <ChevronRight className="w-3 h-3" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
