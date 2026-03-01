import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import { useMemo } from 'react';

export const useAxios = (baseURL?: string) => {
  const { getAccessTokenSilently } = useAuth0();

  const instance = useMemo(() => {
    const axiosInstance = axios.create({
      baseURL: baseURL || import.meta.env.VITE_MONGO_API_URL,
    });

    axiosInstance.interceptors.request.use(async (config) => {
      try {
        const token = await getAccessTokenSilently();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        // Fallback for cases where token retrieval fails (e.g., local dev without full auth)
        console.warn('Axios interceptor: Could not get access token silently', error);
      }
      return config;
    });

    return axiosInstance;
  }, [getAccessTokenSilently, baseURL]);

  return instance;
};
