import axios, { AxiosInstance } from 'axios';

const AuthorizedAxios: AxiosInstance = axios.create({
	baseURL: process.env.VITE_API_URL,
	headers: {
		'Content-Type': 'application/json',
		'Accept': '*/*',
	},
});

// Add a request interceptor
AuthorizedAxios.interceptors.request.use((config) => {
	const token = localStorage.getItem('accessToken');
	if (token) {
		config.headers['Authorization'] = `Bearer ${token}`;
	}
	return config;
});
export default AuthorizedAxios;

// Add a response interceptor
AuthorizedAxios.interceptors.response.use(
    (response) => {
        console.log("Response received:", response);
        return response;
    },
    (error) => {
        console.error("Error response:", error);
        return Promise.reject(error);
    }
);