import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { getUserData } from "@/utils/authHelpers";

const APP_BACKEND_URL = import.meta.env.VITE_APP_BACKEND_URL;

interface FacebookPage {
  id: string;
  name: string;
  category?: string;
  access_token?: string;
}

interface FacebookIntegration {
  _id: string;
  provider: string;
  pageId?: string;
  pages: FacebookPage[];
  tokenType?: string;
  receivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface FacebookStatusResponse {
  success: boolean;
  connected: boolean;
  integration: FacebookIntegration | null;
}

interface FacebookRedirectResponse {
  success: boolean;
  authUrl: string;
  state: string;
}

interface SelectPagePayload {
  pageId: string;
}

interface RefreshPagesResponse {
  success: boolean;
  message: string;
  pages: FacebookPage[];
}

const getAuthHeaders = () => {
  const user = getUserData();
  if (!user || !user.token) {
    throw new Error("User not authenticated");
  }
  return {
    Authorization: `Bearer ${user.token}`,
    "ngrok-skip-browser-warning": "true",
  };
};

export const useFacebookStatus = () => {
  const user = getUserData();

  return useQuery<FacebookStatusResponse>({
    queryKey: ["facebook-integration", user?._id],
    queryFn: async () => {
      const response = await axios.get(`${APP_BACKEND_URL}/facebook/status`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    },
    enabled: !!user,
    staleTime: 30000,
    retry: 1,
  });
};

export const useFacebookConnect = () => {
  return useMutation<FacebookRedirectResponse, Error>({
    mutationFn: async () => {
      const response = await axios.get(`${APP_BACKEND_URL}/facebook/redirect`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    },
    onError: (error: unknown) => {
      console.error("Facebook connect error:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to initiate Facebook connection.");
    },
  });
};

export const useFacebookDisconnect = () => {
  const queryClient = useQueryClient();
  const user = getUserData();

  return useMutation<unknown, Error>({
    mutationFn: async () => {
      const response = await axios.delete(
        `${APP_BACKEND_URL}/facebook/disconnect`,
        {
          headers: getAuthHeaders(),
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["facebook-integration", user?._id],
      });
    },
  });
};

export const useFacebookSelectPage = () => {
  const queryClient = useQueryClient();
  const user = getUserData();

  return useMutation<unknown, Error, SelectPagePayload>({
    mutationFn: async (payload: SelectPagePayload) => {
      const response = await axios.post(
        `${APP_BACKEND_URL}/facebook/select-page`,
        payload,
        {
          headers: getAuthHeaders(),
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["facebook-integration", user?._id],
      });
    },
  });
};

export const useFacebookRefreshPages = () => {
  const queryClient = useQueryClient();
  const user = getUserData();

  return useMutation<RefreshPagesResponse, Error>({
    mutationFn: async () => {
      const response = await axios.post(
        `${APP_BACKEND_URL}/facebook/refresh-pages`,
        {},
        {
          headers: getAuthHeaders(),
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["facebook-integration", user?._id],
      });
    },
  });
};

