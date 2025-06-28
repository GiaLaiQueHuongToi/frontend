import axios, { AxiosInstance, AxiosError } from 'axios';

const Axios: AxiosInstance = axios.create({
  baseURL: 'http://localhost:4040',
  headers: {
    'Content-Type': 'application/json',
    'Accept': '*/*'
  },
});

// Add request interceptor to include token
Axios.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

// Add response interceptor for error handling
Axios.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear auth and redirect
      localStorage.removeItem('accessToken');
      localStorage.removeItem('username');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
      
      // Only redirect if not already on auth pages
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default Axios;























// import axios, { AxiosInstance } from 'axios';

// const Axios: AxiosInstance = axios.create({
//     baseURL: process.env.VITE_API_URL,
//     headers: {
//         'Content-Type': 'application/json',
//         Accept: '*/*',
//     },
// });

// export default Axios;
