# Mailgun Inbox Setup Guide

## Problem: "Email inbox not configured for this user"

This error occurs when a user account doesn't have a Mailgun inbox configured. Here are the solutions:

---

## ✅ Solution 1: Enable Dev Mode (Quickest for Testing)

### Step 1: Update Backend `.env` File

Add or update these environment variables in your backend `.env` file:

```env
MAILGUN_DEV_MODE=true
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_API_KEY=your-api-key-here
```

**Note:** In dev mode, the system will auto-create inbox configurations without actually creating Mailgun routes.

### Step 2: Restart Backend Server

Restart your backend server to load the new environment variables.

### Step 3: Try Sending Email Again

When you try to send an email, the system will automatically create the inbox config if:

- Your user role is `CompanyUser` or `CompanyAdmin`
- `MAILGUN_DEV_MODE=true` is set

---

## ✅ Solution 2: Update User Record Manually (Database)

If you have database access, you can manually add the `mailgunConfig` to your user:

### Using MongoDB Compass or MongoDB Shell:

```javascript
// Find your user
db.users.updateOne(
  { email: "your-email@example.com" },
  {
    $set: {
      mailgunConfig: {
        routeId: "dev_route_" + Date.now(),
        inboxEmail: "your-username@mg.yourdomain.com",
        setupAt: new Date(),
        isActive: true,
      },
      mailgunEmail: "your-username@mg.yourdomain.com",
    },
  }
);
```

**Replace:**

- `your-email@example.com` - Your actual user email
- `your-username` - Username part of your email (before @)
- `mg.yourdomain.com` - Your Mailgun domain

---

## ✅ Solution 3: Create a New User (Auto-Setup)

When creating a new user with `CompanyUser` or `CompanyAdmin` role, the inbox is automatically configured if:

- Mailgun environment variables are set (`MAILGUN_DOMAIN`, `MAILGUN_API_KEY`)
- User role is `CompanyUser` or `CompanyAdmin`

### Steps:

1. Use the user creation API: `POST /api/users`
2. Set role to `CompanyUser` or `CompanyAdmin`
3. The system will automatically create the Mailgun inbox

---

## ✅ Solution 4: Update Existing User via API

You can update an existing user to add Mailgun configuration:

### Endpoint: `PATCH /api/users/{userId}`

**Request Body:**

```json
{
  "mailgunEmail": "username@mg.yourdomain.com"
}
```

**Note:** This will trigger inbox setup if the user role is `CompanyUser` or `CompanyAdmin`.

---

## 🔍 Check Current User Configuration

### Check Your User Role

1. Login via Swagger: `POST /api/auth/login`
2. Check the response - look for `role` field
3. It should be `CompanyUser` or `CompanyAdmin` for auto-setup to work

### Check Environment Variables

Make sure these are set in your backend `.env`:

```env
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_API_KEY=key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MAILGUN_API_URL=https://api.mailgun.net
MAILGUN_WEBHOOK_SIGNING_KEY=your-signing-key
MAILGUN_DEV_MODE=true  # For testing/development
BACKEND_URL=http://localhost:5111  # Required if not in dev mode
```

---

## 📋 Quick Checklist

- [ ] Backend `.env` has `MAILGUN_DOMAIN` set
- [ ] Backend `.env` has `MAILGUN_API_KEY` set
- [ ] Backend `.env` has `MAILGUN_DEV_MODE=true` (for testing)
- [ ] User role is `CompanyUser` or `CompanyAdmin`
- [ ] Backend server restarted after `.env` changes
- [ ] Try sending email again

---

## 🐛 Troubleshooting

### Issue: Still getting "Email inbox not configured"

**Check:**

1. Is `MAILGUN_DEV_MODE=true` in `.env`?
2. Did you restart the backend server?
3. Is your user role `CompanyUser` or `CompanyAdmin`?
4. Check backend logs for any Mailgun setup errors

### Issue: User role is not CompanyUser/CompanyAdmin

**Solution:**

- Update user role via admin API or database
- Or use Solution 2 to manually add `mailgunConfig`

### Issue: Environment variables not loading

**Solution:**

- Make sure `.env` file is in the backend root directory
- Restart backend server
- Check backend logs for environment variable loading

---

## 💡 Recommended Approach for Testing

**For quick testing, use Solution 1 (Dev Mode):**

1. Add to `.env`:

   ```env
   MAILGUN_DEV_MODE=true
   MAILGUN_DOMAIN=mg.yourdomain.com
   MAILGUN_API_KEY=your-api-key
   ```

2. Restart backend

3. Try sending email - inbox will auto-create

4. Once working, you can disable dev mode and use production setup

---

**After setting up, try sending an email again!** 🚀
