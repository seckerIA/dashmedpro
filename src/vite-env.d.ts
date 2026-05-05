/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SUPABASE_PROJECT_ID?: string;
  /** Dev only: OAuth Google sem payment_confirmed na whitelist */
  readonly VITE_AUTH_SKIP_ALLOWED_EMAIL_PAYMENT_CHECK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
