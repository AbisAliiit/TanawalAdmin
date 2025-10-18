'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { UserRepository } from '@/repositories/user-repository';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User, Mail, Phone } from 'lucide-react';

export const UserProfile: React.FC = () => {
  const { user, getAccessToken } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      // This will automatically include the MSAL token in the request
      const userData = await UserRepository.getUsers();
      setUsers(userData);
    } catch (err) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApiCall = async () => {
    try {
      // Get access token manually if needed
      const token = await getAccessToken();
      console.log('Access token:', token);
      
      // Make API call
      await fetchUsers();
    } catch (err) {
      console.error('API call failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Profile
          </CardTitle>
          <CardDescription>
            Current authenticated user information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Email:</span>
                <span>{user.username}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Name:</span>
                <span>{user.name || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Account ID:</span>
                <span className="font-mono text-sm">{user.localAccountId}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No user information available</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Test</CardTitle>
          <CardDescription>
            Test API calls with MSAL authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleApiCall} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Test API Call'
            )}
          </Button>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {users.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">API Response:</h4>
              <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-auto">
                {JSON.stringify(users, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
