# Civic Auth Integration Guide

This guide explains how to complete the Civic Authentication integration for your ShopSense application.

## What's Been Implemented

### Frontend Changes
1. **Civic Auth Component** (`frontend/src/components/CivicAuth.tsx`)
   - Email, Google, and Wallet authentication tabs
   - Modern UI with shadcn/ui components
   - Loading states and error handling

2. **Updated AuthContext** (`frontend/src/context/AuthContext.js`)
   - Support for both Civic Auth and legacy JWT
   - Civic user management
   - Seamless fallback between auth methods

3. **Civic Auth Page** (`frontend/src/pages/CivicAuthPage.tsx`)
   - Dedicated authentication page
   - Professional design with ShopSense branding

4. **Updated Dashboard** (`frontend/src/components/Dashboard.tsx`)
   - Shows Civic Auth status
   - Displays wallet information for Web3 users
   - Civic branding indicators

### Backend Changes
1. **Enhanced User Model** (`users/models.py`)
   - Civic user ID tracking
   - Authentication method tracking
   - Wallet address storage
   - Civic metadata storage

2. **New API Endpoints** (`users/views.py`)
   - `/api/users/civic_sync/` - Sync Civic users
   - `/api/users/civic_logout/` - Handle Civic logout

## Next Steps to Complete Integration

### 1. Get Civic Auth Credentials
1. Visit [https://auth.civic.com](https://auth.civic.com)
2. Sign up for a Civic Auth account
3. Get your Client ID from the dashboard
4. Configure your redirect URIs

### 2. Install Civic Auth Packages
```bash
cd frontend
npm install @civic/auth @civic/auth-web3
```

### 3. Update Configuration
1. Copy `frontend/civic-config.example.js` to `frontend/civic-config.js`
2. Update with your actual Civic Client ID
3. Update redirect URIs if needed

### 4. Update Frontend Config
Replace the placeholder in `frontend/src/config/civic.js`:
```javascript
export const CIVIC_CONFIG = {
  clientId: 'your-actual-civic-client-id',
  // ... other config
};
```

### 5. Run Database Migrations
```bash
python manage.py makemigrations users
python manage.py migrate
```

### 6. Test the Integration
1. Start your Docker services
2. Navigate to `/auth` to see the Civic Auth page
3. Test different authentication methods
4. Verify user creation in the backend

## Features Available

### Authentication Methods
- **Email**: Traditional email-based authentication
- **Google**: OAuth integration with Google
- **Wallet**: Web3 wallet connection (Ethereum, Polygon, etc.)

### User Experience
- Seamless switching between auth methods
- Professional UI with loading states
- Error handling and user feedback
- Civic branding integration

### Backend Integration
- Automatic user creation/sync
- Wallet address storage
- Authentication method tracking
- Metadata preservation

## Security Features

- OIDC/OAuth 2.0 compliance
- Secure token handling
- User data validation
- Audit trail for auth methods

## Customization Options

### UI Customization
- Modify colors and branding in `CivicAuth.tsx`
- Update ShopSense branding elements
- Customize authentication flow

### Backend Customization
- Add custom user fields
- Implement additional validation
- Extend metadata storage

### Web3 Features
- Enable/disable specific chains
- Customize wallet connection flow
- Add blockchain-specific functionality

## Troubleshooting

### Common Issues
1. **Package not found**: Ensure Civic packages are installed
2. **Client ID errors**: Verify your Civic configuration
3. **Redirect URI mismatch**: Check Civic dashboard settings
4. **Database errors**: Run migrations and check model compatibility

### Debug Mode
Enable console logging in Civic Auth components to debug authentication flow.

## Support

- Civic Documentation: [https://docs.civic.com](https://docs.civic.com)
- Civic Auth Dashboard: [https://auth.civic.com](https://auth.civic.com)
- Community Support: Civic Discord/Telegram

## Production Deployment

### Environment Variables
Set these in production:
- `VITE_CIVIC_CLIENT_ID`
- `VITE_CIVIC_REDIRECT_URI`
- `VITE_API_URL`

### Security Considerations
- Use HTTPS in production
- Validate redirect URIs
- Implement rate limiting
- Monitor authentication logs

---

**Note**: This integration is currently in development mode. Replace placeholder implementations with actual Civic Auth library calls before production use.
