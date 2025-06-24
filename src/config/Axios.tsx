import axios, { AxiosInstance } from 'axios';

const Axios: AxiosInstance = axios.create({
    baseURL: process.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json',
        Accept: '*/*',
    },
});

export default Axios;
