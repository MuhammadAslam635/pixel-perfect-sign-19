import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import permissionsReducer from "./slices/permissionsSlice";
import chatReducer from "./slices/chatSlice";
import longRunningTasksReducer from "./slices/longRunningTasksSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    permissions: permissionsReducer,
    chat: chatReducer,
    longRunningTasks: longRunningTasksReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
