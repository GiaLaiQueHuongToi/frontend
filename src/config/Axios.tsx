import axios, { AxiosInstance, AxiosError } from 'axios';

// Debug environment variable
console.log('🔧 Environment Check:', {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NODE_ENV: process.env.NODE_ENV,
    allEnvVars: Object.keys(process.env).filter((key) =>
        key.startsWith('NEXT_PUBLIC_')
    ),
});

const Axios: AxiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
        'Content-Type': 'application/json',
        Accept: '*/*',
    },
});

// Add request interceptor to include token
Axios.interceptors.request.use((config) => {
    // Log all outgoing API calls with full URL
    const fullURL = `${config.baseURL}${config.url}`;
    console.log('🚀 API Request:', {
        method: config.method?.toUpperCase(),
        baseURL: config.baseURL,
        endpoint: config.url,
        fullURL: fullURL,
        headers: config.headers,
        data: config.data,
        timestamp: new Date().toISOString(),
    });

    // For login endpoint, add extra debugging
    if (config.url?.includes('/auth/login')) {
        console.log('🔐 Login Request Details:', {
            url: fullURL,
            method: config.method,
            headers: config.headers,
            body: JSON.stringify(config.data),
            contentType: config.headers['Content-Type'],
        });
    }

    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken');

        // Don't add Authorization header for auth endpoints (login, register)
        const isAuthEndpoint = config.url?.includes('/auth/login') || config.url?.includes('/auth/register');

        if (token && !isAuthEndpoint) {
            config.headers['Authorization'] = `Bearer ${token}`;
        } else if (isAuthEndpoint) {
            console.log(
                '🔐 Skipping auth header for auth endpoint:',
                config.url
            );
        }
    }
    return config;
});

// Add response interceptor for error handling
Axios.interceptors.response.use(
    (response) => {
        console.log('✅ API Success:', {
            status: response.status,
            url: response.config.url,
            method: response.config.method,
        });
        return response;
    },
    (error: AxiosError) => {
        console.error('❌ API Error Details:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            url: error.config?.url,
            method: error.config?.method?.toUpperCase(),
            requestHeaders: error.config?.headers,
            requestData: error.config?.data,
            responseHeaders: error.response?.headers,
            responseData: error.response?.data,
            message: error.message,
        });

        if (error.response?.status === 401) {
            console.log(
                '🔒 Authentication failed - check credentials and backend'
            );
            // Token expired or invalid, clear auth and redirect
            // localStorage.removeItem('accessToken');
            // localStorage.removeItem('username');
            // localStorage.removeItem('isAuthenticated');
            // localStorage.removeItem('user');
            // Only redirect if not already on auth pages
            // if (typeof window !== 'undefined' && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
            //   window.location.href = '/login';
            // }
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
