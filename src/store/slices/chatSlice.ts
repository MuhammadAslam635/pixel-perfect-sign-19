import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ChatMessage, ChatSummary, ChatDetail } from "@/types/chat.types";
import { StreamEvent } from "@/services/chat.service";

// Generate a unique tab ID for this browser tab/window
const generateTabId = (): string => {
  // Try to get existing tab ID from sessionStorage (unique per tab)
  const existingTabId = sessionStorage.getItem("chatTabId");
  if (existingTabId) {
    return existingTabId;
  }

  // Generate new tab ID
  const newTabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem("chatTabId", newTabId);
  return newTabId;
};

// Get the current tab ID (will be the same for the lifetime of this tab)
export const CURRENT_TAB_ID = generateTabId();

export interface ChatState {
  // Tab isolation
  tabId: string; // Current tab's unique ID

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

  // Message management - now tab-isolated
  optimisticMessagesByChat: Record<string, ChatMessage[]>;

  // Streaming state - support multiple concurrent chats - now tab-isolated
  streamingEventsByChat: Record<string, StreamEvent[]>; // Per-chat streaming events
  streamingChatIds: string[]; // Track which chats are currently streaming (supports multiple)
  remoteStreamingChatIds: string[]; // Track streams from OTHER tabs (for sync)
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
  tabId: CURRENT_TAB_ID,
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
  streamingEventsByChat: {},
  streamingChatIds: [],
  remoteStreamingChatIds: [],
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
      // Save current composer value to cache before switching
      if (state.selectedChatId && state.composerValue !== undefined) {
        state.composerValuesByChat[state.selectedChatId] = state.composerValue;
      }

      state.selectedChatId = action.payload;
      // Restore composer value for this chat
      state.composerValue =
        state.composerValuesByChat[action.payload || ""] || "";
    },

    // Mobile navigation
    setIsMobileListOpen: (state, action: PayloadAction<boolean>) => {
      state.isMobileListOpen = action.payload;
    },

    // Composer management
    setComposerValue: (state, action: PayloadAction<string>) => {
      // Only update the current composerValue (not the per-chat cache)
      // This prevents unnecessary state updates on every keystroke
      state.composerValue = action.payload;
    },

    // Save composer value to per-chat cache (called when switching chats or sending messages)
    saveComposerValueToCache: (state) => {
      if (state.selectedChatId && state.composerValue !== undefined) {
        state.composerValuesByChat[state.selectedChatId] = state.composerValue;
      }
    },

    setComposerValuesByChat: (
      state,
      action: PayloadAction<Record<string, string>>
    ) => {
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
    addOptimisticMessage: (
      state,
      action: PayloadAction<{ chatId: string; message: ChatMessage }>
    ) => {
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

    // Streaming state - per-chat operations
    addStreamingChat: (state, action: PayloadAction<string>) => {
      const chatId = action.payload;
      if (!state.streamingChatIds.includes(chatId)) {
        state.streamingChatIds.push(chatId);
      }
      // Initialize events array for this chat if it doesn't exist
      if (!state.streamingEventsByChat[chatId]) {
        state.streamingEventsByChat[chatId] = [];
      }
    },

    removeStreamingChat: (state, action: PayloadAction<string>) => {
      const chatId = action.payload;
      state.streamingChatIds = state.streamingChatIds.filter(
        (id) => id !== chatId
      );
      // Optionally clear events for this chat when streaming stops
      // Commented out to preserve events for UI display
      // delete state.streamingEventsByChat[chatId];
    },

    setStreamingEvents: (
      state,
      action: PayloadAction<{ chatId: string; events: StreamEvent[] }>
    ) => {
      const { chatId, events } = action.payload;
      state.streamingEventsByChat[chatId] = events;
    },

    addStreamingEvent: (
      state,
      action: PayloadAction<{ chatId: string; event: StreamEvent }>
    ) => {
      const { chatId, event } = action.payload;
      if (!state.streamingEventsByChat[chatId]) {
        state.streamingEventsByChat[chatId] = [];
      }
      state.streamingEventsByChat[chatId].push(event);
    },

    clearStreamingEvents: (state, action: PayloadAction<string>) => {
      const chatId = action.payload;
      if (state.streamingEventsByChat[chatId]) {
        state.streamingEventsByChat[chatId] = [];
      }
    },

    clearAllStreamingEvents: (state) => {
      state.streamingEventsByChat = {};
    },

    // Migrate streaming events from old chat ID to new chat ID (e.g., temp to real)
    migrateStreamingEvents: (
      state,
      action: PayloadAction<{ oldChatId: string; newChatId: string }>
    ) => {
      const { oldChatId, newChatId } = action.payload;
      if (state.streamingEventsByChat[oldChatId]) {
        // Move events to new chat ID
        state.streamingEventsByChat[newChatId] = [
          ...(state.streamingEventsByChat[newChatId] || []),
          ...state.streamingEventsByChat[oldChatId],
        ];
        // Remove old chat ID events
        delete state.streamingEventsByChat[oldChatId];
      }
      // Update streaming chat IDs array
      const oldIndex = state.streamingChatIds.indexOf(oldChatId);
      if (oldIndex !== -1) {
        state.streamingChatIds[oldIndex] = newChatId;
        // Ensure no duplicates
        state.streamingChatIds = Array.from(new Set(state.streamingChatIds));
      }
    },

    setRemoteStreamingChatIds: (state, action: PayloadAction<string[]>) => {
      state.remoteStreamingChatIds = action.payload;
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

    setSelectedChatDetail: (
      state,
      action: PayloadAction<ChatDetail | null>
    ) => {
      state.selectedChatDetail = action.payload;
    },

    // Add new chat to list
    addChatToList: (state, action: PayloadAction<ChatSummary>) => {
      state.chatList.unshift(action.payload);
    },

    // Update chat in list
    updateChatInList: (state, action: PayloadAction<ChatSummary>) => {
      const index = state.chatList.findIndex(
        (chat) => chat._id === action.payload._id
      );
      if (index !== -1) {
        state.chatList[index] = action.payload;
      }
    },

    // Remove chat from list
    removeChatFromList: (state, action: PayloadAction<string>) => {
      state.chatList = state.chatList.filter(
        (chat) => chat._id !== action.payload
      );
    },

    // Error handling
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Reset state (useful for logout or cleanup)
    resetChatState: (state) => {
      Object.assign(state, initialState);
    },

    // Initialize tab - clears state from other tabs/sessions
    initializeTab: (state) => {
      // Only clear state if this is a different tab
      // If returning to the same tab (after navigation), preserve the state
      if (state.tabId !== CURRENT_TAB_ID) {
        // This is a different tab - clear optimistic messages and streaming state from other tabs
        // These are tab-specific and shouldn't persist across tabs
        state.optimisticMessagesByChat = {};
        state.streamingEventsByChat = {};
        state.streamingChatIds = [];
        state.tabId = CURRENT_TAB_ID;
      }
      // If same tab, just ensure tabId is set (but keep existing state)
      state.tabId = CURRENT_TAB_ID;
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
    convertTemporaryChat: (
      state,
      action: PayloadAction<{ realChatId: string; title?: string }>
    ) => {
      const { realChatId, title } = action.payload;
      if (state.temporaryChat) {
        // Move messages from temporary chat to optimistic messages for the real chat
        if (!state.optimisticMessagesByChat[realChatId]) {
          state.optimisticMessagesByChat[realChatId] = [];
        }
        state.optimisticMessagesByChat[realChatId].push(
          ...state.temporaryChat.messages
        );

        // Clear temporary chat
        state.temporaryChat = null;
        state.isCreatingNewChat = false;
        state.selectedChatId = realChatId;

        // Update composer values mapping
        if (state.composerValuesByChat["__new_chat__"]) {
          state.composerValuesByChat[realChatId] =
            state.composerValuesByChat["__new_chat__"];
          delete state.composerValuesByChat["__new_chat__"];
        }
      }
    },

    // Handle URL parameters
    handleUrlMessage: (
      state,
      action: PayloadAction<{ message: string; chatId?: string }>
    ) => {
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
  saveComposerValueToCache,
  setComposerValuesByChat,
  setSearchTerm,
  setPendingFile,
  setIsCreatingNewChat,
  setDeletingChatId,
  addOptimisticMessage,
  removeOptimisticMessages,
  clearOptimisticMessages,
  addStreamingChat,
  removeStreamingChat,
  setStreamingEvents,
  addStreamingEvent,
  clearStreamingEvents,
  clearAllStreamingEvents,
  migrateStreamingEvents,
  setRemoteStreamingChatIds,
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
  initializeTab,
} = chatSlice.actions;

export default chatSlice.reducer;
