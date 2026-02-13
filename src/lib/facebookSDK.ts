/**
 * Facebook SDK Loader
 * Carrega o Facebook JavaScript SDK de forma assíncrona
 */

// Tipos para o Facebook SDK
declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: {
      init: (params: {
        appId: string;
        cookie?: boolean;
        xfbml?: boolean;
        version: string;
      }) => void;
      login: (
        callback: (response: FacebookLoginResponse) => void,
        options?: FacebookLoginOptions
      ) => void;
      logout: (callback?: () => void) => void;
      getLoginStatus: (callback: (response: FacebookLoginResponse) => void) => void;
      api: (
        path: string,
        method?: string,
        params?: Record<string, unknown>,
        callback?: (response: unknown) => void
      ) => void;
    };
  }
}

export interface FacebookLoginResponse {
  status: 'connected' | 'not_authorized' | 'unknown';
  authResponse?: {
    accessToken: string;
    code?: string;
    expiresIn: number;
    signedRequest: string;
    userID: string;
    grantedScopes?: string;
  };
}

export interface FacebookLoginOptions {
  config_id?: string;
  scope?: string;
  response_type?: string;
  override_default_response_type?: boolean;
  auth_type?: string;
  return_scopes?: boolean;
  enable_profile_selector?: boolean;
  extras?: {
    feature?: string;
    version?: number;
    sessionInfoVersion?: number;
    setup?: Record<string, unknown>;
  };
}

// Estado do SDK
let sdkLoadPromise: Promise<void> | null = null;
let isInitialized = false;

/**
 * Carrega o Facebook SDK de forma assíncrona
 */
export function loadFacebookSDK(appId: string): Promise<void> {
  // Se já está carregando ou carregado, retorna a mesma promise
  if (sdkLoadPromise) {
    return sdkLoadPromise;
  }

  sdkLoadPromise = new Promise((resolve, reject) => {
    // Se já foi inicializado
    if (isInitialized && window.FB) {
      resolve();
      return;
    }

    // Callback quando o SDK carregar
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: appId,
        cookie: true,
        xfbml: true,
        version: 'v21.0',
      });

      isInitialized = true;
      console.log('[Facebook SDK] Initialized successfully');
      resolve();
    };

    // Verificar se já existe o script
    if (document.getElementById('facebook-jssdk')) {
      // SDK já foi adicionado, esperar inicialização
      if (window.FB) {
        window.fbAsyncInit();
      }
      return;
    }

    // Carregar o script do SDK
    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;

    script.onerror = () => {
      sdkLoadPromise = null;
      reject(new Error('Failed to load Facebook SDK'));
    };

    // Inserir antes do primeiro script
    const firstScript = document.getElementsByTagName('script')[0];
    if (firstScript?.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      document.head.appendChild(script);
    }
  });

  return sdkLoadPromise;
}

/**
 * Verifica se o SDK está carregado e pronto
 */
export function isFacebookSDKReady(): boolean {
  return isInitialized && typeof window.FB !== 'undefined';
}

/**
 * Executa FB.login com as opções fornecidas
 */
export function fbLogin(options: FacebookLoginOptions): Promise<FacebookLoginResponse> {
  return new Promise((resolve, reject) => {
    if (!isFacebookSDKReady()) {
      reject(new Error('Facebook SDK not loaded'));
      return;
    }

    window.FB.login((response) => {
      if (response.status === 'connected') {
        resolve(response);
      } else {
        reject(new Error(response.status === 'not_authorized'
          ? 'User did not authorize the app'
          : 'Login was cancelled or failed'));
      }
    }, options);
  });
}

/**
 * Verifica o status de login atual
 */
export function getLoginStatus(): Promise<FacebookLoginResponse> {
  return new Promise((resolve, reject) => {
    if (!isFacebookSDKReady()) {
      reject(new Error('Facebook SDK not loaded'));
      return;
    }

    window.FB.getLoginStatus((response) => {
      resolve(response);
    });
  });
}
