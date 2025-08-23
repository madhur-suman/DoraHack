import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CivicAuth from '../components/CivicAuth';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CivicAuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { civicLogin } = useAuth();

  // Get the intended destination from navigation state
  const from = location.state?.from?.pathname || '/';

  const handleAuthSuccess = (user: any) => {
    console.log('Civic Auth successful:', user);
    // Redirect to the intended destination or dashboard
    navigate(from, { replace: true });
  };

  const handleAuthError = (error: string) => {
    console.error('Civic Auth error:', error);
    // Error is already displayed in the CivicAuth component
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="absolute top-4 left-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 mb-4">
            <Shield className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ShopSense</h1>
          <p className="text-gray-600">Secure authentication powered by Civic</p>
          
          {/* Show where user will be redirected */}
          {from !== '/' && (
            <p className="text-sm text-gray-500 mt-2">
              You'll be redirected to {from} after signing in
            </p>
          )}
        </div>

        {/* Civic Auth Component */}
        <CivicAuth
          onAuthSuccess={handleAuthSuccess}
          onAuthError={handleAuthError}
        />

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Powered by{' '}
            <a
              href="https://civic.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Civic
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CivicAuthPage;
