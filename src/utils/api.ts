import axios, { AxiosInstance, AxiosResponse } from "axios";
import { getUserData, clearAuthData } from "./authHelpers";

// Create axios instance with base configuration
const createApiClient = (): AxiosInstance => {
  const API = axios.create({
    baseURL:
      import.meta.env.VITE_APP_BACKEND_URL || "http://localhost:3000/api",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
  });

  // Request interceptor to add auth token
  API.interceptors.request.use(
    (config) => {
      const userData = getUserData();
      if (userData?.token) {
        config.headers.Authorization = `Bearer ${userData.token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle common errors
  API.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    (error) => {
      // Handle 401 unauthorized - token might be expired
      if (error.response?.status === 401) {
        // Clear invalid token from localStorage
        clearAuthData();
        // Optionally redirect to login page
        window.location.href = "/login";
      }

      // Handle network errors
      if (!error.response) {
        console.error("Network error:", error.message);
      }

      return Promise.reject(error);
    }
  );

  return API;
};

const API = createApiClient();

export default API;
