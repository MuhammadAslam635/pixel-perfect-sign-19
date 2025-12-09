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
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
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
                  onEvent(data);

                  // Resolve promise on result or error
                  if (data.type === 'result' && data.success) {
                    resolve(data);
                  } else if (data.type === 'error') {
                    reject(new Error(data.message || 'Streaming error'));
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
          reject(error);
        }
      };

      readStream();
    }).catch(error => {
      if (error.name !== 'AbortError') {
        reject(error);
      }
    });
  });
};
