'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { authService, type User, type RegisterRequest, type LoginRequest } from '@/services/authService';

export interface UseAuth {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export function useAuth(): UseAuth {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
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

      toast({
        title: 'Login successful!',
        description: 'Welcome back to the platform.',
      });

      // Redirect to dashboard
      router.push('/dashboard');
      
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
    
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out.',
    });
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    checkAuth,
  };
}