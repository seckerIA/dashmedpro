
# Fix: Facebook Connect Button Not Showing in Lovable Preview

## Problem
The "Conexao Rapida" button with Facebook OAuth doesn't appear in the Lovable preview because:
1. The `.env` file doesn't contain `VITE_FB_APP_ID`
2. The `.env` file still points to the wrong Supabase project (`rpcixpbmtpyrnzlsuuus` instead of `adzaqkduxnpckbcuqpmg`)

The `useMetaOAuth` hook checks `import.meta.env.VITE_FB_APP_ID` -- if empty, `isOAuthConfigured` is `false`, and the `FacebookConnectButton` renders the disabled/unavailable card.

## Solution

Update the `.env` file with the correct values:

```
VITE_SUPABASE_PROJECT_ID="adzaqkduxnpckbcuqpmg"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemFxa2R1eG5wY2tiY3VxcG1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODgyMDksImV4cCI6MjA4MTU2NDIwOX0.WO9-vzv_Vuh86TQWgNWuQ45cXa-L4GoGQfpSbvQiVMc"
VITE_SUPABASE_URL="https://adzaqkduxnpckbcuqpmg.supabase.co"
VITE_FB_APP_ID="1557514182198067"
VITE_FB_META_OAUTH_REDIRECT_URI="https://adzaqkduxnpckbcuqpmg.supabase.co/functions/v1/meta-oauth-callback"
VITE_FB_CONFIG_ID="791657633947469"
```

Note: `FB_APP_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` remain as project secrets only (not in `.env`) since they should never be exposed to the client.

## Technical Details

- **File changed:** `.env`
- **Root cause:** `VITE_` prefixed environment variables must be in the `.env` file to be available in the Vite build via `import.meta.env`
- **Impact:** The Facebook connect button, Supabase client connection, and OAuth redirect will all use the correct project
