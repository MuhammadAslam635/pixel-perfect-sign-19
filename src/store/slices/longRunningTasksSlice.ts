import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface LongRunningTask {
  id: string; // Unique task identifier (can be messageId or custom)
  chatId: string;
  messageId?: string; // Optional - the message being processed
  title: string; // Display title (e.g., "Generating response for chat...")
  description?: string; // Optional description
  startTime: number; // Timestamp when task started
  lastUpdate: number; // Timestamp of last update
  status: 'running' | 'completed' | 'error' | 'cancelled';
  progress?: number; // Optional progress percentage (0-100)
  errorMessage?: string; // Error message if status is 'error'
  type: 'streaming_message' | 'file_upload' | 'other'; // Type of task
}

export interface LongRunningTasksState {
  tasks: LongRunningTask[];
  isVisible: boolean; // Whether the tasks dropdown is visible
}

const initialState: LongRunningTasksState = {
  tasks: [],
  isVisible: false,
};

const longRunningTasksSlice = createSlice({
  name: "longRunningTasks",
  initialState,
  reducers: {
    // Add a new long-running task
    addTask: (state, action: PayloadAction<LongRunningTask>) => {
      // Check if task already exists
      const existingIndex = state.tasks.findIndex(task => task.id === action.payload.id);
      if (existingIndex !== -1) {
        // Update existing task
        state.tasks[existingIndex] = { ...state.tasks[existingIndex], ...action.payload };
      } else {
        // Add new task
        state.tasks.push(action.payload);
      }
    },

    // Update an existing task
    updateTask: (state, action: PayloadAction<{ id: string; updates: Partial<LongRunningTask> }>) => {
      const { id, updates } = action.payload;
      const taskIndex = state.tasks.findIndex(task => task.id === id);
      if (taskIndex !== -1) {
        state.tasks[taskIndex] = {
          ...state.tasks[taskIndex],
          ...updates,
          lastUpdate: Date.now(),
        };
      }
    },

    // Remove a specific task
    removeTask: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter(task => task.id !== action.payload);
    },

    // Remove all completed tasks
    clearCompletedTasks: (state) => {
      state.tasks = state.tasks.filter(task => task.status !== 'completed');
    },

    // Remove all tasks
    clearAllTasks: (state) => {
      state.tasks = [];
    },

    // Mark a task as completed
    completeTask: (state, action: PayloadAction<string>) => {
      const taskIndex = state.tasks.findIndex(task => task.id === action.payload);
      if (taskIndex !== -1) {
        state.tasks[taskIndex].status = 'completed';
        state.tasks[taskIndex].lastUpdate = Date.now();
      }
    },

    // Mark a task as error
    errorTask: (state, action: PayloadAction<{ id: string; errorMessage: string }>) => {
      const { id, errorMessage } = action.payload;
      const taskIndex = state.tasks.findIndex(task => task.id === id);
      if (taskIndex !== -1) {
        state.tasks[taskIndex].status = 'error';
        state.tasks[taskIndex].errorMessage = errorMessage;
        state.tasks[taskIndex].lastUpdate = Date.now();
      }
    },

    // Cancel a task
    cancelTask: (state, action: PayloadAction<string>) => {
      const taskIndex = state.tasks.findIndex(task => task.id === action.payload);
      if (taskIndex !== -1) {
        state.tasks[taskIndex].status = 'cancelled';
        state.tasks[taskIndex].lastUpdate = Date.now();
      }
    },

    // Start tracking a streaming message task
    startStreamingTask: (state, action: PayloadAction<{ chatId: string; messageId?: string; title: string; description?: string }>) => {
      const { chatId, messageId, title, description } = action.payload;
      const taskId = messageId || `streaming-${chatId}-${Date.now()}`;

      const task: LongRunningTask = {
        id: taskId,
        chatId,
        messageId,
        title,
        description,
        startTime: Date.now(),
        lastUpdate: Date.now(),
        status: 'running',
        type: 'streaming_message',
      };

      // Check if task already exists
      const existingIndex = state.tasks.findIndex(t => t.id === taskId);
      if (existingIndex !== -1) {
        state.tasks[existingIndex] = task;
      } else {
        state.tasks.push(task);
      }
    },

    // Update streaming task progress
    updateStreamingTask: (state, action: PayloadAction<{ chatId: string; messageId?: string; step?: string }>) => {
      const { chatId, messageId, step } = action.payload;
      const taskId = messageId || `streaming-${chatId}`;

      const taskIndex = state.tasks.findIndex(task =>
        task.id === taskId || (task.chatId === chatId && task.type === 'streaming_message' && task.status === 'running')
      );

      if (taskIndex !== -1) {
        state.tasks[taskIndex].lastUpdate = Date.now();
        if (step) {
          state.tasks[taskIndex].description = step;
        }
      }
    },

    // Complete streaming task
    completeStreamingTask: (state, action: PayloadAction<{ chatId: string; messageId?: string }>) => {
      const { chatId, messageId } = action.payload;
      const taskId = messageId || `streaming-${chatId}`;

      const taskIndex = state.tasks.findIndex(task =>
        task.id === taskId || (task.chatId === chatId && task.type === 'streaming_message' && task.status === 'running')
      );

      if (taskIndex !== -1) {
        state.tasks[taskIndex].status = 'completed';
        state.tasks[taskIndex].lastUpdate = Date.now();
      }
    },

    // UI visibility
    setTasksVisible: (state, action: PayloadAction<boolean>) => {
      state.isVisible = action.payload;
    },

    toggleTasksVisible: (state) => {
      state.isVisible = !state.isVisible;
    },

    // Clean up old completed tasks (older than specified minutes)
    cleanupOldTasks: (state, action: PayloadAction<number>) => {
      const cutoffTime = Date.now() - (action.payload * 60 * 1000); // minutes to milliseconds
      state.tasks = state.tasks.filter(task =>
        task.status !== 'completed' || task.lastUpdate > cutoffTime
      );
    },

    // Get running tasks count (for badge display)
    getRunningTasksCount: (state) => {
      return state.tasks.filter(task => task.status === 'running').length;
    },
  },
});

// Action creators are generated for each case reducer function
export const {
  addTask,
  updateTask,
  removeTask,
  clearCompletedTasks,
  clearAllTasks,
  completeTask,
  errorTask,
  cancelTask,
  startStreamingTask,
  updateStreamingTask,
  completeStreamingTask,
  setTasksVisible,
  toggleTasksVisible,
  cleanupOldTasks,
} = longRunningTasksSlice.actions;

// Selectors
export const selectRunningTasks = (state: { longRunningTasks: LongRunningTasksState }) =>
  state.longRunningTasks.tasks.filter(task => task.status === 'running');

export const selectCompletedTasks = (state: { longRunningTasks: LongRunningTasksState }) =>
  state.longRunningTasks.tasks.filter(task => task.status === 'completed');

export const selectTasksByChatId = (chatId: string) => (state: { longRunningTasks: LongRunningTasksState }) =>
  state.longRunningTasks.tasks.filter(task => task.chatId === chatId);

export const selectRunningTasksCount = (state: { longRunningTasks: LongRunningTasksState }) =>
  state.longRunningTasks.tasks.filter(task => task.status === 'running').length;

export default longRunningTasksSlice.reducer;
