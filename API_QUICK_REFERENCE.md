# Authentication API Quick Reference

## Environment Setup

```bash
# .env.development
VITE_APP_BACKEND_URL=http://localhost:5111/api
```

## Quick Import Guide

```typescript
// Auth Service
import { authService } from "@/services/auth.service";

// Redux Actions
import {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
} from "@/store/slices/authSlice";

// Auth Helpers
import {
  isAuthenticated,
  getUserData,
  clearAuthData,
} from "@/utils/authHelpers";

// Toast Notifications
import { toast } from "sonner";
```

## API Methods

### 1. Register

```typescript
await authService.register({
  company: "Company Name",
  industry: "Tech", // optional
  email: "user@example.com",
  password: "password123",
  confirm_password: "password123",
});
```

### 2. Login

```typescript
const response = await authService.login({
  email: "user@example.com",
  password: "password123",
});
// Returns: { success, message, token, user }
```

### 3. Forgot Password

```typescript
await authService.forgotPassword({
  email: "user@example.com",
});
```

### 4. Reset Password

```typescript
await authService.resetPassword({
  token: "token_from_email_url",
  password: "newpassword123",
  confirm_password: "newpassword123",
});
```

### 5. Get Current User

```typescript
const userData = await authService.getMe();
```

### 6. Logout

```typescript
authService.logout();
dispatch(logout());
```

## Redux State Usage

```typescript
import { useSelector, useDispatch } from "react-redux";

const { isAuthenticated, user, loading, error } = useSelector(
  (state: RootState) => state.auth
);
const dispatch = useDispatch();

// Login flow
dispatch(loginStart());
try {
  const response = await authService.login({ email, password });
  dispatch(loginSuccess(response.user));
  toast.success("Login successful!");
} catch (error: any) {
  dispatch(loginFailure(error.message));
  toast.error(error.message);
}
```

## Error Handling Pattern

```typescript
try {
  const response = await authService.METHOD({ ...data });

  if (response.success) {
    toast.success(response.message);
    // Handle success
  } else {
    toast.error(response.message);
  }
} catch (error: any) {
  const errorMessage =
    error.response?.data?.message ||
    error.response?.data?.errors?.[0]?.msg ||
    "Network error. Please try again.";
  toast.error(errorMessage);
}
```

## Password Requirements

- Minimum: 8 characters
- Maximum: 15 characters
- Must match confirm_password field

## Response Status Codes

- `200`: Success
- `401`: Unauthorized / Invalid credentials
- `404`: User not found
- `422`: Validation error
- `500`: Server error

## Common Validation Errors

### Registration

- `company`: Required, min 1 character
- `email`: Required, valid email format
- `password`: Required, 8-15 characters
- `confirm_password`: Must match password

### Login

- `email`: Required, valid email format
- `password`: Required

### Reset Password

- `token`: Required, from email URL
- `password`: Required, 8-15 characters
- `confirm_password`: Must match password

## Protected Routes

```tsx
import ProtectedRoute from "@/components/ProtectedRoute";

<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>;
```

## Getting Query Parameters

```typescript
import { useSearchParams } from "react-router-dom";

const [searchParams] = useSearchParams();
const token = searchParams.get("token"); // For reset password
```

## Checking Authentication Status

```typescript
import { isAuthenticated } from "@/utils/authHelpers";

if (isAuthenticated()) {
  // User is logged in
}
```

## Getting User Data

```typescript
import { getUserData } from "@/utils/authHelpers";

const user = getUserData();
if (user) {
  console.log(user.email);
  console.log(user.company);
  console.log(user.token);
}
```

## Complete Component Example

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import {
  loginStart,
  loginSuccess,
  loginFailure,
} from "@/store/slices/authSlice";

const LoginComponent = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    dispatch(loginStart());

    try {
      const response = await authService.login({ email, password });

      if (response.success) {
        dispatch(loginSuccess(response.user));
        toast.success("Login successful!");
        navigate("/dashboard");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Network error. Please try again.";
      dispatch(loginFailure(errorMessage));
      toast.error(errorMessage);
    }
  };

  return <form onSubmit={handleSubmit}>{/* Form fields */}</form>;
};
```
