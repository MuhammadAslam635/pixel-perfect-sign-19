# Authentication API Integration Guide

## Overview

This document describes the authentication API integration in the pixel-perfect-sign-19 frontend application that connects to the empatech backend.

## Backend API Endpoints

All authentication endpoints are prefixed with the base URL configured in `.env.development`:

```
VITE_APP_BACKEND_URL=http://localhost:5111/api
```

### Available Endpoints

#### 1. Register (Sign Up)

- **Endpoint**: `POST /api/register`
- **Request Body**:

```json
{
  "company": "string (required, min 1 char)",
  "industry": "string (optional)",
  "email": "string (required, valid email)",
  "password": "string (required, 8-15 chars)",
  "confirm_password": "string (required, must match password)"
}
```

- **Success Response** (200):

```json
{
  "success": true,
  "message": "Verification email sent successfully"
}
```

- **Error Response** (422):

```json
{
  "errors": [
    {
      "path": "email",
      "msg": "Error message"
    }
  ]
}
```

#### 2. Login (Sign In)

- **Endpoint**: `POST /api/login`
- **Request Body**:

```json
{
  "email": "string (required, valid email)",
  "password": "string (required)"
}
```

- **Success Response** (200):

```json
{
  "success": true,
  "message": "Login successful",
  "token": "JWT_TOKEN_STRING",
  "user": {
    "_id": "user_id",
    "email": "user@example.com",
    "company": "Company Name",
    "role": "Company",
    "isVerified": true
  }
}
```

- **Error Response** (401):

```json
{
  "message": "Invalid credentials"
}
```

#### 3. Forgot Password

- **Endpoint**: `POST /api/forgot-password`
- **Request Body**:

```json
{
  "email": "string (required, valid email)"
}
```

- **Success Response** (200):

```json
{
  "success": true,
  "message": "Password reset link sent to your email."
}
```

- **Error Response** (404):

```json
{
  "success": false,
  "message": "User not found"
}
```

#### 4. Reset Password

- **Endpoint**: `POST /api/reset-password`
- **Request Body**:

```json
{
  "token": "string (required, from email link)",
  "password": "string (required, 8-15 chars)",
  "confirm_password": "string (required, must match password)"
}
```

- **Success Response** (200):

```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

- **Error Response** (400):

```json
{
  "success": false,
  "message": "Invalid or expired token."
}
```

#### 5. Verify Email

- **Endpoint**: `GET /api/verify-email?token=TOKEN_STRING`
- **Query Parameters**:
  - `token`: Email verification token from the verification email
- **Success Response** (200):

```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

#### 6. Get Current User

- **Endpoint**: `GET /api/me`
- **Headers**: `Authorization: Bearer JWT_TOKEN`
- **Success Response** (200):

```json
{
  "user": {
    "_id": "user_id",
    "email": "user@example.com",
    "company": "Company Name",
    "role": "Company"
  }
}
```

## Frontend Implementation

### File Structure

```
src/
├── services/
│   └── auth.service.ts        # Authentication API service
├── utils/
│   ├── api.ts                 # Axios instance with interceptors
│   └── authHelpers.ts         # Auth helper functions
├── store/
│   └── slices/
│       └── authSlice.ts       # Redux auth state management
├── components/
│   ├── SignIn.tsx             # Login component
│   ├── SignUp.tsx             # Registration component
│   └── ProtectedRoute.tsx     # Route protection HOC
└── pages/
    └── auth/
        ├── ForgotPassword.tsx # Forgot password page
        └── ResetPassword.tsx  # Reset password page
```

### Authentication Service (`auth.service.ts`)

The auth service provides methods for all authentication operations:

```typescript
import { authService } from "@/services/auth.service";

// Register
await authService.register({
  company: "Company Name",
  email: "user@example.com",
  password: "password123",
  confirm_password: "password123",
});

// Login
await authService.login({
  email: "user@example.com",
  password: "password123",
});

// Forgot Password
await authService.forgotPassword({
  email: "user@example.com",
});

// Reset Password
await authService.resetPassword({
  token: "reset_token_from_email",
  password: "newpassword123",
  confirm_password: "newpassword123",
});

// Logout
authService.logout();
```

### Authentication Helpers (`authHelpers.ts`)

Helper functions for managing authentication state:

```typescript
import {
  getAuthToken,
  setAuthToken,
  clearAuthData,
  getUserData,
  isAuthenticated,
} from "@/utils/authHelpers";

// Check if user is authenticated
const isAuth = isAuthenticated();

// Get user data from localStorage
const user = getUserData();

// Get auth token
const token = getAuthToken();
```

### API Client (`api.ts`)

Axios instance with automatic token injection and error handling:

- Automatically adds `Authorization: Bearer TOKEN` header to all requests
- Handles 401 errors by clearing auth data and redirecting to login
- Base URL configured from environment variable

### Redux State Management

The auth state is managed using Redux Toolkit:

```typescript
import { useDispatch, useSelector } from "react-redux";
import {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
} from "@/store/slices/authSlice";

// In component
const dispatch = useDispatch();
const { isAuthenticated, user, loading } = useSelector(
  (state: RootState) => state.auth
);

// Login flow
dispatch(loginStart());
try {
  const response = await authService.login(credentials);
  dispatch(loginSuccess(response.user));
} catch (error) {
  dispatch(loginFailure(error.message));
}

// Logout
dispatch(logout());
```

### Protected Routes

Wrap protected routes with the `ProtectedRoute` component:

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

## Component Usage Examples

### Sign Up Component

```tsx
import { authService } from "@/services/auth.service";

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const response = await authService.register({
      company: companyName,
      email,
      password,
      confirm_password: confirmPassword,
    });

    if (response.success) {
      toast.success("Verification email sent!");
      navigate("/");
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Registration failed");
  }
};
```

### Sign In Component

```tsx
import { authService } from "@/services/auth.service";
import {
  loginStart,
  loginSuccess,
  loginFailure,
} from "@/store/slices/authSlice";

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  dispatch(loginStart());

  try {
    const response = await authService.login({ email, password });

    if (response.success) {
      dispatch(loginSuccess(response.user));
      toast.success("Login successful!");
      navigate("/dashboard");
    }
  } catch (error: any) {
    dispatch(loginFailure(error.response?.data?.message));
    toast.error(error.response?.data?.message);
  }
};
```

### Forgot Password Component

```tsx
import { authService } from "@/services/auth.service";

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const response = await authService.forgotPassword({ email });

    if (response.success) {
      toast.success("Reset link sent to your email");
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message);
  }
};
```

### Reset Password Component

```tsx
import { authService } from "@/services/auth.service";
import { useSearchParams } from "react-router-dom";

const [searchParams] = useSearchParams();
const token = searchParams.get("token");

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const response = await authService.resetPassword({
      token,
      password,
      confirm_password: confirm,
    });

    if (response.success) {
      toast.success("Password reset successfully");
      navigate("/");
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message);
  }
};
```

## Error Handling

All API calls use consistent error handling:

1. **Validation Errors** (422): Display field-specific errors
2. **Authentication Errors** (401): Redirect to login
3. **Not Found Errors** (404): Show appropriate message
4. **Network Errors**: Show generic network error message

Example error handling:

```typescript
try {
  const response = await authService.login(credentials);
} catch (error: any) {
  if (error.response?.status === 422) {
    // Validation errors
    const errors = error.response.data.errors;
    errors.forEach((err) => {
      toast.error(err.msg);
    });
  } else {
    // Generic error
    toast.error(error.response?.data?.message || "An error occurred");
  }
}
```

## Authentication Flow

### Registration Flow

1. User fills registration form (company, email, password)
2. Frontend validates input
3. `authService.register()` sends POST to `/api/register`
4. Backend validates and creates user
5. Backend sends verification email
6. User clicks verification link in email
7. User is verified and can log in

### Login Flow

1. User enters email and password
2. `authService.login()` sends POST to `/api/login`
3. Backend validates credentials
4. Backend returns JWT token and user data
5. Token is stored in localStorage
6. User is redirected to dashboard
7. All subsequent API calls include token in Authorization header

### Password Reset Flow

1. User requests password reset via email
2. `authService.forgotPassword()` sends POST to `/api/forgot-password`
3. Backend sends reset link to email
4. User clicks reset link (contains token in URL)
5. User enters new password
6. `authService.resetPassword()` sends POST to `/api/reset-password`
7. Backend validates token and updates password
8. User is redirected to login

## Environment Configuration

Make sure your `.env.development` file has the correct backend URL:

```bash
VITE_APP_BACKEND_URL=http://localhost:5111/api
# or production URL
# VITE_APP_BACKEND_URL=https://be.empatechos.ai/api
```

## Testing the Integration

### Test Registration

1. Navigate to `/signup`
2. Fill in company name, email, and password
3. Check email for verification link
4. Click verification link

### Test Login

1. Navigate to `/`
2. Enter email and password
3. Should redirect to `/dashboard` on success

### Test Forgot Password

1. Navigate to `/forgot-password`
2. Enter email
3. Check email for reset link
4. Click reset link and enter new password

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend has CORS enabled for frontend URL
2. **401 Errors**: Check if token is being sent correctly
3. **Network Errors**: Verify backend URL in `.env.development`
4. **Validation Errors**: Check password length (8-15 chars required)

### Debug Mode

Enable console logging in `api.ts` to debug requests:

```typescript
API.interceptors.request.use((config) => {
  console.log("Request:", config);
  return config;
});
```

## Security Considerations

1. **JWT Storage**: Tokens stored in localStorage (consider httpOnly cookies for production)
2. **Password Requirements**: 8-15 characters enforced
3. **Email Verification**: Required before login
4. **Token Expiration**: Handled by backend, 401 triggers logout
5. **HTTPS**: Use HTTPS in production for secure token transmission
