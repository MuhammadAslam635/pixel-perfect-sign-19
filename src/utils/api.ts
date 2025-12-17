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
        // Check if it's a real auth error or business logic error
        const errorMessage = error.response?.data?.message || "";

        // Business logic errors that shouldn't log out user
        // These are cases where user is authenticated but something else is wrong
        const businessErrorKeywords = [
          "integration",
          "microsoft",
          "calendar",
          "company",
          "integration owner",
          "reconnect",
        ];

        const isBusinessError = businessErrorKeywords.some((keyword) =>
          errorMessage.toLowerCase().includes(keyword.toLowerCase())
        );

        if (isBusinessError) {
          // Don't log out - just show error message
          // The error will be handled by the calling component
          return Promise.reject(error);
        }

        // Real authentication failure - log out
        clearAuthData();
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
