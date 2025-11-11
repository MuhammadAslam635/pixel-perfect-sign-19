# Authentication Testing Guide

## Prerequisites

### 1. Backend Setup

Ensure your empatech backend is running:

```bash
cd c:\Users\Laptop Legion\Desktop\empatech\backend
npm start
```

Backend should be running on `http://localhost:5111`

### 2. Frontend Setup

Ensure your pixel-perfect-sign-19 frontend is configured:

```bash
cd c:\Users\Laptop Legion\pixel-perfect-sign-19
```

Check `.env.development` has:

```bash
VITE_APP_BACKEND_URL=http://localhost:5111/api
```

Start the frontend:

```bash
npm run dev
```

Frontend should be running on `http://localhost:8080`

## Test Scenarios

### Test 1: User Registration ✅

**Steps:**

1. Navigate to `http://localhost:8080/signup`
2. Fill in the registration form:
   - Company Name: "Test Company"
   - Industry: "Technology" (optional)
   - Email: "test@example.com"
   - Password: "password123" (min 8 characters)
   - Confirm Password: "password123"
3. Click "Register"

**Expected Result:**

- ✅ Success toast: "Verification email sent! Please check your inbox."
- ✅ Form clears
- ✅ Redirects to login page (/) after 2 seconds
- ✅ Check your email for verification link

**Verification:**

- Open browser DevTools → Network tab
- Check POST request to `/api/register`
- Response should be 200 with `success: true`

**Test Invalid Data:**

- Empty fields → "Please fill in all required fields"
- Passwords don't match → "Passwords do not match"
- Password < 8 chars → "Password must be at least 8 characters"
- Invalid email → Backend error message
- Existing email → Backend error: "Email already exists"

---

### Test 2: Email Verification ✅

**Steps:**

1. Check email inbox for verification email
2. Click the verification link in the email
3. Should see verification success message

**Expected Result:**

- ✅ Email verified successfully
- ✅ User can now log in

**Note:** If you don't receive email, check backend email configuration.

---

### Test 3: User Login ✅

**Steps:**

1. Navigate to `http://localhost:8080/`
2. Fill in login form:
   - Email: "test@example.com"
   - Password: "password123"
3. Click "Login"

**Expected Result:**

- ✅ Success toast: "Login successful!"
- ✅ Redirects to `/dashboard`
- ✅ User data stored in localStorage (key: "user")
- ✅ Redux state updated with user info

**Verification:**

- Open DevTools → Application → Local Storage
- Check for "user" key with token and user data
- Open DevTools → Redux DevTools
- Check auth state: `isAuthenticated: true`, user data populated

**Test Invalid Login:**

- Wrong password → "Invalid credentials" or backend error
- Non-existent email → "User not found"
- Unverified email → "Please verify your email"

---

### Test 4: Protected Route Access ✅

**Steps:**

1. Without logging in, try to access: `http://localhost:8080/dashboard`

**Expected Result:**

- ✅ Redirected to `/` (login page)

**Steps (After Login):**

1. Log in successfully
2. Try to access: `http://localhost:8080/dashboard`

**Expected Result:**

- ✅ Dashboard page loads successfully
- ✅ Not redirected

---

### Test 5: Persistent Login ✅

**Steps:**

1. Log in successfully
2. Refresh the page (F5)

**Expected Result:**

- ✅ User remains logged in
- ✅ Still on `/dashboard`
- ✅ Redux state persists from localStorage

**Steps (Clear Storage):**

1. Open DevTools → Application → Local Storage
2. Delete "user" key
3. Refresh page

**Expected Result:**

- ✅ User logged out
- ✅ Redirected to `/` (login page)

---

### Test 6: Forgot Password ✅

**Steps:**

1. Navigate to `http://localhost:8080/forgot-password`
2. Enter email: "test@example.com"
3. Click "Send Reset Link"

**Expected Result:**

- ✅ Success toast: "Reset link sent to your email"
- ✅ Email field clears
- ✅ Check email for password reset link

**Verification:**

- Check DevTools → Network
- POST to `/api/forgot-password` should return 200

**Test Invalid Email:**

- Non-existent email → "User not found"
- Empty email → "Please enter your email"

---

### Test 7: Reset Password ✅

**Steps:**

1. Click the password reset link in your email
   - URL format: `http://localhost:8080/reset-password?token=RESET_TOKEN`
2. Enter new password: "newpassword123"
3. Enter confirm password: "newpassword123"
4. Click "Reset Password"

**Expected Result:**

- ✅ Success toast: "Password reset successfully"
- ✅ Redirects to `/` (login page) after 1.5 seconds
- ✅ Can now log in with new password

**Verification:**

- Check DevTools → Network
- POST to `/api/reset-password` should return 200

**Test Invalid Reset:**

- Passwords don't match → "Passwords do not match"
- Password < 8 chars → "Password must be at least 8 characters"
- Invalid/expired token → "Invalid or expired token"
- No token in URL → "Invalid or missing reset token"

**Test New Password Login:**

1. Go to login page
2. Use new password "newpassword123"
3. Should log in successfully

---

### Test 8: Logout ✅

**Steps:**

1. Log in successfully
2. Click logout button (if available in UI)
   - OR manually dispatch logout action
   - OR navigate to a logout route

**Expected Result:**

- ✅ localStorage "user" key removed
- ✅ Redux auth state cleared
- ✅ Redirected to `/` (login page)
- ✅ Cannot access protected routes

**Manual Test:**
In browser console:

```javascript
localStorage.removeItem("user");
window.location.reload();
```

---

### Test 9: Automatic Logout on 401 ✅

**Steps:**

1. Log in successfully
2. Open DevTools → Application → Local Storage
3. Modify the "user" token to an invalid value
4. Try to access a protected API endpoint (if you have one)

**Expected Result:**

- ✅ Automatically logged out
- ✅ Redirected to `/` (login page)
- ✅ localStorage cleared

---

### Test 10: API Token Injection ✅

**Steps:**

1. Log in successfully
2. Open DevTools → Network tab
3. Trigger any API call (if you have protected API calls in your app)

**Expected Result:**

- ✅ Request headers include: `Authorization: Bearer [TOKEN]`
- ✅ Token matches the one in localStorage

**Manual Test:**
In browser console:

```javascript
const user = JSON.parse(localStorage.getItem("user"));
console.log("Token:", user.token);
```

---

## Network Debugging

### Check API Requests

Open DevTools → Network tab and filter by:

- `register` → POST /api/register
- `login` → POST /api/login
- `forgot-password` → POST /api/forgot-password
- `reset-password` → POST /api/reset-password

### Check Request Payload

Click on the request → Payload tab:

```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

### Check Response

Click on the request → Response tab:

```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "123",
    "email": "test@example.com",
    "company": "Test Company"
  }
}
```

---

## Common Issues & Solutions

### Issue 1: CORS Error

**Symptom:** Network error, CORS policy blocking request

**Solution:**

- Ensure backend has CORS enabled
- Check backend allows requests from `http://localhost:8080`

### Issue 2: Network Error

**Symptom:** "Network error. Please try again."

**Solution:**

- Verify backend is running on `http://localhost:5111`
- Check `.env.development` has correct URL
- Test backend directly: `curl http://localhost:5111/api/health`

### Issue 3: 401 Unauthorized

**Symptom:** Automatic logout, "Unauthorized" error

**Solution:**

- Token may be expired
- Log in again to get new token
- Check token in localStorage is valid

### Issue 4: Validation Errors

**Symptom:** "Password must be between 8 and 15 characters"

**Solution:**

- Ensure password is 8-15 characters
- Backend enforces this rule
- Frontend also validates minimum 8 characters

### Issue 5: Email Not Received

**Symptom:** No verification/reset email received

**Solution:**

- Check spam folder
- Verify backend email configuration
- Check backend logs for email sending errors
- Use a real email service (not localhost SMTP)

---

## Success Checklist

- [ ] Registration works and sends verification email
- [ ] Email verification link works
- [ ] Login works with verified account
- [ ] Login stores token in localStorage
- [ ] Protected routes redirect when not logged in
- [ ] Protected routes allow access when logged in
- [ ] Persistent login works after page refresh
- [ ] Forgot password sends reset email
- [ ] Reset password link works
- [ ] New password allows login
- [ ] Logout clears data and redirects
- [ ] Invalid credentials show error
- [ ] Validation errors display correctly
- [ ] Token automatically added to API requests
- [ ] 401 errors trigger automatic logout

---

## Browser Console Commands

### Check if logged in:

```javascript
const user = JSON.parse(localStorage.getItem("user"));
console.log("Logged in:", !!user);
console.log("User:", user);
```

### Check Redux state:

```javascript
// Requires Redux DevTools
// Check State → auth
```

### Manual logout:

```javascript
localStorage.removeItem("user");
window.location.href = "/";
```

### View token:

```javascript
const user = JSON.parse(localStorage.getItem("user"));
console.log("Token:", user?.token);
```

---

## Test Data

Use these for testing:

**Valid Registration:**

- Company: "Test Corp"
- Email: "user1@test.com"
- Password: "testpass123"

**Valid Registration 2:**

- Company: "Demo Inc"
- Email: "user2@test.com"
- Password: "demopass123"

**Invalid Data:**

- Short password: "test"
- Mismatched passwords: "pass123" vs "pass456"
- Invalid email: "notanemail"
- Empty fields

---

## Next Steps After Testing

1. ✅ All tests pass → Ready for production
2. ❌ Tests fail → Check console errors, network tab, backend logs
3. Fix issues and re-test
4. Update backend URL for production in `.env.production`
5. Deploy!

---

## Support

If you encounter issues:

1. Check browser console for errors
2. Check Network tab for failed requests
3. Check backend logs
4. Verify `.env.development` configuration
5. Ensure backend is running
6. Review `AUTH_INTEGRATION_COMPLETE.md` for detailed documentation
