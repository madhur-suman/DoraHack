// Civic Auth Configuration Example
// Copy this file to civic-config.js and update with your actual values

export const CIVIC_CONFIG = {
  // Get your Client ID from https://auth.civic.com
  clientId: 'your-civic-client-id-here',
  
  // Civic Auth endpoints
  authUrl: 'https://auth.civic.com',
  
  // Redirect URI after authentication
  redirectUri: 'http://localhost:5173/auth/callback',
  
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

// Instructions:
// 1. Sign up at https://auth.civic.com
// 2. Get your Client ID from the dashboard
// 3. Update the clientId above
// 4. Update redirectUri if needed
// 5. Copy this file to civic-config.js
