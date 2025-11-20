import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import permissionsReducer from "./slices/permissionsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    permissions: permissionsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
