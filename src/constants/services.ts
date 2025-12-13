// Constantes para serviços disponíveis no CRM
// Baseado nos badges coloridos mostrados no design

export interface ServiceConfig {
  value: string;
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
}

export const AVAILABLE_SERVICES: ServiceConfig[] = [
  {
    value: 'gestao_trafego',
    label: 'Gestão de Tráfego',
    color: 'bg-blue-500',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-600'
  },
  {
    value: 'branding_completo',
    label: 'Branding Completo',
    color: 'bg-purple-500',
    bgColor: 'bg-purple-500/10',
    textColor: 'text-purple-600'
  },
  {
    value: 'desenvolvimento_web',
    label: 'Desenvolvimento Web',
    color: 'bg-orange-500',
    bgColor: 'bg-orange-500/10',
    textColor: 'text-orange-600'
  },
  {
    value: 'social_media',
    label: 'Social Media',
    color: 'bg-green-500',
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-600'
  },
  {
    value: 'consultoria_seo',
    label: 'Consultoria de SEO',
    color: 'bg-indigo-500',
    bgColor: 'bg-indigo-500/10',
    textColor: 'text-indigo-600'
  },
  {
    value: 'branding_midia',
    label: 'Branding e Mídia',
    color: 'bg-pink-500',
    bgColor: 'bg-pink-500/10',
    textColor: 'text-pink-600'
  },
  {
    value: 'automacao_ia',
    label: 'Automação IA',
    color: 'bg-cyan-500',
    bgColor: 'bg-cyan-500/10',
    textColor: 'text-cyan-600'
  }
];

export const getServiceConfig = (serviceValue: string): ServiceConfig | null => {
  return AVAILABLE_SERVICES.find(service => service.value === serviceValue) || null;
};

export const getServiceLabel = (serviceValue: string): string => {
  const config = getServiceConfig(serviceValue);
  return config?.label || serviceValue;
};
