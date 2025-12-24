import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Plus, Eye, ExternalLink } from "lucide-react";
import { useGenerateUtm, useGeneratedUtms } from "@/hooks/useUtmGenerator";
import { useUtmTemplates } from "@/hooks/useUtmTemplates";
import { useAdCampaignsSync } from "@/hooks/useAdCampaignsSync";
import { useAuth } from "@/hooks/useAuth";
import { buildUtmUrl, validateUtmParams } from "@/lib/adPlatforms/utmBuilder";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export function UtmGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const generateUtm = useGenerateUtm();
  const { data: templates } = useUtmTemplates(true);
  const { data: generatedUtms } = useGeneratedUtms();
  const { data: campaigns } = useAdCampaignsSync();
  
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [baseUrl, setBaseUrl] = useState('');
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [utmTerm, setUtmTerm] = useState('');
  const [utmContent, setUtmContent] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Preview em tempo real
  useEffect(() => {
    if (baseUrl && utmSource && utmMedium && utmCampaign) {
      try {
        const url = buildUtmUrl({
          base_url: baseUrl,
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          utm_term: utmTerm || undefined,
          utm_content: utmContent || undefined,
        });
        setPreviewUrl(url);
      } catch {
        setPreviewUrl('');
      }
    } else {
      setPreviewUrl('');
    }
  }, [baseUrl, utmSource, utmMedium, utmCampaign, utmTerm, utmContent]);

  const handleTemplateSelect = (templateId: string) => {
    const template = templates?.find(t => t.id === templateId);
    if (template) {
      setBaseUrl(template.base_url);
      setUtmSource(template.utm_source);
      setUtmMedium(template.utm_medium);
      setUtmCampaign(template.utm_campaign);
      setUtmTerm(template.utm_term || '');
      setUtmContent(template.utm_content || '');
      setSelectedTemplate(templateId);
    }
  };

  const handleCampaignSelect = (campaignId: string) => {
    const campaign = campaigns?.find(c => c.id === campaignId);
    if (campaign) {
      setSelectedCampaignId(campaignId);
      setUtmCampaign(campaign.platform_campaign_name);
      setUtmSource(campaign.platform === 'google_ads' ? 'google' : 'facebook');
      setUtmMedium('cpc');
    }
  };

  const handleGenerate = async () => {
    if (!user) return;

    const params = {
      base_url: baseUrl,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      utm_term: utmTerm || undefined,
      utm_content: utmContent || undefined,
    };

    const validation = validateUtmParams(params);
    if (!validation.valid) {
      toast({
        variant: 'destructive',
        title: 'Erro de validação',
        description: validation.errors.join(', '),
      });
      return;
    }

    try {
      const url = buildUtmUrl(params);
      setGeneratedUrl(url);

      await generateUtm.mutateAsync({
        params,
        template_id: selectedTemplate || undefined,
        ad_campaign_sync_id: selectedCampaignId || undefined,
        user_id: user.id,
      });

      toast({
        title: 'UTM gerado',
        description: 'O link com UTM foi gerado e salvo com sucesso.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Erro ao gerar UTM.',
      });
    }
  };

  const handleCopy = () => {
    if (generatedUrl) {
      navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Copiado!',
        description: 'Link copiado para a área de transferência.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerador de Links com UTM</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {templates && templates.length > 0 && (
            <div className="space-y-2">
              <Label>Usar Template (opcional)</Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="base_url">URL Base *</Label>
            <Input
              id="base_url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://seusite.com.br"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="utm_source">UTM Source *</Label>
              <Input
                id="utm_source"
                value={utmSource}
                onChange={(e) => setUtmSource(e.target.value)}
                placeholder="google"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="utm_medium">UTM Medium *</Label>
              <Input
                id="utm_medium"
                value={utmMedium}
                onChange={(e) => setUtmMedium(e.target.value)}
                placeholder="cpc"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="utm_campaign">UTM Campaign *</Label>
            <Input
              id="utm_campaign"
              value={utmCampaign}
              onChange={(e) => setUtmCampaign(e.target.value)}
              placeholder="promocao-janeiro"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="utm_term">UTM Term (opcional)</Label>
              <Input
                id="utm_term"
                value={utmTerm}
                onChange={(e) => setUtmTerm(e.target.value)}
                placeholder="palavra-chave"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="utm_content">UTM Content (opcional)</Label>
              <Input
                id="utm_content"
                value={utmContent}
                onChange={(e) => setUtmContent(e.target.value)}
                placeholder="banner-topo"
              />
            </div>
          </div>

          {campaigns && campaigns.length > 0 && (
            <div className="space-y-2">
              <Label>Vincular a Campanha (opcional)</Label>
              <Select value={selectedCampaignId} onValueChange={handleCampaignSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma campanha" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.platform_campaign_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Preview em tempo real */}
          {previewUrl && (
            <Card className="bg-muted/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Preview do Link
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Textarea
                    value={previewUrl}
                    readOnly
                    className="font-mono text-sm"
                    rows={3}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(previewUrl);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                        toast({
                          title: 'Copiado!',
                          description: 'Preview copiado para a área de transferência.',
                        });
                      }}
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 mr-2 text-green-500" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar Preview
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(previewUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Testar Link
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Button onClick={handleGenerate} disabled={generateUtm.isPending || !previewUrl} className="w-full">
            {generateUtm.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Gerar e Salvar Link
              </>
            )}
          </Button>

          {generatedUrl && (
            <div className="space-y-2">
              <Label>Link Gerado e Salvo</Label>
              <div className="flex gap-2">
                <Textarea
                  value={generatedUrl}
                  readOnly
                  className="font-mono text-sm"
                  rows={3}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  className="h-auto"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {generatedUtms && generatedUtms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>UTMs Gerados Recentemente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {generatedUtms.slice(0, 5).map((utm) => (
                <div
                  key={utm.id}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono truncate">{utm.full_url}</p>
                    <p className="text-xs text-muted-foreground">
                      {utm.clicks} cliques • {utm.conversions} conversões
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setGeneratedUrl(utm.full_url);
                      navigator.clipboard.writeText(utm.full_url);
                      toast({
                        title: 'Copiado!',
                        description: 'Link copiado para a área de transferência.',
                      });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

