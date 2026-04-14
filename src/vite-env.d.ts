/// <reference types="vite/client" />

// Google Identity Services (GIS) global type declarations
declare namespace google {
  namespace accounts {
    namespace id {
      function disableAutoSelect(): void;
    }
    namespace oauth2 {
      interface TokenResponse {
        access_token: string;
        expires_in: number;
        scope: string;
        token_type: string;
        error?: string;
        error_description?: string;
      }
      interface TokenClientConfig {
        client_id: string;
        scope: string;
        callback: (response: TokenResponse) => void;
        error_callback?: (error: { type: string; message: string }) => void;
        prompt?: string;
      }
      interface TokenClient {
        requestAccessToken(overrides?: { prompt?: string }): void;
      }
      function initTokenClient(config: TokenClientConfig): TokenClient;
    }
  }
}
