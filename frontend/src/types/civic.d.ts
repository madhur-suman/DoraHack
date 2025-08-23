// Civic Auth TypeScript declarations
declare global {
  interface Window {
    civic: {
      authenticate: (options: {
        method: 'email' | 'google' | 'wallet';
        email?: string;
        clientId: string;
        redirectUri: string;
        scope: string;
        web3?: {
          chains: string[];
          embeddedWallets: boolean;
        };
      }) => Promise<{
        success: boolean;
        user?: {
          id: string;
          email: string;
          name: string;
          walletAddress?: string;
        };
        error?: string;
      }>;
    };
  }
}

export {};
