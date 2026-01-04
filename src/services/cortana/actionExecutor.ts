// Action Executor - Executa ações visuais no React
// Navegação, modais, toasts, highlights

import { CORTANA_CONFIG } from '@/config/cortana';

export interface ActionPayload {
  navigate?: {
    path: string;
  };
  openModal?: {
    type: string;
    data?: unknown;
  };
  closeModal?: boolean;
  toast?: {
    title: string;
    description?: string;
    variant?: 'default' | 'destructive';
  };
  highlight?: {
    elementId: string;
    duration?: number;
  };
  scrollTo?: {
    elementId: string;
    behavior?: 'smooth' | 'instant';
  };
}

type NavigateFunction = (path: string) => void;
type ToastFunction = (options: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void;
type ModalFunction = (type: string, data?: unknown) => void;

interface ActionExecutorOptions {
  navigate: NavigateFunction;
  toast: ToastFunction;
  openModal?: ModalFunction;
  closeModal?: () => void;
}

let executorInstance: ActionExecutor | null = null;

export class ActionExecutor {
  private navigate: NavigateFunction;
  private toast: ToastFunction;
  private openModal?: ModalFunction;
  private closeModal?: () => void;

  constructor(options: ActionExecutorOptions) {
    this.navigate = options.navigate;
    this.toast = options.toast;
    this.openModal = options.openModal;
    this.closeModal = options.closeModal;
  }

  /**
   * Executa uma ação baseada no tipo
   */
  execute(action: { type: string; payload: unknown }): void {
    switch (action.type) {
      case 'navigate':
        this.handleNavigate(action.payload as { path: string });
        break;
      case 'toast':
        this.handleToast(action.payload as { title: string; description?: string; variant?: 'default' | 'destructive' });
        break;
      case 'openModal':
        this.handleOpenModal(action.payload as { type: string; data?: unknown });
        break;
      case 'closeModal':
        this.handleCloseModal();
        break;
      case 'highlight':
        this.handleHighlight(action.payload as { elementId: string; duration?: number });
        break;
      case 'scrollTo':
        this.handleScrollTo(action.payload as { elementId: string; behavior?: 'smooth' | 'instant' });
        break;
      default:
        console.warn(`[ActionExecutor] Ação desconhecida: ${action.type}`);
    }
  }

  private handleNavigate(payload: { path: string }): void {
    const { path } = payload;
    console.log(`[ActionExecutor] Navegando para: ${path}`);
    this.navigate(path);
  }

  private handleToast(payload: { title: string; description?: string; variant?: 'default' | 'destructive' }): void {
    console.log(`[ActionExecutor] Toast: ${payload.title}`);
    this.toast({
      title: payload.title,
      description: payload.description,
      variant: payload.variant || 'default',
    });
  }

  private handleOpenModal(payload: { type: string; data?: unknown }): void {
    console.log(`[ActionExecutor] Abrindo modal: ${payload.type}`);
    if (this.openModal) {
      this.openModal(payload.type, payload.data);
    }
  }

  private handleCloseModal(): void {
    console.log(`[ActionExecutor] Fechando modal`);
    if (this.closeModal) {
      this.closeModal();
    }
  }

  private handleHighlight(payload: { elementId: string; duration?: number }): void {
    const { elementId, duration = 2000 } = payload;
    const element = document.getElementById(elementId);

    if (element) {
      // Adicionar classe de highlight
      element.classList.add('cortana-highlight');

      // Scroll para o elemento
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Remover highlight após duração
      setTimeout(() => {
        element.classList.remove('cortana-highlight');
      }, duration);
    }
  }

  private handleScrollTo(payload: { elementId: string; behavior?: 'smooth' | 'instant' }): void {
    const { elementId, behavior = 'smooth' } = payload;
    const element = document.getElementById(elementId);

    if (element) {
      element.scrollIntoView({ behavior, block: 'center' });
    }
  }
}

/**
 * Inicializa o executor de ações
 */
export function initializeActionExecutor(options: ActionExecutorOptions): ActionExecutor {
  executorInstance = new ActionExecutor(options);
  return executorInstance;
}

/**
 * Obtém a instância do executor
 */
export function getActionExecutor(): ActionExecutor | null {
  return executorInstance;
}

/**
 * Executa uma ação usando a instância global
 */
export function executeAction(action: { type: string; payload: unknown }): void {
  if (executorInstance) {
    executorInstance.execute(action);
  } else {
    console.warn('[ActionExecutor] Executor não inicializado');
  }
}

/**
 * CSS para highlight (injetar no documento)
 */
export const HIGHLIGHT_STYLES = `
  .cortana-highlight {
    animation: cortana-pulse 0.5s ease-in-out 3;
    box-shadow: 0 0 20px 5px rgba(59, 130, 246, 0.5);
    border-radius: 8px;
  }

  @keyframes cortana-pulse {
    0%, 100% {
      box-shadow: 0 0 20px 5px rgba(59, 130, 246, 0.5);
    }
    50% {
      box-shadow: 0 0 30px 10px rgba(59, 130, 246, 0.8);
    }
  }
`;

/**
 * Injeta os estilos de highlight no documento
 */
export function injectHighlightStyles(): void {
  if (typeof document !== 'undefined') {
    const existingStyle = document.getElementById('cortana-highlight-styles');
    if (!existingStyle) {
      const style = document.createElement('style');
      style.id = 'cortana-highlight-styles';
      style.textContent = HIGHLIGHT_STYLES;
      document.head.appendChild(style);
    }
  }
}
