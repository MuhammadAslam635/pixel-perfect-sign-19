import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ChatMessage, ChatSummary, ChatDetail } from "@/types/chat.types";
import { StreamEvent } from "@/services/chat.service";

export interface ChatState {
  // Chat selection and navigation
  selectedChatId: string | null;
  isCreatingNewChat: boolean;
  isMobileListOpen: boolean;

  // Temporary chat (for new chats being created)
  temporaryChat: {
    id: string;
    title: string;
    createdAt: string;
    messages: ChatMessage[];
  } | null;

  // Composer state
  composerValue: string;
  composerValuesByChat: Record<string, string>; // Per-chat composer values

  // Search and filtering
  searchTerm: string;

  // File handling
  pendingFile: File | null;

  // Chat operations
  deletingChatId: string | null;

  // Message management
  optimisticMessagesByChat: Record<string, ChatMessage[]>;

  // Streaming state
  streamingEvents: StreamEvent[];
  isStreaming: boolean;
  useStreaming: boolean; // Default to streaming mode

  // UI state
  isChatListLoading: boolean;
  isChatDetailLoading: boolean;
  chatList: ChatSummary[];
  selectedChatDetail: ChatDetail | null;

  // Error handling
  error: string | null;
}

const initialState: ChatState = {
  selectedChatId: null,
  isCreatingNewChat: false,
  isMobileListOpen: false,
  temporaryChat: null,
  composerValue: "",
  composerValuesByChat: {},
  searchTerm: "",
  pendingFile: null,
  deletingChatId: null,
  optimisticMessagesByChat: {},
  streamingEvents: [],
  isStreaming: false,
  useStreaming: true,
  isChatListLoading: false,
  isChatDetailLoading: false,
  chatList: [],
  selectedChatDetail: null,
  error: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    // Chat selection
    setSelectedChatId: (state, action: PayloadAction<string | null>) => {
      state.selectedChatId = action.payload;
      // Restore composer value for this chat
      state.composerValue = state.composerValuesByChat[action.payload || ""] || "";
    },

    // Mobile navigation
    setIsMobileListOpen: (state, action: PayloadAction<boolean>) => {
      state.isMobileListOpen = action.payload;
    },

    // Composer management
    setComposerValue: (state, action: PayloadAction<string>) => {
      state.composerValue = action.payload;
      // Store per-chat composer value
      if (state.selectedChatId) {
        state.composerValuesByChat[state.selectedChatId] = action.payload;
      }
    },

    setComposerValuesByChat: (state, action: PayloadAction<Record<string, string>>) => {
      state.composerValuesByChat = action.payload;
    },

    // Search
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },

    // File handling
    setPendingFile: (state, action: PayloadAction<File | null>) => {
      state.pendingFile = action.payload;
    },

    // Chat creation
    setIsCreatingNewChat: (state, action: PayloadAction<boolean>) => {
      state.isCreatingNewChat = action.payload;
    },

    // Chat deletion
    setDeletingChatId: (state, action: PayloadAction<string | null>) => {
      state.deletingChatId = action.payload;
    },

    // Optimistic messages
    addOptimisticMessage: (state, action: PayloadAction<{ chatId: string; message: ChatMessage }>) => {
      const { chatId, message } = action.payload;
      if (!state.optimisticMessagesByChat[chatId]) {
        state.optimisticMessagesByChat[chatId] = [];
      }
      state.optimisticMessagesByChat[chatId].push(message);
    },

    removeOptimisticMessages: (state, action: PayloadAction<string>) => {
      delete state.optimisticMessagesByChat[action.payload];
    },

    clearOptimisticMessages: (state) => {
      state.optimisticMessagesByChat = {};
    },

    // Streaming state
    setStreamingEvents: (state, action: PayloadAction<StreamEvent[]>) => {
      state.streamingEvents = action.payload;
    },

    addStreamingEvent: (state, action: PayloadAction<StreamEvent>) => {
      state.streamingEvents.push(action.payload);
    },

    clearStreamingEvents: (state) => {
      state.streamingEvents = [];
    },

    setIsStreaming: (state, action: PayloadAction<boolean>) => {
      state.isStreaming = action.payload;
    },

    setUseStreaming: (state, action: PayloadAction<boolean>) => {
      state.useStreaming = action.payload;
    },

    // Chat list management
    setChatList: (state, action: PayloadAction<ChatSummary[]>) => {
      state.chatList = action.payload;
    },

    setIsChatListLoading: (state, action: PayloadAction<boolean>) => {
      state.isChatListLoading = action.payload;
    },

    setIsChatDetailLoading: (state, action: PayloadAction<boolean>) => {
      state.isChatDetailLoading = action.payload;
    },

    setSelectedChatDetail: (state, action: PayloadAction<ChatDetail | null>) => {
      state.selectedChatDetail = action.payload;
    },

    // Add new chat to list
    addChatToList: (state, action: PayloadAction<ChatSummary>) => {
      state.chatList.unshift(action.payload);
    },

    // Update chat in list
    updateChatInList: (state, action: PayloadAction<ChatSummary>) => {
      const index = state.chatList.findIndex(chat => chat._id === action.payload._id);
      if (index !== -1) {
        state.chatList[index] = action.payload;
      }
    },

    // Remove chat from list
    removeChatFromList: (state, action: PayloadAction<string>) => {
      state.chatList = state.chatList.filter(chat => chat._id !== action.payload);
    },

    // Error handling
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Reset state (useful for logout or cleanup)
    resetChatState: (state) => {
      Object.assign(state, initialState);
    },

    // Temporary chat management
    createTemporaryChat: (state) => {
      const now = new Date().toISOString();
      state.temporaryChat = {
        id: "__new_chat__",
        title: "New Conversation",
        createdAt: now,
        messages: [],
      };
      state.isCreatingNewChat = true;
      state.selectedChatId = "__new_chat__";
      state.composerValue = "";
    },

    addMessageToTemporaryChat: (state, action: PayloadAction<ChatMessage>) => {
      if (state.temporaryChat) {
        state.temporaryChat.messages.push(action.payload);
      }
    },

    updateTemporaryChatTitle: (state, action: PayloadAction<string>) => {
      if (state.temporaryChat) {
        state.temporaryChat.title = action.payload;
      }
    },

    clearTemporaryChat: (state) => {
      state.temporaryChat = null;
      state.isCreatingNewChat = false;
      if (state.selectedChatId === "__new_chat__") {
        state.selectedChatId = null;
      }
    },

    // Convert temporary chat to real chat (when server response arrives)
    convertTemporaryChat: (state, action: PayloadAction<{ realChatId: string; title?: string }>) => {
      const { realChatId, title } = action.payload;
      if (state.temporaryChat) {
        // Move messages from temporary chat to optimistic messages for the real chat
        if (!state.optimisticMessagesByChat[realChatId]) {
          state.optimisticMessagesByChat[realChatId] = [];
        }
        state.optimisticMessagesByChat[realChatId].push(...state.temporaryChat.messages);

        // Clear temporary chat
        state.temporaryChat = null;
        state.isCreatingNewChat = false;
        state.selectedChatId = realChatId;

        // Update composer values mapping
        if (state.composerValuesByChat["__new_chat__"]) {
          state.composerValuesByChat[realChatId] = state.composerValuesByChat["__new_chat__"];
          delete state.composerValuesByChat["__new_chat__"];
        }
      }
    },

    // Handle URL parameters
    handleUrlMessage: (state, action: PayloadAction<{ message: string; chatId?: string }>) => {
      const { message, chatId } = action.payload;
      if (message) {
        state.composerValue = message;
        state.isCreatingNewChat = true;
        state.selectedChatId = null;
      }
      if (chatId) {
        state.selectedChatId = chatId;
        state.isCreatingNewChat = false;
        state.isMobileListOpen = false;
        // Restore composer value for this chat
        state.composerValue = state.composerValuesByChat[chatId] || "";
      }
    },
  },
});

export const {
  setSelectedChatId,
  setIsMobileListOpen,
  setComposerValue,
  setComposerValuesByChat,
  setSearchTerm,
  setPendingFile,
  setIsCreatingNewChat,
  setDeletingChatId,
  addOptimisticMessage,
  removeOptimisticMessages,
  clearOptimisticMessages,
  setStreamingEvents,
  addStreamingEvent,
  clearStreamingEvents,
  setIsStreaming,
  setUseStreaming,
  setChatList,
  setIsChatListLoading,
  setIsChatDetailLoading,
  setSelectedChatDetail,
  addChatToList,
  updateChatInList,
  removeChatFromList,
  setError,
  resetChatState,
  createTemporaryChat,
  addMessageToTemporaryChat,
  updateTemporaryChatTitle,
  clearTemporaryChat,
  convertTemporaryChat,
  handleUrlMessage,
} = chatSlice.actions;

export default chatSlice.reducer;
