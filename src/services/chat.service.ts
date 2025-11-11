import API from "@/utils/api";
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
