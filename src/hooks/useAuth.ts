'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { authService, type User, type RegisterRequest, type LoginRequest } from '@/services/authService';
import Axios from '@/config/Axios';

export interface UseAuth {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isYouTubeConnected: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
  checkYouTubeConnection: () => Promise<void>;
}

export function useAuth(): UseAuth {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isYouTubeConnected, setIsYouTubeConnected] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      
      if (authService.isAuthenticated()) {
        setIsAuthenticated(true);
        
        // Try to get stored user or fetch from API
        const storedUser = authService.getStoredUser();
        if (storedUser) {
          setUser(storedUser);
        } else {
          // Optionally fetch user profile from API
          try {
            const userProfile = await authService.getUserProfile();
            setUser(userProfile);
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
    }
  };

  const checkYouTubeConnection = async () => {
    try {
      // First, check if YouTube access token exists in localStorage
      const youtubeToken = localStorage.getItem('youtubeAccessToken');
      
      if (youtubeToken) {
        // Token exists in localStorage
        console.log('YouTube token found in localStorage');
        setIsYouTubeConnected(true);
        return;
      }
  
      // Token not in localStorage, check server
      console.log('YouTube token not found locally, checking server...');
      const response = await Axios.get('/auth/youtube-access-token');
      
      // Assuming server returns: { code: 1000, data: { accessToken: "token_value" } }
      if (response.data.code === 1000 && response.data.data?.accessToken) {
        // Store the token in localStorage
        localStorage.setItem('youtubeAccessToken', response.data.data.accessToken);
        console.log('YouTube token retrieved from server and stored locally');
        setIsYouTubeConnected(true);
      } else {
        console.log('Server response OK but no valid token found');
        setIsYouTubeConnected(false);
      }
      
    } catch (error: any) {
      console.warn('Could not check YouTube connection status:', error);
      
      // Handle specific error cases
      if (error.response?.status === 404) {
        console.log('YouTube token not found on server');
      } else if (error.response?.status === 401) {
        console.log('User not authenticated for YouTube token check');
      }
      
      setIsYouTubeConnected(false);
    }
  };

  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      setIsLoading(true);
      
      console.log('Attempting login with credentials:', credentials);
      await authService.login(credentials);
      
      // Update state
      setIsAuthenticated(true);
      
      // Try to fetch user profile
      try {
        const userProfile = await authService.getUserProfile();
        setUser(userProfile);
      } catch (error) {
        // Use basic user info if profile fetch fails
        setUser({
          id: 0,
          username: credentials.username,
          notes: '',
          role: { name: 'USER', description: 'User' }
        });
      }

      // Check YouTube connection
      await checkYouTubeConnection();

      toast({
        title: 'Login successful!',
        description: 'Welcome back to the platform.',
      });

      // Check if there's a stored redirect path
      const redirectPath = localStorage.getItem('redirectAfterLogin');
      if (redirectPath) {
        localStorage.removeItem('redirectAfterLogin');
        router.push(redirectPath);
      } else {
        router.push('/dashboard');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      
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
      
      // Validate passwords match
      if (userData.password !== userData.confirmPassword) {
        throw new Error("Passwords don't match");
      }

      const newUser = await authService.register(userData);
      
      toast({
        title: 'Registration successful!',
        description: 'Please log in with your new account.',
      });

      // Redirect to login page
      router.push('/login');
      
    } catch (error) {
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

  return {
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
}