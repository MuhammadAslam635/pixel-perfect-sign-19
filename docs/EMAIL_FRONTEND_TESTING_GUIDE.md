# Email Frontend Testing Guide

Complete guide to test the Mailgun email integration in the frontend application.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Accessing Email Pages](#accessing-email-pages)
3. [Testing Flow](#testing-flow)
4. [Feature Testing Checklist](#feature-testing-checklist)
5. [Troubleshooting](#troubleshooting)

---

## 🔐 Prerequisites

### Step 1: Backend Setup

1. **Ensure Backend is Running**
   - Backend should be running on `http://localhost:3000` (or your configured port)
   - Verify backend is accessible and API endpoints are working

2. **Mailgun Configuration**
   - User must have Mailgun configured (via backend API or admin setup)
   - For development mode, Mailgun inbox is auto-created for CompanyUser/CompanyAdmin roles
   - Check backend logs to verify Mailgun configuration

3. **Authentication**
   - User must be logged in to access email pages
   - Token should be stored in localStorage (handled automatically by the app)

### Step 2: Frontend Setup

1. **Start Frontend Application**
   ```bash
   npm run dev
   ```
   - Frontend should be running on `http://localhost:5173` (or your configured port)

2. **Verify Environment Variables**
   - Check that `VITE_APP_BACKEND_URL` is set correctly in `.env`
   - Default: `http://localhost:3000/api`

---

## 🚀 Accessing Email Pages

### Navigation Method 1: Header Navigation

1. **Login to the application**
2. **Look for "Emails" icon** in the top navigation header (Mail icon)
3. **Click on "Emails"** - This will take you to `/emails/inbox`

### Navigation Method 2: Direct URL

You can directly navigate to these URLs:

- **Inbox:** `http://localhost:5173/emails/inbox`
- **Threads:** `http://localhost:5173/emails/threads`
- **Compose:** `http://localhost:5173/emails/compose`
- **Stats:** `http://localhost:5173/emails/stats`

---

## 🧪 Testing Flow

### Flow 1: View Inbox and Read Emails

**Step 1: Access Inbox**
1. Click "Emails" in navigation header
2. You should see the Inbox page with:
   - Email list (if emails exist)
   - Filter sidebar (All, Unread, Starred)
   - Search bar
   - Statistics sidebar
   - "Compose" button

**Step 2: Filter Emails**
1. Click "Unread" filter - should show only unread emails
2. Click "Starred" filter - should show only starred emails
3. Click "All Emails" - should show all emails

**Step 3: Search Emails**
1. Type in the search bar (e.g., search by sender email or subject)
2. Results should filter in real-time

**Step 4: View Email Details**
1. Click on any email from the list
2. Should navigate to `/emails/{emailId}`
3. Email viewer should show:
   - Full email content (HTML or text)
   - From, To, CC, BCC fields
   - Date and status badges
   - Action buttons (Star, Mark Read, Delete, Reply)

**Step 5: Email Actions**
1. **Star/Unstar:** Click star icon - email should be starred/unstarred
2. **Mark as Read:** Click mail icon - email should be marked as read
3. **Delete:** Click trash icon - email should be deleted and return to inbox

---

### Flow 2: Compose and Send Email

**Step 1: Open Compose**
1. Click "Compose" button (top right) from Inbox page
2. OR navigate to `/emails/compose`
3. Should see email composer form

**Step 2: Fill Email Form**
1. **To Field:**
   - Type recipient email address
   - Press Enter or comma to add
   - Can add multiple recipients
   - Click X on badge to remove recipient

2. **CC/BCC (Optional):**
   - Click "CC" button to add CC field
   - Click "BCC" button to add BCC field
   - Add recipients same way as To field

3. **Subject:**
   - Enter email subject (required)

4. **Message:**
   - Type email body in textarea
   - Supports multi-line text

**Step 3: Send Email**
1. Click "Send" button
2. Should see loading state ("Sending...")
3. On success:
   - Toast notification: "Email sent"
   - Redirects to inbox
   - Email should appear in sent emails

**Step 4: Verify Sent Email**
1. Go back to inbox
2. Look for the sent email (should show "Sent" badge)
3. Click to view full email details

---

### Flow 3: Reply to Email

**Step 1: Open Email**
1. Go to inbox
2. Click on any received email

**Step 2: Reply**
1. Click "Reply" button at bottom of email viewer
2. Should navigate to compose page with:
   - "To" field pre-filled with sender's email
   - Subject prefixed with "Re: "
   - Thread ID set (if replying to thread)

**Step 3: Compose Reply**
1. Type your reply message
2. Click "Send"
3. Email should be sent and thread should be updated

---

### Flow 4: View Email Threads

**Step 1: Access Threads**
1. Click "Emails" in navigation
2. Navigate to "Threads" tab OR go to `/emails/threads`
3. Should see list of email threads/conversations

**Step 2: View Thread Details**
1. Click on any thread
2. Should navigate to `/emails/threads/{threadId}`
3. Thread view should show:
   - Left sidebar: List of all emails in thread
   - Right panel: Selected email viewer
   - Reply composer (when replying)

**Step 3: Navigate Thread**
1. Click different emails in left sidebar
2. Right panel should update to show selected email
3. Can reply from thread view

**Step 4: Filter Threads**
1. Use "Unread" filter to see threads with unread messages
2. Use "Starred" filter to see starred threads
3. Use search to find specific threads

---

### Flow 5: View Email Statistics

**Step 1: Access Stats**
1. Navigate to `/emails/stats`
2. OR click on statistics card in inbox sidebar

**Step 2: Review Statistics**
Should see:
- **Total Emails:** Total count of all emails
- **Unread Emails:** Count of unread emails
- **Sent Emails:** Count of sent emails
- **Received Emails:** Count of received emails
- **Starred Emails:** Count of starred emails
- **Total Threads:** Count of email threads

**Step 3: Review Charts**
- **Email Read Rate:** Progress bar showing read percentage
- **Email Activity:** Sent vs Received comparison

---

## ✅ Feature Testing Checklist

### Inbox Page (`/emails/inbox`)
- [ ] Page loads without errors
- [ ] Email list displays correctly
- [ ] Filter buttons work (All/Unread/Starred)
- [ ] Search functionality works
- [ ] Pagination works (if more than 20 emails)
- [ ] Statistics sidebar displays correct counts
- [ ] Compose button navigates to compose page
- [ ] Clicking email opens email detail page
- [ ] Loading states display correctly
- [ ] Empty state displays when no emails

### Compose Page (`/emails/compose`)
- [ ] Form loads correctly
- [ ] Can add multiple "To" recipients
- [ ] Can add CC recipients
- [ ] Can add BCC recipients
- [ ] Can remove recipients
- [ ] Subject field is required
- [ ] Message textarea works
- [ ] Send button validates required fields
- [ ] Email sends successfully
- [ ] Success toast appears
- [ ] Redirects to inbox after send
- [ ] Error handling works (network errors, validation)

### Email Detail Page (`/emails/:emailId`)
- [ ] Email content displays correctly
- [ ] HTML emails render properly
- [ ] Text emails display correctly
- [ ] From/To/CC/BCC fields show correctly
- [ ] Date and status badges display
- [ ] Star button toggles correctly
- [ ] Mark as read button works
- [ ] Delete button works
- [ ] Reply button navigates to compose with pre-filled data
- [ ] Back button returns to inbox

### Threads Page (`/emails/threads`)
- [ ] Thread list displays correctly
- [ ] Filters work (All/Unread/Starred)
- [ ] Search works
- [ ] Clicking thread opens thread detail
- [ ] Unread count badges display correctly
- [ ] Pagination works

### Thread Detail Page (`/emails/threads/:threadId`)
- [ ] Thread loads correctly
- [ ] Email list in sidebar displays all emails
- [ ] Clicking email in sidebar updates viewer
- [ ] Email viewer displays selected email
- [ ] Can reply from thread view
- [ ] Composer shows/hides correctly
- [ ] Reply sends successfully
- [ ] Thread updates after reply

### Stats Page (`/emails/stats`)
- [ ] All statistics display correctly
- [ ] Numbers match actual email counts
- [ ] Charts render correctly
- [ ] Read rate calculation is accurate
- [ ] Activity comparison shows correctly

### Navigation
- [ ] "Emails" icon appears in header navigation
- [ ] Clicking "Emails" navigates to inbox
- [ ] Navigation highlights correctly when on email pages
- [ ] All email routes are accessible

---

## 🔧 Troubleshooting

### Issue: "Email inbox not configured"
**Solution:**
- Check backend logs for Mailgun configuration
- Ensure user has Mailgun config set up
- In dev mode, ensure `MAILGUN_DEV_MODE=true` and user is CompanyUser/CompanyAdmin

### Issue: Emails not loading
**Solution:**
- Check browser console for errors
- Verify backend API is accessible
- Check network tab for API calls
- Verify authentication token is valid

### Issue: Can't send emails
**Solution:**
- Check backend Mailgun configuration
- Verify Mailgun API key is valid
- Check backend logs for Mailgun errors
- Ensure recipient email is valid

### Issue: Navigation not showing "Emails"
**Solution:**
- Refresh the page
- Check if Navigation.tsx was updated correctly
- Verify user is logged in
- Check browser console for errors

### Issue: Email content not displaying
**Solution:**
- Check if email has HTML or text content
- Verify email body structure in network response
- Check browser console for rendering errors

### Issue: Threads not grouping correctly
**Solution:**
- Verify backend is creating threadId correctly
- Check email references and inReplyTo fields
- Ensure emails have proper threading headers

---

## 📝 Testing Scenarios

### Scenario 1: New User First Email
1. Login as new user
2. Navigate to Emails
3. Should see empty inbox
4. Compose first email
5. Send email
6. Verify email appears in sent folder

### Scenario 2: Receive and Reply
1. Send email to your Mailgun inbox
2. Wait for webhook to process (or refresh)
3. Email should appear in inbox
4. Open email
5. Click Reply
6. Send reply
7. Verify thread is created/updated

### Scenario 3: Email Management
1. Receive multiple emails
2. Star some emails
3. Mark some as read
4. Delete some emails
5. Verify filters work correctly
6. Verify statistics update

### Scenario 4: Search and Filter
1. Have multiple emails in inbox
2. Use search to find specific email
3. Use filters (Unread/Starred)
4. Combine search and filters
5. Verify results are correct

---

## 🎯 Quick Test Commands

### Using Browser Console

```javascript
// Check if email service is accessible
import { emailService } from '@/services/email.service';
emailService.getEmailStats().then(console.log);

// Check authentication
localStorage.getItem('userData');

// Check API base URL
import.meta.env.VITE_APP_BACKEND_URL;
```

### Using Network Tab
1. Open browser DevTools (F12)
2. Go to Network tab
3. Filter by "emails"
4. Perform actions and verify API calls
5. Check request/response data

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Check network tab for failed API calls
3. Check backend logs
4. Verify Mailgun configuration
5. Ensure all environment variables are set

---

**Last Updated:** $(date)
**Version:** 1.0.0

