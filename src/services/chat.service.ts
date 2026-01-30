import API from "@/utils/api";
import { getAuthToken } from "@/utils/authHelpers";
import {
  ChatDetail,
  ChatSummary,
  SendChatMessageResponse,
} from "@/types/chat.types";

export const fetchChatList = async (): Promise<ChatSummary[]> => {
  const response = await API.get<{ success: boolean; data: ChatSummary[] }>(
    "/chat/list"
  );
  return response.data.data ?? [];
};

export const fetchChatById = async (
  chatId: string
): Promise<ChatDetail | null> => {
  if (!chatId) {
    return null;
  }

  const response = await API.get<{ success: boolean; data: ChatDetail }>(
    `/chat/${chatId}`
  );
  return response.data.data;
};

export type SendChatMessagePayload = {
  message: string;
  chatId?: string | null;
  file?: File | null;
};

export const sendChatMessage = async (
  payload: SendChatMessagePayload
): Promise<SendChatMessageResponse> => {
  const formData = new FormData();
  formData.append("message", payload.message);

  if (payload.chatId) {
    formData.append("chatId", payload.chatId);
  }

  if (payload.file) {
    formData.append("file", payload.file);
  }

  const response = await API.post<SendChatMessageResponse>(
    "/chat/send-message",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

export const deleteChatById = async (chatId: string) => {
  await API.delete(`/chat/${chatId}`);
};

export type StreamEvent = {
  type: 'connection' | 'start' | 'step' | 'complete' | 'result' | 'error';
  step?: string;
  description?: string;
  timestamp?: string;
  message?: string;
  success?: boolean;
  data?: any;
  error?: string;
  agentType?: string;
  uploadedFile?: any;
  controlFlow?: string;
};

export const sendStreamingChatMessage = async (
  payload: SendChatMessagePayload,
  onEvent: (event: StreamEvent) => void
): Promise<SendChatMessageResponse> => {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("message", payload.message);

    if (payload.chatId) {
      formData.append("chatId", payload.chatId);
    }

    if (payload.file) {
      formData.append("file", payload.file);
    }

    // Get token using auth helper
    const token = getAuthToken();
    if (!token) {
      reject(new Error('No authentication token found'));
      return;
    }

    const controller = new AbortController();

    fetch(`${API.defaults.baseURL}/chat/send-stream-message`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true',
        // Don't set Content-Type for FormData, let the browser set it with boundary
      },
      body: formData,
      signal: controller.signal,
    }).then(async response => {
      if (!response.ok) {
        // Try to parse JSON error response from backend
        let errorMessage = 'Unable to send message';
        
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } else {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
          }
        } catch (parseError) {
          // If parsing fails, use generic message
          console.error('Error parsing error response:', parseError);
        }
        
        // For server errors (5xx), provide user-friendly message
        if (response.status >= 500) {
          throw new Error('The server encountered an error. Please check your internet connection and try again.');
        }
        
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      const readStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || ''; // Keep incomplete data in buffer

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  console.log('Stream event received:', data);
                  onEvent(data);

                  // Resolve promise on result or error
                  if (data.type === 'result' && data.success) {
                    resolve(data);
                  } else if (data.type === 'error') {
                    // Provide user-friendly error message for streaming errors
                    const errorMsg = data.message || data.error || 'Streaming error';
                    const lowerErrorMsg = errorMsg.toLowerCase();
                    if (lowerErrorMsg.includes('internet') || lowerErrorMsg.includes('connection') || lowerErrorMsg.includes('network')) {
                      reject(new Error(errorMsg));
                    } else {
                      reject(new Error('Connection interrupted. Please check your internet connection and try again.'));
                    }
                  }
                } catch (parseError) {
                  console.error('Failed to parse SSE data:', parseError);
                }
              } else if (line === 'event: close') {
                // Connection closed
                break;
              }
            }
          }
        } catch (error) {
          // Handle stream reading errors (network interruptions, etc.)
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (
            errorMessage.includes('NetworkError') ||
            errorMessage.includes('Failed to fetch') ||
            errorMessage.includes('ECONNREFUSED') ||
            errorMessage.includes('ETIMEDOUT') ||
            errorMessage.includes('ERR_NETWORK')
          ) {
            reject(new Error('Connection lost. Please check your internet connection and try again.'));
          } else {
            reject(error);
          }
        }
      };

      readStream();
    }).catch(error => {
      if (error.name !== 'AbortError') {
        // Handle fetch errors (network issues, etc.)
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('NetworkError') ||
          errorMessage.includes('ECONNREFUSED') ||
          errorMessage.includes('ETIMEDOUT') ||
          errorMessage.includes('ERR_NETWORK') ||
          errorMessage.includes('ERR_INTERNET_DISCONNECTED')
        ) {
          reject(new Error('Unable to connect to the server. Please check your internet connection and try again.'));
        } else {
          reject(error);
        }
      }
    });
  });
};

// Company Admin - view user's chat history endpoints

export interface CompanyUser {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export const fetchCompanyUsers = async (): Promise<CompanyUser[]> => {
  const response = await API.get<{ success: boolean; data: CompanyUser[] }>(
    "/chat/company/users"
  );
  return response.data.data ?? [];
};

export const fetchUserChatList = async (
  userId: string
): Promise<{ user: { _id: string; name: string; email: string }; chats: ChatSummary[] } | null> => {
  if (!userId) {
    return null;
  }

  const response = await API.get<{
    success: boolean;
    data: {
      user: { _id: string; name: string; email: string };
      chats: ChatSummary[];
    };
  }>(`/chat/user/${userId}`);
  return response.data.data;
};

export const fetchUserChatDetail = async (
  userId: string,
  chatId: string
): Promise<ChatDetail | null> => {
  if (!userId || !chatId) {
    return null;
  }

  const response = await API.get<{ success: boolean; data: ChatDetail }>(
    `/chat/user/${userId}/${chatId}`
  );
  return response.data.data;
};

