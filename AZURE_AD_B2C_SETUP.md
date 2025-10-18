# Azure AD B2C Authentication Implementation

This document describes the Azure AD B2C authentication implementation for the Tanawal Admin Portal.

## Overview

The application uses Microsoft Authentication Library (MSAL) for React to implement Azure AD B2C authentication with the following features:

- **Automatic login redirect** when no session exists
- **Forgot password handling** (AADB2C90118 error code)
- **Token acquisition** for API calls
- **Logout functionality**
- **AdminGuard** component for route protection

## Configuration

### Azure AD B2C Settings

- **Tenant Name**: `tanawal`
- **Tenant Domain**: `tanawal.onmicrosoft.com`
- **Client ID**: `190c5bd6-ab69-4f8b-9165-4fca9c21c743`
- **Redirect URI**: `http://localhost:3000`
- **Admin Sign-in Flow**: `B2C_1_admin_signin`
- **Password Reset Flow**: `B2C_1_password_reset`

### MSAL Configuration

The MSAL configuration is defined in `src/lib/msal-config.ts`:

```typescript
export const msalConfig: Configuration = {
  auth: {
    clientId: '190c5bd6-ab69-4f8b-9165-4fca9c21c743',
    authority: 'https://tanawal.b2clogin.com/tanawal.onmicrosoft.com/B2C_1_admin_signin',
    knownAuthorities: ['tanawal.b2clogin.com'],
    redirectUri: 'http://localhost:3000',
    postLogoutRedirectUri: 'http://localhost:3000',
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  // ... additional configuration
};
```

## Components

### 1. AuthProvider (`src/components/auth/auth-provider.tsx`)

The main authentication context provider that:
- Manages user authentication state
- Handles login/logout operations
- Provides token acquisition functionality
- Handles forgot password flow (AADB2C90118)

### 2. AdminGuard (`src/components/auth/admin-guard.tsx`)

A component that automatically redirects unauthenticated users to login:
- Shows loading spinner during authentication check
- Automatically triggers login if user is not authenticated
- Wraps protected routes

### 3. LogoutButton (`src/components/auth/logout-button.tsx`)

Updated logout button that uses MSAL logout functionality.

## API Integration

### Token Management

The application automatically includes Azure AD B2C tokens in API requests:

1. **Axios Configuration** (`src/common/axios-config.ts`):
   - Automatically adds Bearer token to requests
   - Handles token refresh
   - Redirects to login on 401 errors

2. **Repository Pattern** (`src/repositories/`):
   - User and Order repositories with automatic token inclusion
   - Error handling for API calls
   - TypeScript interfaces for type safety

### Example Usage

```typescript
import { useAuth } from '@/components/auth/auth-provider';
import { UserRepository } from '@/repositories/user-repository';

const MyComponent = () => {
  const { user, getAccessToken } = useAuth();

  const fetchData = async () => {
    try {
      // Token is automatically included
      const users = await UserRepository.getUsers();
      console.log(users);
    } catch (error) {
      console.error('API call failed:', error);
    }
  };

  return (
    <div>
      <p>Welcome, {user?.username}</p>
      <button onClick={fetchData}>Fetch Users</button>
    </div>
  );
};
```

## Authentication Flow

1. **Initial Load**: AdminGuard checks authentication status
2. **Not Authenticated**: Automatically redirects to Azure AD B2C login
3. **Login Success**: User is redirected back to the application
4. **API Calls**: Tokens are automatically included in requests
5. **Token Expiry**: MSAL handles token refresh automatically
6. **Logout**: Clears session and redirects to login

## Error Handling

### Forgot Password (AADB2C90118)

When a user clicks "Forgot password" during login, the application:
1. Detects the AADB2C90118 error code
2. Automatically redirects to the password reset flow
3. Uses the `B2C_1_password_reset` authority

### API Errors

- **401 Unauthorized**: Automatically redirects to login
- **Network Errors**: Displayed to user with retry options
- **Token Refresh Failures**: Handled by MSAL automatically

## Security Features

- **Session Storage**: Tokens stored in browser session storage
- **Automatic Logout**: On token expiry or 401 errors
- **CSRF Protection**: Built into MSAL
- **Secure Redirects**: Validated redirect URIs

## Development

### Running the Application

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Navigate to `http://localhost:3000`

### Testing Authentication

1. The application will automatically redirect to Azure AD B2C login
2. Use your Azure AD B2C admin credentials
3. After successful login, you'll be redirected back to the dashboard
4. Test API calls using the "Test API Call" button on the dashboard

## Troubleshooting

### Common Issues

1. **Redirect URI Mismatch**: Ensure the redirect URI in Azure AD B2C matches `http://localhost:3000`
2. **CORS Issues**: Verify CORS settings in Azure AD B2C
3. **Token Issues**: Check browser console for MSAL errors
4. **Authority Issues**: Verify the authority URL is correct

### Debug Mode

Enable MSAL logging by updating the configuration:

```typescript
system: {
  loggerOptions: {
    loggerCallback: (level, message, containsPii) => {
      if (containsPii) return;
      console.log(`MSAL ${level}: ${message}`);
    },
    logLevel: LogLevel.Verbose,
  },
}
```

## Production Deployment

For production deployment:

1. Update redirect URIs in Azure AD B2C
2. Update the `redirectUri` and `postLogoutRedirectUri` in `msal-config.ts`
3. Consider using `localStorage` instead of `sessionStorage` for better UX
4. Enable HTTPS for all redirect URIs

## Files Modified/Created

- `src/lib/msal-config.ts` - MSAL configuration
- `src/components/auth/auth-provider.tsx` - Authentication context
- `src/components/auth/admin-guard.tsx` - Route protection
- `src/components/auth/logout-button.tsx` - Updated logout
- `src/common/axios-config.ts` - Token management
- `src/app/layout.tsx` - MSAL provider setup
- `src/app/login/page.tsx` - Updated login page
- `src/components/dashboard/user-profile.tsx` - Example component
- `src/repositories/user-repository.ts` - API integration example
