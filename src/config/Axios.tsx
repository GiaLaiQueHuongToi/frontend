import axios, { AxiosInstance, AxiosError } from 'axios';

// Debug environment variable
console.log(' Environment Check:', {
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
    console.log('API Request:', {
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
        console.log('Login Request Details:', {
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
                'Skipping auth header for auth endpoint:',
                config.url
            );
        }
    }
    return config;
});


export default Axios;

