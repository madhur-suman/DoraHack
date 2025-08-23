// Civic Auth Configuration
export const CIVIC_CONFIG = {
  // Replace with your actual Client ID from auth.civic.com
  clientId: import.meta.env.VITE_CIVIC_CLIENT_ID || 'df00cf4a-220a-4605-a0a3-10c49f21888f',
  
  // Civic Auth endpoints
  authUrl: 'https://auth.civic.com',
  
  // Redirect URI after authentication
  redirectUri: import.meta.env.VITE_CIVIC_REDIRECT_URI || 'http://localhost:5173/auth/callback',
  
  // Scopes for authentication
  scope: 'openid profile email',
  
  // Response type
  responseType: 'code',
  
  // Web3 configuration (optional)
  web3: {
    chains: ['ethereum', 'polygon', 'arbitrum', 'base', 'bsc'],
    embeddedWallets: true
  }
};

// Civic Auth instance
export const createCivicAuth = () => {
  // This will be initialized when we import the actual Civic Auth library
  return null;
};
