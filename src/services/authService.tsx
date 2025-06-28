import Axios from '@/config/Axios';

export interface RegisterRequest {
  username: string;
  role?: string;
  password: string;
  confirmPassword?: string; // Optional for registration forms
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  notes: string;
  role: {
    name: string;
    description: string;
  };
}

export interface AuthResponse<T> {
  code: number;
  data: T;
}

export interface LoginResponse {
  token: string;
}

export interface RegisterResponse {
  id: number;
  username: string;
  notes: string;
  role: {
    name: string;
    description: string;
  };
}

export const authService = {
  // Register new user
  register: async (userData: RegisterRequest): Promise<User> => {
    try {
      const response = await Axios.post<AuthResponse<RegisterResponse>>('/auth/register', {
        username: userData.username,
        role: userData.role || 'USER',
        password: userData.password,
        // email field removed
      });

      if (response.data.code === 1000) {
        return response.data.data;
      } else {
        throw new Error('Registration failed');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Enhanced error messages
      if (error.response?.status === 409) {
        throw new Error('Username already exists');
      } else if (error.response?.status === 400) {
        throw new Error('Invalid registration data');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Registration failed. Please try again.');
      }
    }
  },

  // Login user
  login: async (credentials: LoginRequest): Promise<string> => {
    try {
      const response = await Axios.post<AuthResponse<LoginResponse>>('/auth/login', {
        username: credentials.username,
        password: credentials.password,
      });

      if (response.data.code === 1000) {
        const token = response.data.data.token;
        
        // Store token in localStorage
        localStorage.setItem('accessToken', token);
        localStorage.setItem('username', credentials.username);
        localStorage.setItem('isAuthenticated', 'true');
        
        return token;
      } else {
        throw new Error('Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      if (error.response?.status === 401) {
        throw new Error('Invalid username or password');
      }
      
      throw new Error('Login failed. Please try again.');
    }
  },

  // Logout user
  logout: (): void => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('username');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    
    // Redirect to home page
    window.location.href = '/';
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('isAuthenticated') === 'true' && !!localStorage.getItem('accessToken');
  },

  // Get stored access token
  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  },

  // Get stored username
  getUsername: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('username');
  },

  // Get user profile (if you have this endpoint)
  getUserProfile: async (): Promise<User> => {
    try {
      const response = await Axios.get<AuthResponse<User>>('/auth');
      
      if (response.data.code === 1000) {
        // Store user info
        localStorage.setItem('user', JSON.stringify(response.data.data));
        return response.data.data;
      } else {
        throw new Error('Failed to get user profile');
      }
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },

  // Get stored user info
  getStoredUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    const userString = localStorage.getItem('user');
    return userString ? JSON.parse(userString) : null;
  },
};