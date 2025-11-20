import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { rbacService } from "@/services/rbac.service";
import { ModuleAccess } from "@/types/rbac.types";
import { logout } from "./authSlice";

interface PermissionsState {
  modules: ModuleAccess[];
  modulesByName: Record<string, ModuleAccess>;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  legacy: boolean;
}

const initialState: PermissionsState = {
  modules: [],
  modulesByName: {},
  loading: false,
  initialized: false,
  error: null,
  legacy: false,
};

export const fetchUserPermissions = createAsyncThunk<
  Awaited<ReturnType<typeof rbacService.getUserModules>>,
  void,
  { rejectValue: string }
>("permissions/fetchUserPermissions", async (_, { rejectWithValue }) => {
  try {
    const response = await rbacService.getUserModules();
    if (!response.success) {
      return rejectWithValue(response.message || "Unable to fetch permissions");
    }
    return response;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error.message ||
      "Unable to fetch permissions";
    return rejectWithValue(message);
  }
});

const permissionsSlice = createSlice({
  name: "permissions",
  initialState,
  reducers: {
    clearPermissions: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserPermissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserPermissions.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        const modules = action.payload.data || [];
        state.modules = modules;
        state.modulesByName = modules.reduce<Record<string, ModuleAccess>>(
          (acc, module) => {
            acc[module.name] = module;
            return acc;
          },
          {}
        );
        state.legacy = Boolean(action.payload.legacy);
      })
      .addCase(fetchUserPermissions.rejected, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.error =
          (action.payload as string) ||
          "Unable to fetch permissions. Please retry.";
        state.modules = [];
        state.modulesByName = {};
        state.legacy = false;
      })
      .addCase(logout, () => initialState);
  },
});

export const { clearPermissions } = permissionsSlice.actions;

export default permissionsSlice.reducer;
