import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getUserData, clearAuthData } from "@/utils/authHelpers";

interface User {
  email: string;
  name: string;
  company?: string;
  role?: string;
  _id?: string;
  [key: string]: any;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
  mfaRequired: boolean;
  mfaToken: string | null;
}

// Initialize state from localStorage
const userData = getUserData();
const initialState: AuthState = {
  isAuthenticated: !!userData?.token,
  user: userData
    ? {
        email: userData.email,
        name: userData.name || userData.email,
        ...userData,
      }
    : null,
  loading: false,
  error: null,
  mfaRequired: false,
  mfaToken: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
      state.error = null;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      // 1. Reset Redux State
      state.isAuthenticated = false;
      state.user = null;
      state.loading = false;
      state.error = null;
      
      // 2. Clear Persistence
      clearAuthData();
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    setMfaRequired: (state, action: PayloadAction<{ required: boolean; token: string | null }>) => {
      state.mfaRequired = action.payload.required;
      state.mfaToken = action.payload.token;
      state.loading = false;
      state.error = null;
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, updateUser, setMfaRequired } =
  authSlice.actions;
export default authSlice.reducer;
