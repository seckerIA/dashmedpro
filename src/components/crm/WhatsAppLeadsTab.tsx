import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useWhatsAppLeads, WhatsAppLead } from '@/hooks/useWhatsAppLeads';
import { MessageSquare, Phone, User, Clock, Search, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ContactForm } from './ContactForm';

export function WhatsAppLeadsTab() {
  const { leads, isLoading } = useWhatsAppLeads();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<WhatsAppLead | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);

  const filteredLeads = leads.filter(lead => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      lead.lead_name?.toLowerCase().includes(searchLower) ||
      lead.number?.includes(searchTerm) ||
      lead.assunto?.toLowerCase().includes(searchLower) ||
      lead.resumo?.toLowerCase().includes(searchLower)
    );
  });

  const handleConvertToContact = (lead: WhatsAppLead) => {
    setSelectedLead(lead);
    setShowContactForm(true);
  };

  const handleOpenWhatsApp = (number: string) => {
    const cleanNumber = number.replace(/\D/g, '');
    navigate(`/whatsapp?phone=${cleanNumber}`);
  };

  const getStatusBadge = (lead: WhatsAppLead) => {
    if (lead.agendado) {
      return <Badge variant="default" className="bg-blue-500">Agendado</Badge>;
    }
    if (lead.status === 'ativo' || lead.status === 'em_andamento') {
      return <Badge variant="default" className="bg-green-500">Ativo</Badge>;
    }
    if (lead.status === 'encerrado' || lead.status === 'finalizado') {
      return <Badge variant="secondary">Encerrado</Badge>;
    }
    return <Badge variant="outline">Novo</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-muted-foreground">Carregando leads do WhatsApp...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, número, assunto ou resumo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Leads</p>
                <p className="text-2xl font-bold">{leads.length}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Agendados</p>
                <p className="text-2xl font-bold">{leads.filter(l => l.agendado).length}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold">
                  {leads.filter(l => l.status === 'ativo' || l.status === 'em_andamento').length}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Interações</p>
                <p className="text-2xl font-bold">
                  {leads.reduce((sum, l) => sum + (l.interacoes || 0), 0)}
                </p>
              </div>
              <Phone className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leads List */}
      {filteredLeads.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            {searchTerm ? 'Nenhum lead encontrado com os filtros aplicados.' : 'Nenhum lead do WhatsApp encontrado.'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredLeads.map((lead) => (
            <Card key={lead.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(lead)}
                      {lead.agendado && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Agendado
                        </Badge>
                      )}
                    </div>

                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {lead.lead_name || 'Sem nome'}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {lead.number}
                        </div>
                        {lead.ultimo_contato && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(lead.ultimo_contato), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </div>
                        )}
                        {lead.interacoes && (
                          <div className="text-xs">
                            {lead.interacoes} interação{lead.interacoes !== 1 ? 'ões' : ''}
                          </div>
                        )}
                      </div>
                    </div>

                    {lead.assunto && (
                      <div>
                        <p className="text-sm font-medium">Assunto:</p>
                        <p className="text-sm text-muted-foreground">{lead.assunto}</p>
                      </div>
                    )}

                    {lead.resumo && (
                      <div>
                        <p className="text-sm font-medium">Resumo:</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">{lead.resumo}</p>
                      </div>
                    )}

                    {lead.etapa && (
                      <div>
                        <Badge variant="outline" className="text-xs">
                          Etapa: {lead.etapa}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleOpenWhatsApp(lead.number)}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      WhatsApp
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleConvertToContact(lead)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Converter
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Contact Form Modal */}
      {showContactForm && selectedLead && (
        <ContactForm
          trigger={<Button style={{ display: 'none' }} />}
          forceOpen={showContactForm}
          initialStage="lead_novo"
          onSuccess={() => {
            setShowContactForm(false);
            setSelectedLead(null);
          }}
          onCancel={() => {
            setShowContactForm(false);
            setSelectedLead(null);
          }}
          initialData={{
            full_name: selectedLead.lead_name || '',
            phone: selectedLead.number || '',
            email: '',
          }}
        />
      )}
    </div>
  );
}

