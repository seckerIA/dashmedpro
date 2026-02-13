import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const dashmedLogo = '/dashmed-logo.png';

const PrivacyPolicy = () => {
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
            <h1 className="text-3xl font-bold text-primary">Política de Privacidade</h1>
            <p className="text-muted-foreground mt-2">DashMed Pro - Sistema de Gestão para Clínicas</p>
          </div>
        </div>

        {/* Last Updated */}
        <div className="bg-primary/10 border-l-4 border-primary rounded-r-lg p-4 mb-8">
          <strong className="text-primary">Última atualização:</strong> 30 de Janeiro de 2026
        </div>

        {/* Content */}
        <div className="prose prose-sm max-w-none text-foreground space-y-6">
          <h2 className="text-xl font-semibold text-primary border-b border-border pb-2">1. Introdução</h2>
          <p className="text-muted-foreground leading-relaxed">
            A DashMed Pro ("nós", "nosso" ou "Empresa") está comprometida em proteger a privacidade e os dados pessoais de nossos usuários. Esta Política de Privacidade descreve como coletamos, usamos, compartilhamos e protegemos suas informações quando você utiliza nossa plataforma de gestão para clínicas médicas e estéticas, incluindo nossas integrações com serviços de terceiros como Meta (Facebook/Instagram) e WhatsApp Business.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Ao utilizar nossos serviços, você concorda com as práticas descritas nesta política. Se você não concordar com qualquer parte desta política, por favor, não utilize nossos serviços.
          </p>

          <h2 className="text-xl font-semibold text-primary border-b border-border pb-2">2. Informações que Coletamos</h2>
          
          <h3 className="text-lg font-medium">2.1 Informações Fornecidas por Você</h3>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><strong>Dados de Cadastro:</strong> Nome completo, e-mail, telefone, CPF/CNPJ, endereço profissional, CRM (para médicos) e cargo na clínica.</li>
            <li><strong>Dados da Clínica:</strong> Nome da clínica, endereço, especialidades, horário de funcionamento.</li>
            <li><strong>Dados de Pacientes:</strong> Informações inseridas por você sobre seus pacientes para fins de gestão clínica.</li>
            <li><strong>Dados Financeiros:</strong> Informações sobre transações, contas bancárias para gestão financeira interna.</li>
          </ul>

          <h3 className="text-lg font-medium">2.2 Informações Coletadas Automaticamente</h3>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><strong>Dados de Uso:</strong> Páginas visitadas, funcionalidades utilizadas, tempo de sessão.</li>
            <li><strong>Dados Técnicos:</strong> Endereço IP, tipo de navegador, sistema operacional, identificadores de dispositivo.</li>
            <li><strong>Cookies e Tecnologias Similares:</strong> Para melhorar a experiência do usuário e análise de uso.</li>
          </ul>

          <h3 className="text-lg font-medium">2.3 Informações de Integrações com Meta (Facebook/Instagram)</h3>
          <p className="text-muted-foreground">Quando você conecta sua conta Meta ao DashMed Pro, podemos acessar:</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><strong>Dados de Anúncios:</strong> Métricas de campanhas, gastos com publicidade, alcance, impressões, cliques e conversões.</li>
            <li><strong>Dados de Páginas:</strong> Informações públicas das páginas gerenciadas, insights de engajamento.</li>
            <li><strong>Dados de Leads:</strong> Informações de formulários de leads gerados por anúncios (nome, e-mail, telefone conforme configurado).</li>
            <li><strong>WhatsApp Business:</strong> Mensagens enviadas e recebidas, status de entrega, dados de contatos do WhatsApp Business.</li>
          </ul>

          <h2 className="text-xl font-semibold text-primary border-b border-border pb-2">3. Como Utilizamos Suas Informações</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="bg-primary text-primary-foreground p-3 text-left">Finalidade</th>
                  <th className="bg-primary text-primary-foreground p-3 text-left">Base Legal (LGPD)</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border"><td className="p-3">Fornecer e manter nossos serviços</td><td className="p-3">Execução de contrato</td></tr>
                <tr className="border-b border-border bg-muted/50"><td className="p-3">Processar pagamentos e faturas</td><td className="p-3">Execução de contrato</td></tr>
                <tr className="border-b border-border"><td className="p-3">Gerar relatórios de campanhas publicitárias</td><td className="p-3">Execução de contrato / Consentimento</td></tr>
                <tr className="border-b border-border bg-muted/50"><td className="p-3">Enviar comunicações sobre o serviço</td><td className="p-3">Interesse legítimo</td></tr>
                <tr className="border-b border-border"><td className="p-3">Melhorar nossos produtos e serviços</td><td className="p-3">Interesse legítimo</td></tr>
                <tr className="border-b border-border bg-muted/50"><td className="p-3">Cumprir obrigações legais</td><td className="p-3">Cumprimento de obrigação legal</td></tr>
                <tr className="border-b border-border"><td className="p-3">Enviar marketing (quando autorizado)</td><td className="p-3">Consentimento</td></tr>
              </tbody>
            </table>
          </div>

          <h2 className="text-xl font-semibold text-primary border-b border-border pb-2">4. Compartilhamento de Informações</h2>
          <p className="text-muted-foreground">Podemos compartilhar suas informações nas seguintes circunstâncias:</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><strong>Prestadores de Serviços:</strong> Empresas que nos auxiliam na operação (hospedagem, processamento de pagamentos, análise de dados).</li>
            <li><strong>Meta Platforms:</strong> Para integração com Facebook Ads, Instagram e WhatsApp Business, conforme suas configurações.</li>
            <li><strong>Obrigações Legais:</strong> Quando exigido por lei, ordem judicial ou autoridade governamental.</li>
            <li><strong>Proteção de Direitos:</strong> Para proteger nossos direitos, propriedade ou segurança.</li>
            <li><strong>Com Seu Consentimento:</strong> Em outras circunstâncias com sua autorização expressa.</li>
          </ul>
          <div className="bg-accent/50 border border-accent rounded-lg p-4">
            <p className="text-muted-foreground">⚠️ <strong>Importante:</strong> Nunca vendemos suas informações pessoais a terceiros para fins de marketing.</p>
          </div>

          <h2 className="text-xl font-semibold text-primary border-b border-border pb-2">5. Integrações com Plataformas Meta</h2>
          
          <h3 className="text-lg font-medium">5.1 Facebook e Instagram Ads</h3>
          <p className="text-muted-foreground">Nossa integração com a API de Marketing do Facebook permite que você visualize métricas e relatórios de suas campanhas publicitárias diretamente no DashMed Pro. Os dados acessados incluem:</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Performance de campanhas (impressões, alcance, cliques)</li>
            <li>Gastos e orçamentos de anúncios</li>
            <li>Dados demográficos agregados do público</li>
            <li>Conversões e eventos personalizados</li>
          </ul>

          <h3 className="text-lg font-medium">5.2 WhatsApp Business API</h3>
          <p className="text-muted-foreground">Quando você conecta o WhatsApp Business ao DashMed Pro, processamos mensagens para:</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Gerenciar comunicações com pacientes/leads</li>
            <li>Qualificar leads através de análise de conversas</li>
            <li>Automatizar respostas e agendamentos</li>
            <li>Gerar relatórios de atendimento</li>
          </ul>

          <h3 className="text-lg font-medium">5.3 Seus Direitos sobre Dados da Meta</h3>
          <p className="text-muted-foreground">
            Você pode revogar o acesso do DashMed Pro aos seus dados Meta a qualquer momento através das configurações de privacidade do Facebook ou diretamente em nossa plataforma. A revogação não afeta dados já processados antes da revogação.
          </p>

          <h2 className="text-xl font-semibold text-primary border-b border-border pb-2">6. Segurança dos Dados</h2>
          <p className="text-muted-foreground">Implementamos medidas técnicas e organizacionais para proteger suas informações:</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><strong>Criptografia:</strong> Dados em trânsito (TLS 1.3) e em repouso (AES-256).</li>
            <li><strong>Controle de Acesso:</strong> Sistema RBAC (Role-Based Access Control) rigoroso.</li>
            <li><strong>Isolamento de Dados:</strong> Row Level Security (RLS) no banco de dados.</li>
            <li><strong>Monitoramento:</strong> Logs de acesso e alertas de segurança.</li>
            <li><strong>Backups:</strong> Backups regulares com redundância geográfica.</li>
            <li><strong>Conformidade:</strong> Práticas alinhadas com LGPD e normas do setor de saúde.</li>
          </ul>

          <h2 className="text-xl font-semibold text-primary border-b border-border pb-2">7. Retenção de Dados</h2>
          <p className="text-muted-foreground">Mantemos suas informações pelo tempo necessário para:</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Fornecer os serviços contratados</li>
            <li>Cumprir obrigações legais (ex: registros fiscais por 5 anos)</li>
            <li>Resolver disputas e fazer cumprir nossos acordos</li>
          </ul>
          <p className="text-muted-foreground">Dados de campanhas publicitárias são retidos por até 24 meses após a desconexão da integração, salvo solicitação de exclusão.</p>

          <h2 className="text-xl font-semibold text-primary border-b border-border pb-2">8. Seus Direitos (LGPD)</h2>
          <p className="text-muted-foreground">Conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018), você tem direito a:</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><strong>Confirmação e Acesso:</strong> Saber se tratamos seus dados e obter cópia.</li>
            <li><strong>Correção:</strong> Corrigir dados incompletos, inexatos ou desatualizados.</li>
            <li><strong>Anonimização ou Exclusão:</strong> Solicitar anonimização ou exclusão de dados desnecessários.</li>
            <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado.</li>
            <li><strong>Informação sobre Compartilhamento:</strong> Saber com quem compartilhamos seus dados.</li>
            <li><strong>Revogação de Consentimento:</strong> Retirar consentimento a qualquer momento.</li>
            <li><strong>Oposição:</strong> Opor-se ao tratamento em certas circunstâncias.</li>
          </ul>
          <p className="text-muted-foreground">Para exercer seus direitos, entre em contato através dos canais indicados na seção "Contato".</p>

          <h2 className="text-xl font-semibold text-primary border-b border-border pb-2">9. Cookies e Tecnologias de Rastreamento</h2>
          <p className="text-muted-foreground">Utilizamos cookies e tecnologias similares para:</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><strong>Cookies Essenciais:</strong> Necessários para funcionamento básico (autenticação, segurança).</li>
            <li><strong>Cookies de Desempenho:</strong> Análise de uso para melhorias (podem ser desabilitados).</li>
            <li><strong>Cookies de Funcionalidade:</strong> Memorizar preferências do usuário.</li>
          </ul>
          <p className="text-muted-foreground">Você pode gerenciar cookies nas configurações do seu navegador. Desabilitar cookies essenciais pode afetar a funcionalidade do sistema.</p>

          <h2 className="text-xl font-semibold text-primary border-b border-border pb-2">10. Transferência Internacional de Dados</h2>
          <p className="text-muted-foreground">
            Seus dados podem ser processados em servidores localizados fora do Brasil (incluindo Estados Unidos) através de nossos provedores de infraestrutura. Garantimos que essas transferências ocorram com salvaguardas adequadas, incluindo cláusulas contratuais padrão aprovadas por autoridades de proteção de dados.
          </p>

          <h2 className="text-xl font-semibold text-primary border-b border-border pb-2">11. Dados de Menores</h2>
          <p className="text-muted-foreground">
            O DashMed Pro não é destinado a menores de 18 anos. Não coletamos intencionalmente dados de menores. Se tomarmos conhecimento de que coletamos dados de um menor, tomaremos medidas para excluí-los.
          </p>

          <h2 className="text-xl font-semibold text-primary border-b border-border pb-2">12. Alterações nesta Política</h2>
          <p className="text-muted-foreground">
            Podemos atualizar esta política periodicamente. Notificaremos você sobre mudanças significativas por e-mail ou através de aviso em nossa plataforma. A data de "última atualização" no topo indica quando a política foi revisada pela última vez.
          </p>

          <h2 className="text-xl font-semibold text-primary border-b border-border pb-2">13. Contato</h2>
          <div className="border-2 border-primary rounded-lg p-6 bg-muted/30">
            <h3 className="text-lg font-medium text-primary mt-0 mb-3">📧 Fale Conosco</h3>
            <p className="text-muted-foreground mb-2">Para questões sobre privacidade, exercício de direitos ou dúvidas:</p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>E-mail:</strong> suporteapp@dashmedpro.com.br</li>
              <li><strong>Telefone/WhatsApp:</strong> (62) 9306-4548</li>
            </ul>
          </div>

          <h2 className="text-xl font-semibold text-primary border-b border-border pb-2">14. Autoridade de Proteção de Dados</h2>
          <p className="text-muted-foreground">
            Caso considere que o tratamento de seus dados viola a legislação aplicável, você tem o direito de apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD):
          </p>
          <ul className="list-disc pl-6 text-muted-foreground">
            <li><strong>Site:</strong> <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.gov.br/anpd</a></li>
          </ul>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-border text-center text-sm text-muted-foreground space-y-2">
          <p><strong>DashMed Pro</strong></p>
          <p>Sistema de Gestão para Clínicas Médicas e Estéticas</p>
          <p>© 2026 DashMed Pro. Todos os direitos reservados.</p>
          <div className="mt-4">
            <Link to="/terms-of-service" className="text-primary hover:underline">Termos de Serviço</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
