/**
 * Componente de Validação do Projeto Supabase
 * Valida que o projeto está configurado corretamente na inicialização
 */

import { useEffect, useState } from 'react';
import { validateSupabaseProject, validateSession } from '@/integrations/supabase/validator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SupabaseProjectValidator({ children }: { children: React.ReactNode }) {
  const [validation, setValidation] = useState<{
    projectValid: boolean;
    sessionValid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkValidation = async () => {
      setIsChecking(true);

      // Validar configuração do projeto
      const projectValidation = validateSupabaseProject();

      // Validar sessão
      const sessionValidation = await validateSession();

      setValidation({
        projectValid: projectValidation.isValid,
        sessionValid: sessionValidation.isFromCorrectProject,
        errors: [...projectValidation.errors, ...sessionValidation.errors],
        warnings: projectValidation.warnings,
      });

      setIsChecking(false);

      // Log no console para debug
      if (!projectValidation.isValid || !sessionValidation.isFromCorrectProject) {
        console.error('❌ VALIDAÇÃO DO PROJETO FALHOU:', {
          projectValid: projectValidation.isValid,
          sessionValid: sessionValidation.isFromCorrectProject,
          errors: [...projectValidation.errors, ...sessionValidation.errors],
          warnings: projectValidation.warnings,
        });
      } else if (projectValidation.warnings.length > 0) {
        console.warn('⚠️ AVISOS DE VALIDAÇÃO:', projectValidation.warnings);
      } else {
        console.log('✅ Validação do projeto Supabase: OK');
      }
    };

    checkValidation();
  }, []);

  if (isChecking) {
    return null; // Não mostrar nada enquanto verifica
  }

  if (!validation) {
    return null;
  }

  // Se tudo estiver OK, renderizar normalmente
  if (validation.projectValid && validation.sessionValid && validation.errors.length === 0) {
    return <>{children}</>;
  }

  // Se houver erros críticos, mostrar alerta
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-2xl w-full space-y-4">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Erro de Configuração do Projeto</AlertTitle>
          <AlertDescription>
            O projeto Supabase não está configurado corretamente. Isso pode causar
            perda de dados ou criação de dados no banco errado.
          </AlertDescription>
        </Alert>

        {validation.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erros Encontrados:</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside mt-2 space-y-1">
                {validation.errors.map((error, index) => (
                  <li key={index} className="text-sm">
                    {error}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {validation.warnings.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Avisos:</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside mt-2 space-y-1">
                {validation.warnings.map((warning, index) => (
                  <li key={index} className="text-sm">
                    {warning}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            onClick={() => {
              // Limpar localStorage e recarregar
              localStorage.clear();
              sessionStorage.clear();
              window.location.reload();
            }}
            variant="default"
          >
            Limpar Cache e Recarregar
          </Button>
          <Button
            onClick={() => {
              // Recarregar página
              window.location.reload();
            }}
            variant="outline"
          >
            Recarregar Página
          </Button>
        </div>

        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Projeto Esperado:</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-1 text-sm">
              <p>
                <strong>Project Ref:</strong> adzaqkduxnpckbcuqpmg
              </p>
              <p>
                <strong>URL:</strong> https://adzaqkduxnpckbcuqpmg.supabase.co
              </p>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}


