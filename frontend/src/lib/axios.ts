import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_MONGO_API_URL,
});

export const useAxios = () => {
  const { getAccessTokenSilently } = useAuth0();

  axiosInstance.interceptors.request.use(async (config) => {
    const token = await getAccessTokenSilently();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return axiosInstance;
};
