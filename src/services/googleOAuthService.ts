import Axios from '@/config/Axios';

export interface GoogleTokenResponse {
    access_token: string;
    refresh_token: string;
    id_token?: string;
    token_type: string;
    expires_in: number;
    scope: string;
}

export interface TokenStoreRequest {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
    scope: string;
}

export const googleOAuthService = {
    // Get Google OAuth URL from environment
    getAuthUrl: (): string => {
        if (!process.env.NEXT_PUBLIC_AUTH_GOOGLE_LINK) {
            console.error(
                'Google OAuth link not configured in environment variables'
            );
            return '';
        }
        return process.env.NEXT_PUBLIC_AUTH_GOOGLE_LINK || '';
    },

    // Exchange authorization code for access and refresh tokens
    exchangeCodeForTokens: async (
        code: string
    ): Promise<GoogleTokenResponse> => {
        try {
            const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
            const clientSecret = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET;

            if (!clientId || !clientSecret) {
                throw new Error('Google OAuth credentials not configured');
            }

            // Prepare form data for Google Token Exchange
            const params = new URLSearchParams();
            params.append('code', code);
            params.append(
                'redirect_uri',
                'http://localhost:8081/auth/grantcode'
            );
            params.append('client_id', clientId);
            params.append('client_secret', clientSecret);
            params.append('scope', 'openid');
            params.append('grant_type', 'authorization_code');

            // Make request to Google OAuth2 token endpoint
            const response = await fetch(
                'https://oauth2.googleapis.com/token',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        Accept: 'application/json',
                    },
                    body: params.toString(),
                }
            );

            if (!response.ok) {
                const errorData = await response.text();
                console.error('Google token exchange failed:', errorData);
                throw new Error(`Token exchange failed: ${response.status}`);
            }

            const tokenData: GoogleTokenResponse = await response.json();
            console.log('Google tokens received successfully');

            return tokenData;
        } catch (error) {
            console.error('Error exchanging code for tokens:', error);
            throw new Error('Failed to exchange authorization code for tokens');
        }
    },

    // Store tokens on your backend server
    storeTokens: async (tokenData: GoogleTokenResponse): Promise<void> => {
        try {
            const storeRequest: TokenStoreRequest = {
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token,
                tokenType: tokenData.token_type,
                expiresIn: tokenData.expires_in,
                scope: tokenData.scope,
            };

            const response = await Axios.post(
                '/auth/store-token',
                storeRequest
            );

            if (response.data.code === 1000) {
                console.log('Tokens stored successfully on server');
            } else {
                throw new Error('Failed to store tokens on server');
            }
        } catch (error) {
            console.error('Error storing tokens:', error);
            throw new Error('Failed to store tokens on server');
        }
    },

    // Complete OAuth flow: exchange code and store tokens
    completeOAuthFlow: async (code: string): Promise<void> => {
        try {
            // Step 1: Exchange code for tokens
            const tokenData =
                await googleOAuthService.exchangeCodeForTokens(code);

            // Step 2: Store tokens on backend
            await googleOAuthService.storeTokens(tokenData);

            console.log('OAuth flow completed successfully');
        } catch (error) {
            console.error('OAuth flow failed:', error);
            throw error;
        }
    },
};
