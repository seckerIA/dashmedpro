import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const dashmedLogo = '/dashmed-logo.png';

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate('/login')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Login
          </Button>
          <div className="text-center border-b-2 border-primary pb-6 mb-6">
            <img src={dashmedLogo} alt="DashMed Pro" className="h-16 w-auto mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-primary">Termos de Serviço</h1>
            <p className="text-muted-foreground mt-2">DashMed Pro - Sistema de Gestão para Clínicas</p>
          </div>
        </div>

        {/* Last Updated */}
        <div className="bg-primary/10 border-l-4 border-primary rounded-r-lg p-4 mb-8">
          <strong className="text-primary">Última atualização:</strong> 30 de Janeiro de 2026
        </div>

        {/* Acceptance Box */}
        <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-medium text-primary mb-3">✅ Aceitação dos Termos</h3>
          <p className="text-muted-foreground">
            Ao acessar ou usar o DashMed Pro, você concorda em estar vinculado a estes Termos de Serviço. Se você não concordar com qualquer parte destes termos, não poderá acessar ou usar nossos serviços. Estes termos constituem um acordo legal entre você e a DashMed Pro.
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-sm max-w-none text-foreground space-y-6">
          <h2 className="text-xl font-semibold text-primary border-b border-border pb-2">1. Definições</h2>
          <p className="text-muted-foreground">Para fins destes Termos de Serviço:</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><strong>"DashMed Pro", "nós", "nosso" ou "Empresa":</strong> refere-se à empresa responsável pela plataforma DashMed Pro.</li>
            <li><strong>"Serviço" ou "Plataforma":</strong> refere-se ao sistema DashMed Pro, incluindo website, aplicativo, API e todas as funcionalidades.</li>
            <li><strong>"Usuário", "você" ou "seu":</strong> refere-se à pessoa física ou jurídica que utiliza nossos serviços.</li>
            <li><strong>"Clínica":</strong> estabelecimento médico ou estético cadastrado na plataforma.</li>
            <li><strong>"Dados do Usuário":</strong> qualquer informação inserida, enviada ou gerada pelo usuário na plataforma.</li>
            <li><strong>"Integrações":</strong> conexões com serviços de terceiros (Meta, WhatsApp, etc.).</li>
          </ul>

          <h2 className="text-xl font-semibold text-primary border-b border-border pb-2">2. Descrição dos Serviços</h2>
          <p className="text-muted-foreground">O DashMed Pro é uma plataforma SaaS (Software as a Service) que oferece:</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><strong>CRM Médico:</strong> Gestão de pacientes, pipeline de vendas e follow-ups.</li>
            <li><strong>Agenda Médica:</strong> Agendamento de consultas e procedimentos.</li>
            <li><strong>Prontuário Eletrônico:</strong> Registro seguro de atendimentos médicos.</li>
            <li><strong>Gestão Financeira:</strong> Controle de receitas, despesas e contas.</li>
            <li><strong>Integração WhatsApp:</strong> Comunicação com pacientes via WhatsApp Business.</li>
            <li><strong>Relatórios de Campanhas:</strong> Integração com Meta Ads para análise de campanhas publicitárias.</li>
            <li><strong>Métricas e KPIs:</strong> Dashboards e relatórios de performance.</li>
          </ul>
          <div className="bg-muted border border-border rounded-lg p-4">
            <p className="text-muted-foreground">ℹ️ <strong>Nota:</strong> As funcionalidades disponíveis podem variar de acordo com o plano contratado.</p>
          </div>

          <h2 className="text-xl font-semibold text-primary border-b border-border pb-2">3. Cadastro e Conta</h2>
          
          <h3 className="text-lg font-medium">3.1 Requisitos</h3>
          <p className="text-muted-foreground">Para utilizar o DashMed Pro, você deve:</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Ter pelo menos 18 anos de idade.</li>
            <li>Fornecer informações verdadeiras, precisas e completas.</li>
            <li>Manter suas informações de cadastro atualizadas.</li>
            <li>Para funcionalidades médicas: possuir registro profissional válido (CRM, CREFITO, etc.).</li>
          </ul>

          <h3 className="text-lg font-medium">3.2 Segurança da Conta</h3>
          <p className="text-muted-foreground">Você é responsável por:</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Manter a confidencialidade de suas credenciais de acesso.</li>
            <li>Todas as atividades que ocorram em sua conta.</li>
            <li>Notificar-nos imediatamente sobre qualquer uso não autorizado.</li>
          </ul>
          <div className="bg-accent/50 border border-accent rounded-lg p-4">
            <p className="text-muted-foreground">⚠️ <strong>Importante:</strong> Nunca compartilhe suas credenciais de acesso. O DashMed Pro nunca solicitará sua senha por e-mail ou telefone.</p>
          </div>

          <h3 className="text-lg font-medium">3.3 Tipos de Usuários</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="bg-primary text-primary-foreground p-3 text-left">Perfil</th>
                  <th className="bg-primary text-primary-foreground p-3 text-left">Descrição</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border"><td className="p-3 font-medium">Administrador/Dono</td><td className="p-3">Acesso total ao sistema, gestão de equipe e configurações.</td></tr>
                <tr className="border-b border-border bg-muted/50"><td className="p-3 font-medium">Médico</td><td className="p-3">Acesso a agenda, prontuários próprios, financeiro.</td></tr>
                <tr className="border-b border-border"><td className="p-3 font-medium">Secretária</td><td className="p-3">Gestão de agenda, atendimento a pacientes, cadastros.</td></tr>
                <tr className="border-b border-border bg-muted/50"><td className="p-3 font-medium">Vendedor</td><td className="p-3">CRM, pipeline de vendas, leads.</td></tr>
                <tr className="border-b border-border"><td className="p-3 font-medium">Gestor de Tráfego</td><td className="p-3">Relatórios de campanhas e métricas de marketing.</td></tr>
              </tbody>
            </table>
          </div>

          <h2 className="text-xl font-semibold text-primary border-b border-border pb-2">4. Uso Aceitável</h2>
          
          <h3 className="text-lg font-medium">4.1 Você Concorda em:</h3>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Utilizar o serviço apenas para fins legais e conforme estes termos.</li>
            <li>Respeitar a legislação aplicável, incluindo normas de saúde e proteção de dados.</li>
            <li>Obter consentimento adequado de pacientes para tratamento de seus dados.</li>
            <li>Não usar o serviço para atividades fraudulentas ou ilegais.</li>
          </ul>

          <h3 className="text-lg font-medium">4.2 Você Não Deve:</h3>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Tentar acessar áreas não autorizadas do sistema.</li>
            <li>Realizar engenharia reversa, descompilar ou tentar extrair código-fonte.</li>
            <li>Usar bots, scrapers ou ferramentas automatizadas não autorizadas.</li>
            <li>Transmitir vírus, malware ou código malicioso.</li>
            <li>Sobrecarregar intencionalmente nossos servidores.</li>
            <li>Revender, sublicenciar ou redistribuir o serviço sem autorização.</li>
            <li>Violar direitos de terceiros, incluindo privacidade e propriedade intelectual.</li>
            <li>Usar o serviço para enviar spam ou comunicações não solicitadas.</li>
          </ul>
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
            <p className="text-muted-foreground">⚠️ <strong>Violações:</strong> O descumprimento destas regras pode resultar em suspensão ou encerramento imediato da conta, sem direito a reembolso.</p>
          </div>

          <h2 className="text-xl font-semibold text-primary border-b border-border pb-2">5. Integrações com Terceiros</h2>
          
          <h3 className="text-lg font-medium">5.1 Meta (Facebook/Instagram)</h3>
          <p className="text-muted-foreground">Ao conectar sua conta Meta ao DashMed Pro para relatórios de campanhas publicitárias, você:</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Autoriza o acesso aos dados de suas contas de anúncios conforme permissões solicitadas.</li>
            <li>Reconhece que o uso está sujeito também aos Termos de Serviço do Facebook.</li>
            <li>É responsável por manter as integrações atualizadas e funcionais.</li>
            <li>Pode revogar o acesso a qualquer momento através das configurações.</li>
          </ul>

          <h3 className="text-lg font-medium">5.2 WhatsApp Business</h3>
          <p className="text-muted-foreground">A integração com WhatsApp Business API está sujeita aos Termos de Serviço do WhatsApp Business e Política Comercial do WhatsApp.</p>
          <p className="text-muted-foreground">Você é responsável por garantir que suas comunicações via WhatsApp estejam em conformidade com as políticas da Meta, incluindo obtenção de opt-in adequado.</p>

          <h3 className="text-lg font-medium">5.3 Responsabilidade por Integrações</h3>
          <p className="text-muted-foreground">
            Não somos responsáveis por alterações, interrupções ou descontinuação de serviços de terceiros que afetem as integrações. Faremos esforços razoáveis para adaptar nossa plataforma a mudanças em APIs externas.
          </p>

          <h2 className="text-xl font-semibold text-primary border-b border-border pb-2">6. Pagamento e Assinatura</h2>
          
          <h3 className="text-lg font-medium">6.1 Planos e Preços</h3>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Os preços são informados em Reais (BRL) e podem ser alterados com aviso prévio de 30 dias.</li>
            <li>A cobrança é realizada conforme o ciclo escolhido (mensal ou anual).</li>
            <li>Planos anuais possuem desconto e são cobrados integralmente no início do período.</li>
          </ul>

          <h3 className="text-lg font-medium">6.2 Formas de Pagamento</h3>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Cartão de crédito (cobrança recorrente automática)</li>
            <li>Boleto bancário (mediante disponibilidade)</li>
            <li>PIX (para planos anuais)</li>
          </ul>

          <h3 className="text-lg font-medium">6.3 Atrasos e Inadimplência</h3>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Pagamentos em atraso estão sujeitos a multa de 2% e juros de 1% ao mês.</li>
            <li>Após 15 dias de atraso, o acesso pode ser suspenso.</li>
            <li>Após 30 dias, a conta pode ser encerrada com exclusão de dados.</li>
          </ul>

          <h3 className="text-lg font-medium">6.4 Reembolsos</h3>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><strong>Período de teste:</strong> Se oferecido, o cancelamento durante o teste não gera cobrança.</li>
            <li><strong>Planos mensais:</strong> Não há reembolso proporcional por dias não utilizados.</li>
            <li><strong>Planos anuais:</strong> Reembolso proporcional nos primeiros 30 dias, mediante solicitação.</li>
          </ul>

          <h2 className="text-xl font-semibold text-primary border-b border-border pb-2">7. Propriedade Intelectual</h2>
          
          <h3 className="text-lg font-medium">7.1 Nossa Propriedade</h3>
          <p className="text-muted-foreground">
            O DashMed Pro, incluindo código-fonte, design, logotipos, textos, gráficos e todo o conteúdo da plataforma, é propriedade exclusiva da DashMed Pro ou seus licenciadores, protegido por leis de direitos autorais e propriedade industrial.
          </p>

          <h3 className="text-lg font-medium">7.2 Licença de Uso</h3>
          <p className="text-muted-foreground">Concedemos a você uma licença limitada, não exclusiva, não transferível e revogável para usar o serviço conforme estes termos. Esta licença não inclui:</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Direito de revenda ou sublicenciamento.</li>
            <li>Modificação ou criação de obras derivadas.</li>
            <li>Uso do serviço para desenvolver produto concorrente.</li>
          </ul>

          <h3 className="text-lg font-medium">7.3 Seus Dados</h3>
          <p className="text-muted-foreground">
            Você retém todos os direitos sobre os dados que insere na plataforma. Ao usar o serviço, você nos concede licença limitada para processar esses dados conforme necessário para fornecer o serviço.
          </p>

          <h2 className="text-xl font-semibold text-primary border-b border-border pb-2">8. Dados e Privacidade</h2>
          
          <h3 className="text-lg font-medium">8.1 Proteção de Dados</h3>
          <p className="text-muted-foreground">
            O tratamento de dados pessoais está detalhado em nossa <Link to="/privacy-policy" className="text-primary hover:underline">Política de Privacidade</Link>, que faz parte integrante destes Termos.
          </p>

          <h3 className="text-lg font-medium">8.2 Dados de Pacientes (LGPD)</h3>
          <p className="text-muted-foreground">Para fins de LGPD, você (Clínica) atua como Controlador dos dados de seus pacientes, e o DashMed Pro atua como Operador. Você é responsável por:</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Obter consentimento ou base legal adequada para tratamento de dados de pacientes.</li>
            <li>Informar pacientes sobre o uso de sistemas informatizados.</li>
            <li>Atender solicitações de titulares de dados.</li>
            <li>Manter registros de consentimento quando aplicável.</li>
          </ul>

          <h3 className="text-lg font-medium">8.3 Sigilo Médico</h3>
          <p className="text-muted-foreground">
            O DashMed Pro implementa medidas técnicas (criptografia, RLS, controle de acesso) para proteger dados médicos. No entanto, a responsabilidade pelo sigilo profissional permanece com os profissionais de saúde conforme o Código de Ética Médica.
          </p>

          <h3 className="text-lg font-medium">8.4 Backup e Retenção</h3>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Realizamos backups automáticos diários dos dados.</li>
            <li>Após encerramento da conta, os dados são retidos por 30 dias antes da exclusão definitiva.</li>
            <li>Você pode solicitar exportação dos seus dados antes do encerramento.</li>
          </ul>

          <h2 className="text-xl font-semibold text-primary border-b border-border pb-2">9. Limitação de Responsabilidade</h2>
          
          <h3 className="text-lg font-medium">9.1 Disponibilidade</h3>
          <p className="text-muted-foreground">
            Nos esforçamos para manter o serviço disponível 24/7, mas não garantimos disponibilidade ininterrupta. Manutenções programadas serão comunicadas com antecedência quando possível.
          </p>

          <h3 className="text-lg font-medium">9.2 Exclusão de Garantias</h3>
          <p className="text-muted-foreground">
            O serviço é fornecido "como está" e "conforme disponível". Na extensão máxima permitida por lei, não oferecemos garantias expressas ou implícitas, incluindo garantias de comercialização, adequação a um propósito específico ou não violação.
          </p>

          <h3 className="text-lg font-medium">9.3 Limitação de Danos</h3>
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 space-y-2">
            <p className="text-muted-foreground">
              Em nenhuma circunstância a DashMed Pro será responsável por danos indiretos, incidentais, especiais, consequenciais ou punitivos, incluindo perda de lucros, dados, uso ou outras perdas intangíveis, mesmo se tivermos sido avisados da possibilidade de tais danos.
            </p>
            <p className="text-muted-foreground">
              Nossa responsabilidade total não excederá o valor pago pelo serviço nos 12 meses anteriores ao evento que deu origem à reclamação.
            </p>
          </div>

          <h3 className="text-lg font-medium">9.4 Exclusões</h3>
          <p className="text-muted-foreground">Não somos responsáveis por:</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Decisões médicas ou clínicas tomadas com base em informações do sistema.</li>
            <li>Erros em dados inseridos pelos usuários.</li>
            <li>Interrupções causadas por terceiros ou força maior.</li>
            <li>Problemas decorrentes de uso inadequado do sistema.</li>
            <li>Alterações em APIs ou serviços de terceiros integrados.</li>
          </ul>

          <h2 className="text-xl font-semibold text-primary border-b border-border pb-2">10. Rescisão</h2>
          
          <h3 className="text-lg font-medium">10.1 Por Você</h3>
          <p className="text-muted-foreground">
            Você pode cancelar sua assinatura a qualquer momento através das configurações da conta ou entrando em contato conosco. O cancelamento será efetivo ao final do período de faturamento vigente.
          </p>

          <h3 className="text-lg font-medium">10.2 Por Nós</h3>
          <p className="text-muted-foreground">Podemos suspender ou encerrar sua conta imediatamente se:</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Você violar estes Termos de Serviço.</li>
            <li>Suas informações de pagamento forem inválidas ou insuficientes.</li>
            <li>Identificarmos atividade fraudulenta ou abusiva.</li>
            <li>For exigido por lei ou ordem judicial.</li>
          </ul>

          <h3 className="text-lg font-medium">10.3 Efeitos da Rescisão</h3>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Acesso ao sistema será imediatamente revogado.</li>
            <li>Você terá 30 dias para solicitar exportação de dados.</li>
            <li>Integrações com terceiros serão desconectadas.</li>
            <li>Obrigações de confidencialidade e limitação de responsabilidade sobrevivem à rescisão.</li>
          </ul>

          <h2 className="text-xl font-semibold text-primary border-b border-border pb-2">11. Modificações</h2>
          
          <h3 className="text-lg font-medium">11.1 Alterações nos Termos</h3>
          <p className="text-muted-foreground">Reservamo-nos o direito de modificar estes termos a qualquer momento. Alterações significativas serão comunicadas por:</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>E-mail para o endereço cadastrado.</li>
            <li>Notificação dentro da plataforma.</li>
            <li>Destaque na página de termos.</li>
          </ul>
          <p className="text-muted-foreground">O uso continuado do serviço após notificação constitui aceitação dos novos termos.</p>

          <h3 className="text-lg font-medium">11.2 Alterações no Serviço</h3>
          <p className="text-muted-foreground">
            Podemos adicionar, modificar ou descontinuar funcionalidades do serviço. Funcionalidades críticas não serão removidas sem aviso prévio de 60 dias.
          </p>

          <h2 className="text-xl font-semibold text-primary border-b border-border pb-2">12. Legislação Aplicável e Foro</h2>
          <p className="text-muted-foreground">Estes Termos de Serviço são regidos pelas leis da República Federativa do Brasil.</p>
          <p className="text-muted-foreground">
            Fica eleito o foro da comarca de Goiânia/GO, com exclusão de qualquer outro, por mais privilegiado que seja, para dirimir quaisquer questões oriundas deste instrumento.
          </p>

          <h3 className="text-lg font-medium">12.1 Resolução de Disputas</h3>
          <p className="text-muted-foreground">
            Antes de iniciar qualquer procedimento judicial, as partes concordam em tentar resolver disputas amigavelmente através de contato direto por 30 dias.
          </p>

          <h2 className="text-xl font-semibold text-primary border-b border-border pb-2">13. Disposições Gerais</h2>
          
          <h3 className="text-lg font-medium">13.1 Acordo Integral</h3>
          <p className="text-muted-foreground">
            Estes Termos, juntamente com a Política de Privacidade, constituem o acordo integral entre você e a DashMed Pro, substituindo quaisquer acordos anteriores.
          </p>

          <h3 className="text-lg font-medium">13.2 Divisibilidade</h3>
          <p className="text-muted-foreground">
            Se qualquer disposição destes Termos for considerada inválida ou inexequível, as demais disposições permanecerão em pleno vigor e efeito.
          </p>

          <h3 className="text-lg font-medium">13.3 Renúncia</h3>
          <p className="text-muted-foreground">
            A falha em exercer qualquer direito previsto nestes Termos não constitui renúncia a tal direito.
          </p>

          <h3 className="text-lg font-medium">13.4 Cessão</h3>
          <p className="text-muted-foreground">
            Você não pode ceder ou transferir estes Termos sem nosso consentimento prévio por escrito. Podemos ceder nossos direitos a qualquer afiliada ou em caso de fusão, aquisição ou venda de ativos.
          </p>

          <h2 className="text-xl font-semibold text-primary border-b border-border pb-2">14. Contato</h2>
          <div className="border-2 border-primary rounded-lg p-6 bg-muted/30">
            <h3 className="text-lg font-medium text-primary mt-0 mb-3">📧 Fale Conosco</h3>
            <p className="text-muted-foreground mb-2">Para dúvidas sobre estes Termos de Serviço:</p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>E-mail:</strong> suporteapp@dashmedpro.com.br</li>
              <li><strong>Telefone/WhatsApp:</strong> (62) 9306-4548</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-border text-center text-sm text-muted-foreground space-y-2">
          <p><strong>DashMed Pro</strong></p>
          <p>Sistema de Gestão para Clínicas Médicas e Estéticas</p>
          <p>© 2026 DashMed Pro. Todos os direitos reservados.</p>
          <div className="mt-4">
            <Link to="/privacy-policy" className="text-primary hover:underline">Política de Privacidade</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
