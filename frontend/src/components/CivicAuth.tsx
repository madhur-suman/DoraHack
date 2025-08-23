import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, Mail, Chrome, Shield, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { CIVIC_CONFIG } from '../config/civic';
import { useAuth } from '../context/AuthContext';

interface CivicAuthProps {
  onAuthSuccess: (user: any) => void;
  onAuthError: (error: string) => void;
}

const CivicAuth: React.FC<CivicAuthProps> = ({ onAuthSuccess, onAuthError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'google' | 'wallet'>('email');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const { civicLogin } = useAuth();

  // Initialize Civic Auth
  useEffect(() => {
    // Check if Civic Auth is available
    if (typeof window !== 'undefined' && window.civic) {
      console.log('Civic Auth is available');
    } else {
      console.log('Civic Auth not available, using fallback');
    }
  }, []);

  const handleEmailAuth = async () => {
    if (!email.trim()) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      // Real Civic email authentication
      if (typeof window !== 'undefined' && window.civic) {
        // Use real Civic Auth
        const result = await window.civic.authenticate({
          method: 'email',
          email: email.trim(),
          clientId: CIVIC_CONFIG.clientId,
          redirectUri: CIVIC_CONFIG.redirectUri,
          scope: CIVIC_CONFIG.scope
        });
        
        if (result.success) {
          const userData = {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name || result.user.email,
            authMethod: 'email',
            walletAddress: result.user.walletAddress || null
          };
          
          await civicLogin(userData);
          onAuthSuccess(userData);
        } else {
          throw new Error(result.error || 'Email authentication failed');
        }
      } else {
        // Fallback for development/testing
        throw new Error('Civic Auth not available. Please install @civic/auth package.');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Email authentication failed';
      setError(errorMessage);
      onAuthError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Real Civic Google authentication
      if (typeof window !== 'undefined' && window.civic) {
        const result = await window.civic.authenticate({
          method: 'google',
          clientId: CIVIC_CONFIG.clientId,
          redirectUri: CIVIC_CONFIG.redirectUri,
          scope: CIVIC_CONFIG.scope
        });
        
        if (result.success) {
          const userData = {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name || result.user.email,
            authMethod: 'google',
            walletAddress: result.user.walletAddress || null
          };
          
          await civicLogin(userData);
          onAuthSuccess(userData);
        } else {
          throw new Error(result.error || 'Google authentication failed');
        }
      } else {
        throw new Error('Civic Auth not available. Please install @civic/auth package.');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Google authentication failed';
      setError(errorMessage);
      onAuthError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletAuth = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Real Civic wallet authentication
      if (typeof window !== 'undefined' && window.civic) {
        const result = await window.civic.authenticate({
          method: 'wallet',
          clientId: CIVIC_CONFIG.clientId,
          redirectUri: CIVIC_CONFIG.redirectUri,
          scope: CIVIC_CONFIG.scope,
          web3: CIVIC_CONFIG.web3
        });
        
        if (result.success) {
          const userData = {
            id: result.user.id,
            email: result.user.email || `wallet_${result.user.walletAddress}`,
            name: result.user.name || 'Wallet User',
            authMethod: 'wallet',
            walletAddress: result.user.walletAddress
          };
          
          await civicLogin(userData);
          onAuthSuccess(userData);
        } else {
          throw new Error(result.error || 'Wallet authentication failed');
        }
      } else {
        throw new Error('Civic Auth not available. Please install @civic/auth package.');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Wallet authentication failed';
      setError(errorMessage);
      onAuthError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="p-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome to ShopSense</h2>
          <p className="text-gray-600 mt-2">Sign in with Civic Auth</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-600">{error}</span>
          </div>
        )}

        <Tabs value={authMethod} onValueChange={(value) => setAuthMethod(value as any)}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="google" className="flex items-center gap-2">
              <Chrome className="w-4 h-4" />
              Google
            </TabsTrigger>
            <TabsTrigger value="wallet" className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Wallet
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
              />
            </div>
            <Button 
              onClick={handleEmailAuth}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Continue with Email
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="google" className="space-y-4">
            <Button 
              onClick={handleGoogleAuth}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Chrome className="w-4 h-4 mr-2" />
                  Continue with Google
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="wallet" className="space-y-4">
            <div className="text-center space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <Wallet className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  Connect your Web3 wallet for seamless authentication
                </p>
              </div>
              <Button 
                onClick={handleWalletAuth}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting wallet...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect Wallet
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </Card>
    </div>
  );
};

export default CivicAuth;
