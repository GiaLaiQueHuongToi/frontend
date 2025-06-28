'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { googleOAuthService } from '@/services/googleOAuthService';

export default function GoogleCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get authorization code from URL parameters
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        // Check for OAuth errors
        if (error) {
          throw new Error(`OAuth error: ${error}`);
        }

        if (!code) {
          throw new Error('Authorization code not found in callback');
        }

        console.log('Processing authorization code:', code);

        // Complete the OAuth flow
        await googleOAuthService.completeOAuthFlow(code);

        // Success
        setStatus('success');
        toast({
          title: 'YouTube Connected!',
          description: 'Your YouTube account has been successfully connected.',
        });

        // Redirect to dashboard after success
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);

      } catch (error) {
        console.error('OAuth callback error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        setErrorMessage(message);
        setStatus('error');
        
        toast({
          title: 'Connection Failed',
          description: message,
          variant: 'destructive',
        });
      }
    };

    handleCallback();
  }, [searchParams, router, toast]);

  const handleRetry = () => {
    // Redirect back to dashboard to try again
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'loading' && (
              <>
                <Loader className="h-5 w-5 animate-spin text-blue-600" />
                Connecting to YouTube
              </>
            )}
            {status === 'success' && (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                Successfully Connected
              </>
            )}
            {status === 'error' && (
              <>
                <XCircle className="h-5 w-5 text-red-600" />
                Connection Failed
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === 'loading' && (
            <p className="text-gray-600">
              Please wait while we connect your YouTube account...
            </p>
          )}
          
          {status === 'success' && (
            <div className="space-y-3">
              <p className="text-green-600 font-medium">
                Your YouTube account is now connected!
              </p>
              <p className="text-gray-600 text-sm">
                Redirecting you back to the dashboard...
              </p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-4">
              <p className="text-red-600 font-medium">
                Failed to connect your YouTube account
              </p>
              <p className="text-gray-600 text-sm">
                {errorMessage}
              </p>
              <Button 
                onClick={handleRetry}
                variant="outline"
                className="w-full"
              >
                Go Back to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}