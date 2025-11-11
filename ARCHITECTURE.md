# Authentication Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PIXEL-PERFECT-SIGN-19                         │
│                      (Frontend - React)                          │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                  Components Layer                       │    │
│  │  • SignUp.tsx     • SignIn.tsx                         │    │
│  │  • ForgotPassword • ResetPassword                      │    │
│  │  • ProtectedRoute                                      │    │
│  └────────────────┬────────────────────────────────────────┘   │
│                   │                                             │
│  ┌────────────────▼────────────────────────────────────────┐   │
│  │              Services Layer                             │   │
│  │  • auth.service.ts (API calls)                         │   │
│  │    - register()  - login()  - forgotPassword()         │   │
│  │    - resetPassword()  - logout()  - getMe()           │   │
│  └────────────────┬────────────────────────────────────────┘   │
│                   │                                             │
│  ┌────────────────▼────────────────────────────────────────┐   │
│  │                Utils Layer                              │   │
│  │  • api.ts (Axios instance with interceptors)           │   │
│  │  • authHelpers.ts (localStorage management)            │   │
│  └────────────────┬────────────────────────────────────────┘   │
│                   │                                             │
│  ┌────────────────▼────────────────────────────────────────┐   │
│  │              State Management                           │   │
│  │  • Redux Store (authSlice)                             │   │
│  │    - isAuthenticated  - user  - loading  - error       │   │
│  └─────────────────────────────────────────────────────────┘   │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    │ HTTP Requests (Axios)
                    │ Base URL: http://localhost:5111/api
                    │
┌───────────────────▼─────────────────────────────────────────────┐
│                      EMPATECH BACKEND                            │
│                     (Node.js + Express)                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Authentication Routes                        │  │
│  │  • POST   /api/register                                  │  │
│  │  • POST   /api/login                                     │  │
│  │  • POST   /api/forgot-password                           │  │
│  │  • POST   /api/reset-password                            │  │
│  │  • GET    /api/verify-email                              │  │
│  │  • GET    /api/me (protected)                            │  │
│  └──────────────┬───────────────────────────────────────────┘  │
│                 │                                               │
│  ┌──────────────▼───────────────────────────────────────────┐  │
│  │           Auth Controller & Services                     │  │
│  │  • Validation (Zod)                                      │  │
│  │  • JWT Token Generation                                  │  │
│  │  • Password Hashing (bcrypt)                             │  │
│  │  • Email Sending                                         │  │
│  └──────────────┬───────────────────────────────────────────┘  │
│                 │                                               │
│  ┌──────────────▼───────────────────────────────────────────┐  │
│  │                    Database                              │  │
│  │  • User Collection                                       │  │
│  │  • PasswordResetToken Collection                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

## Request/Response Flow

### 1. Registration Flow

```
User Input (SignUp.tsx)
         │
         ▼
   Form Validation
         │
         ▼
authService.register()
         │
         ▼
   axios.post('/api/register')
         │
         ▼
   Backend Validation (Zod)
         │
         ▼
   Create User in DB
         │
         ▼
   Send Verification Email
         │
         ▼
   Response: { success, message }
         │
         ▼
   Show Toast & Redirect
```

### 2. Login Flow

```
User Input (SignIn.tsx)
         │
         ▼
dispatch(loginStart())
         │
         ▼
authService.login()
         │
         ▼
   axios.post('/api/login')
         │
         ▼
   Backend: Verify Credentials
         │
         ▼
   Generate JWT Token
         │
         ▼
   Response: { success, token, user }
         │
         ▼
   Store in localStorage
         │
         ▼
dispatch(loginSuccess(user))
         │
         ▼
   Redirect to Dashboard
```

### 3. Protected API Call Flow

```
Component makes API call
         │
         ▼
   Axios Request Interceptor
         │
         ▼
   Get token from localStorage
         │
         ▼
   Add: Authorization: Bearer TOKEN
         │
         ▼
   Send Request to Backend
         │
         ▼
   Backend: Verify JWT
         │
         ├─── Valid ────▶ Process Request
         │
         └─── Invalid ──▶ 401 Response
                              │
                              ▼
                    Response Interceptor
                              │
                              ▼
                    clearAuthData()
                              │
                              ▼
                    Redirect to Login
```

### 4. Password Reset Flow

```
User enters email (ForgotPassword)
         │
         ▼
authService.forgotPassword()
         │
         ▼
   Backend: Find User
         │
         ▼
   Generate Reset Token
         │
         ▼
   Send Email with Link
         │
         ▼
User clicks link with token
         │
         ▼
Opens ResetPassword page
         │
         ▼
User enters new password
         │
         ▼
authService.resetPassword(token, password)
         │
         ▼
   Backend: Verify Token
         │
         ▼
   Update User Password
         │
         ▼
   Mark Token as Used
         │
         ▼
   Response: { success }
         │
         ▼
   Redirect to Login
```

## Data Flow Diagram

```
┌──────────────┐
│   Browser    │
│ (React App)  │
└──────┬───────┘
       │
       │ 1. User Action (e.g., login)
       │
       ▼
┌──────────────┐
│  Component   │
│ (SignIn.tsx) │
└──────┬───────┘
       │
       │ 2. dispatch(loginStart())
       │
       ▼
┌──────────────┐      ┌─────────────────┐
│ Redux Store  │◄─────┤ authSlice.ts    │
│  (Global)    │      │ loading = true  │
└──────────────┘      └─────────────────┘
       │
       │ 3. authService.login(data)
       │
       ▼
┌──────────────┐
│   API.ts     │
│  (Axios)     │
└──────┬───────┘
       │
       │ 4. Add Authorization header
       │    POST /api/login
       │
       ▼
┌──────────────┐
│   Backend    │
│    (API)     │
└──────┬───────┘
       │
       │ 5. Response { token, user }
       │
       ▼
┌──────────────┐
│  authHelpers │
│   .setAuth   │
└──────┬───────┘
       │
       │ 6. Store in localStorage
       │
       ▼
┌──────────────┐
│ localStorage │
│ key: "user"  │
└──────────────┘
       │
       │ 7. dispatch(loginSuccess(user))
       │
       ▼
┌──────────────┐      ┌─────────────────────┐
│ Redux Store  │◄─────┤ authSlice.ts        │
│  (Updated)   │      │ isAuthenticated=true│
└──────────────┘      │ user = {...}        │
       │              └─────────────────────┘
       │
       │ 8. navigate('/dashboard')
       │
       ▼
┌──────────────┐
│  Dashboard   │
│    Page      │
└──────────────┘
```

## File Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│                      File Dependencies                       │
└─────────────────────────────────────────────────────────────┘

SignUp.tsx
  ├── imports: auth.service.ts
  ├── imports: sonner (toast)
  └── imports: react-router-dom (navigate)

SignIn.tsx
  ├── imports: auth.service.ts
  ├── imports: authSlice.ts (Redux actions)
  ├── imports: store.ts (RootState)
  └── imports: sonner (toast)

ForgotPassword.tsx
  ├── imports: auth.service.ts
  └── imports: sonner (toast)

ResetPassword.tsx
  ├── imports: auth.service.ts
  ├── imports: react-router-dom (useSearchParams)
  └── imports: sonner (toast)

ProtectedRoute.tsx
  ├── imports: authSlice (Redux state)
  ├── imports: authHelpers (isAuthenticated)
  └── imports: react-router-dom (Navigate)

auth.service.ts
  ├── imports: api.ts (Axios instance)
  └── imports: authHelpers.ts (setAuthToken, clearAuthData)

api.ts
  ├── imports: axios
  └── imports: authHelpers.ts (getUserData, clearAuthData)

authSlice.ts
  ├── imports: @reduxjs/toolkit
  └── imports: authHelpers.ts (getUserData, clearAuthData)
```

## State Management Flow

```
┌─────────────────────────────────────────────────────────┐
│                  Redux Auth State                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  initialState (from localStorage)                       │
│  ┌────────────────────────────────────────┐            │
│  │ isAuthenticated: boolean               │            │
│  │ user: User | null                       │            │
│  │ loading: boolean                        │            │
│  │ error: string | null                    │            │
│  └────────────────────────────────────────┘            │
│                                                          │
│  Actions:                                               │
│  ┌────────────────────────────────────────┐            │
│  │ loginStart()                            │            │
│  │   → loading = true                      │            │
│  │                                          │            │
│  │ loginSuccess(user)                      │            │
│  │   → isAuthenticated = true              │            │
│  │   → user = payload                      │            │
│  │   → loading = false                     │            │
│  │                                          │            │
│  │ loginFailure(error)                     │            │
│  │   → error = payload                     │            │
│  │   → loading = false                     │            │
│  │                                          │            │
│  │ logout()                                 │            │
│  │   → isAuthenticated = false             │            │
│  │   → user = null                         │            │
│  │   → clearAuthData()                     │            │
│  │                                          │            │
│  │ updateUser(partial)                     │            │
│  │   → user = { ...user, ...partial }      │            │
│  └────────────────────────────────────────┘            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Error Handling Strategy

```
┌─────────────────────────────────────────────────────────┐
│                    Error Handling                        │
└─────────────────────────────────────────────────────────┘

API Call (try-catch)
         │
         ├─ Success
         │    └─▶ Process response
         │         └─▶ Show success toast
         │              └─▶ Update state/redirect
         │
         └─ Error
              │
              ├─ 422 (Validation Error)
              │    └─▶ Extract field errors
              │         └─▶ Show specific error toast
              │
              ├─ 401 (Unauthorized)
              │    └─▶ Axios interceptor catches
              │         └─▶ clearAuthData()
              │              └─▶ Redirect to login
              │
              ├─ 404 (Not Found)
              │    └─▶ Show "User not found" toast
              │
              ├─ 500 (Server Error)
              │    └─▶ Show "Server error" toast
              │
              └─ Network Error
                   └─▶ Show "Network error" toast
```

## Security Layers

```
┌─────────────────────────────────────────────────────────┐
│                   Security Measures                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Frontend:                                              │
│  • Client-side validation                               │
│  • Password strength requirements                       │
│  • Protected routes (ProtectedRoute.tsx)               │
│  • Token stored in localStorage                         │
│  • Auto logout on 401                                   │
│                                                          │
│  Network:                                               │
│  • JWT tokens in Authorization header                   │
│  • Axios interceptors for token injection              │
│  • HTTPS in production (recommended)                    │
│                                                          │
│  Backend:                                               │
│  • Server-side validation (Zod)                         │
│  • Password hashing (bcrypt)                            │
│  • JWT token verification                               │
│  • Email verification required                          │
│  • Password reset tokens with expiration               │
│  • Rate limiting (recommended)                          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

This architecture provides a secure, scalable, and maintainable authentication system!
