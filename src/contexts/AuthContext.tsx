'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { authService, type User, type RegisterRequest, type LoginRequest } from '@/services/authService';
import Axios from '@/config/Axios';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isYouTubeConnected: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  checkYouTubeConnection: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isYouTubeConnected, setIsYouTubeConnected] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // This useEffect will only run ONCE for the entire app
  useEffect(() => {
    console.log('🚀 AuthProvider mounted, checking auth status...');
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Checking authentication status...');
      
      if (authService.isAuthenticated()) {
        setIsAuthenticated(true);
        
        // Try to get stored user or fetch from API
        const storedUser = authService.getStoredUser();
        if (storedUser) {
          setUser(storedUser);
          console.log('👤 User loaded from storage:', storedUser.username);
        } else {
          // Optionally fetch user profile from API
          try {
            const userProfile = await authService.getUserProfile();
            setUser(userProfile);
            console.log('👤 User profile fetched from API:', userProfile.username);
          } catch (error) {
            console.warn('Could not fetch user profile:', error);
            // Use basic user info
            setUser({
              id: 0,
              username: authService.getUsername() || 'User',
              notes: '',
              role: { name: 'USER', description: 'User' }
            });
          }
        }

        // Check YouTube connection status
        await checkYouTubeConnection();
      } else {
        console.log('❌ Not authenticated');
        setIsAuthenticated(false);
        setUser(null);
        setIsYouTubeConnected(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      setUser(null);
      setIsYouTubeConnected(false);
    } finally {
      setIsLoading(false);
      console.log('✅ Auth check completed');
    }
  };

  const checkYouTubeConnection = async () => {
    console.log('🔍 Checking YouTube connection...');
    try {
      // First, check if YouTube access token exists in localStorage
      const youtubeToken = localStorage.getItem('youtubeAccessToken');
      
      if (youtubeToken) {
        // Verify token is still valid by making a test API call
        try {
          const response = await fetch(
            'https://www.googleapis.com/youtube/v3/channels?part=id&mine=true',
            {
              headers: {
                'Authorization': `Bearer ${youtubeToken}`,
                'Accept': 'application/json',
              }
            }
          );

          if (response.ok) {
            console.log('✅ YouTube token is valid');
            setIsYouTubeConnected(true);
            return;
          } else if (response.status === 401) {
            // Token expired, remove it
            localStorage.removeItem('youtubeAccessToken');
            console.log('⚠️ YouTube token expired, removed from storage');
          }
        } catch (error) {
          console.warn('YouTube token validation failed:', error);
        }
      }

      // Token not in localStorage or invalid, check server
      console.log('🔍 Checking server for YouTube access token...');
      const response = await Axios.get('/auth/youtube-access-token');
      
      if (response.data.code === 1000 && response.data.data?.accessToken) {
        // Store the token in localStorage
        localStorage.setItem('youtubeAccessToken', response.data.data.accessToken);
        console.log('✅ YouTube token retrieved from server and stored locally');
        setIsYouTubeConnected(true);
      } else {
        console.log('❌ No YouTube token found on server');
        setIsYouTubeConnected(false);
      }
      
    } catch (error: any) {
      console.warn('Could not check YouTube connection status:', error);
      
      // Handle specific error cases
      if (error.response?.status === 404) {
        console.log('YouTube token endpoint not found');
      } else if (error.response?.status === 401) {
        console.log('User not authenticated for YouTube token check');
      }
      
      setIsYouTubeConnected(false);
    }
  };

  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      setIsLoading(true);
      console.log('🔐 Starting login process...');
      
      const token = await authService.login(credentials);

      console.log('✅ Login successful, updating state...');
      setIsAuthenticated(true);
      
      // Try to fetch user profile
      try {
        const userProfile = await authService.getUserProfile();
        setUser(userProfile);
        console.log('👤 User profile loaded:', userProfile.username);
      } catch (error) {
        console.warn('Could not fetch user profile, using basic info');
        setUser({
          id: 0,
          username: credentials.username,
          notes: '',
          role: { name: 'USER', description: 'User' }
        });
      }

      // Check YouTube connection (don't let it fail the login)
      try {
        await checkYouTubeConnection();
      } catch (error) {
        console.warn('YouTube connection check failed:', error);
      }

      toast({
        title: 'Login successful!',
        description: 'Welcome back to the platform.',
      });

      // Check if there's a stored redirect path
      const redirectPath = localStorage.getItem('redirectAfterLogin');
      if (redirectPath) {
        localStorage.removeItem('redirectAfterLogin');
        console.log('🔄 Redirecting to stored path:', redirectPath);
        router.push(redirectPath);
      } else {
        console.log('🔄 Redirecting to dashboard');
        router.push('/dashboard');
      }
      
    } catch (error) {
      console.error('❌ Login failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      
      setIsAuthenticated(false);
      setUser(null);
      
      toast({
        title: 'Login failed',
        description: errorMessage,
        variant: 'destructive',
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterRequest): Promise<void> => {
    try {
      setIsLoading(true);
      console.log('📝 Starting registration process...');
      
      // Validate passwords match
      if (userData.password !== userData.confirmPassword) {
        throw new Error("Passwords don't match");
      }

      const newUser = await authService.register(userData);
      
      toast({
        title: 'Registration successful!',
        description: 'Please log in with your new account.',
      });

      console.log('🔄 Redirecting to login page');
      router.push('/login');
      
    } catch (error) {
      console.error('❌ Registration failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      
      toast({
        title: 'Registration failed',
        description: errorMessage,
        variant: 'destructive',
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    console.log('🚪 Logging out user...');
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    setIsYouTubeConnected(false);
    
    // Clear any stored redirect path
    localStorage.removeItem('redirectAfterLogin');
    
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out.',
    });
  };

  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    isYouTubeConnected,
    login,
    register,
    logout,
    checkAuth,
    checkYouTubeConnection,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}