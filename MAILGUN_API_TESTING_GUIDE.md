# Mailgun API Testing Guide for Swagger

Complete step-by-step guide to test all Mailgun APIs in Swagger UI.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Integration APIs](#integration-apis)
3. [Email APIs](#email-apis)
4. [Testing Order](#recommended-testing-order)

---

## 🔐 Prerequisites

### Step 1: Access Swagger UI

1. Open your browser and navigate to:
   ```
   http://localhost:5111/api-docs
   ```
   (Or your backend URL + `/api-docs`)

### Step 2: Get Authentication Token

1. In Swagger UI, find the **Authentication** section
2. Look for `POST /api/auth/login` endpoint
3. Click on it and click **"Try it out"**
4. Use this request body:
   ```json
   {
     "email": "your-email@example.com",
     "password": "your-password"
   }
   ```
5. Click **"Execute"**
6. Copy the `token` from the response
7. Click the **"Authorize"** button at the top right
8. Enter: `Bearer {your-token}` (replace `{your-token}` with actual token)
9. Click **"Authorize"** and then **"Close"**

**Note:** For Mailgun configuration APIs, you need a user with `Company` role.

---

## 🔧 Integration APIs

### API 1: Validate Mailgun Configuration

**Endpoint:** `POST /api/integration/mailgun/validate`

**Purpose:** Validates Mailgun credentials before saving

**Request Body:**

```json
{
  "apiKey": "key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "domain": "mg.yourdomain.com",
  "apiUrl": "https://api.mailgun.net",
  "webhookSigningKey": "your-webhook-signing-key"
}
```

**Expected Success Response (200):**

```json
{
  "success": true,
  "message": "Mailgun configuration validated successfully",
  "data": {
    "domain": "mg.yourdomain.com",
    "apiUrl": "https://api.mailgun.net"
  }
}
```

**Possible Error Responses:**

- **400 Bad Request:**
  ```json
  {
    "success": false,
    "message": "Invalid API key. Please check your Mailgun API key."
  }
  ```
- **403 Forbidden:**
  ```json
  {
    "success": false,
    "message": "Access denied. Only Company role can configure Mailgun."
  }
  ```
- **401 Unauthorized:**
  ```json
  {
    "success": false,
    "message": "Unauthorized"
  }
  ```

**Testing Steps:**

1. Navigate to **Integrations** section in Swagger
2. Find `POST /integration/mailgun/validate`
3. Click **"Try it out"**
4. Paste the request body above (replace with your actual Mailgun credentials)
5. Click **"Execute"**
6. Verify the response

---

### API 2: Save Mailgun Configuration

**Endpoint:** `POST /api/integration/mailgun/save`

**Purpose:** Saves validated Mailgun configuration to database

**Request Body:**

```json
{
  "apiKey": "key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "domain": "mg.yourdomain.com",
  "apiUrl": "https://api.mailgun.net",
  "webhookSigningKey": "your-webhook-signing-key"
}
```

**Expected Success Response (200):**

```json
{
  "success": true,
  "message": "Mailgun configuration saved successfully",
  "data": {
    "integration": {
      "_id": "integration-id",
      "userId": "user-id",
      "providerName": "mailgun",
      "isConnected": true,
      "status": "active"
    }
  }
}
```

**Testing Steps:**

1. **IMPORTANT:** First validate your configuration using API 1
2. Navigate to `POST /integration/mailgun/save`
3. Click **"Try it out"**
4. Use the same credentials from validation
5. Click **"Execute"**
6. Verify the configuration is saved

---

## 📧 Email APIs

### API 3: Send Email

**Endpoint:** `POST /api/emails/send`

**Full URL:** `http://localhost:5111/api/emails/send`

**Purpose:** Send an email via Mailgun

**⚠️ Important:** Make sure you're using `/api/emails/send` NOT `/api/api/emails/send`

**Request Body (Basic):**

```json
{
  "to": ["recipient@example.com"],
  "subject": "Test Email from Swagger",
  "text": "This is a plain text email body.",
  "html": "<p>This is an <b>HTML</b> email body.</p>"
}
```

**Request Body (With CC/BCC):**

```json
{
  "to": ["recipient1@example.com", "recipient2@example.com"],
  "cc": ["cc@example.com"],
  "bcc": ["bcc@example.com"],
  "subject": "Test Email with CC and BCC",
  "text": "Email body text",
  "html": "<p>Email body HTML</p>"
}
```

**Request Body (Reply to Thread):**

```json
{
  "to": ["recipient@example.com"],
  "subject": "Re: Previous Email",
  "text": "This is a reply to a previous email thread.",
  "html": "<p>This is a reply to a previous email thread.</p>",
  "threadId": "thread-id-from-previous-email"
}
```

**Expected Success Response (200):**

```json
{
  "success": true,
  "message": "Email sent successfully",
  "data": {
    "_id": "email-id",
    "userId": "user-id",
    "mailgunMessageId": "<message-id@mailgun.com>",
    "from": {
      "email": "your-email@mg.yourdomain.com",
      "name": "Your Name"
    },
    "to": [
      {
        "email": "recipient@example.com",
        "name": null
      }
    ],
    "subject": "Test Email from Swagger",
    "body": {
      "text": "This is a plain text email body.",
      "html": "<p>This is an <b>HTML</b> email body.</p>"
    },
    "direction": "outbound",
    "status": "sent",
    "isRead": false,
    "isStarred": false,
    "isDeleted": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Possible Error Responses:**

- **400 Bad Request:**
  ```json
  {
    "success": false,
    "message": "At least one recipient is required"
  }
  ```
- **400 Bad Request:**
  ```json
  {
    "success": false,
    "message": "Email inbox not configured for this user. Please contact your administrator."
  }
  ```

**Testing Steps:**

1. Navigate to **Emails** section
2. Find `POST /emails/send`
3. Click **"Try it out"**
4. Paste one of the request bodies above
5. Click **"Execute"**
6. Save the `_id` from response for later tests
7. Check your email inbox (if using real email)

---

### API 4: Get Inbox Emails

**Endpoint:** `GET /api/emails/inbox`

**Purpose:** Retrieve inbox emails with pagination and filters

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `unread` (optional): Filter unread emails (true/false)
- `starred` (optional): Filter starred emails (true/false)

**Example Requests:**

**Get all emails (first page):**

```
GET /api/emails/inbox
```

**Get unread emails:**

```
GET /api/emails/inbox?unread=true
```

**Get starred emails:**

```
GET /api/emails/inbox?starred=true
```

**Get paginated results:**

```
GET /api/emails/inbox?page=1&limit=10
```

**Expected Success Response (200):**

```json
{
  "success": true,
  "data": {
    "emails": [
      {
        "_id": "email-id-1",
        "userId": "user-id",
        "from": {
          "email": "sender@example.com",
          "name": "Sender Name"
        },
        "to": [
          {
            "email": "your-email@mg.yourdomain.com",
            "name": "Your Name"
          }
        ],
        "subject": "Email Subject",
        "body": {
          "text": "Email body text",
          "html": "<p>Email body HTML</p>"
        },
        "direction": "inbound",
        "status": "delivered",
        "isRead": false,
        "isStarred": false,
        "createdAt": "2024-01-15T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 25,
      "pages": 1
    }
  }
}
```

**Testing Steps:**

1. Find `GET /emails/inbox`
2. Click **"Try it out"**
3. Optionally fill query parameters
4. Click **"Execute"**
5. Review the emails list and pagination info

---

### API 5: Get Email Threads

**Endpoint:** `GET /api/emails/threads`

**Purpose:** Get email conversation threads

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `unread` (optional): Filter threads with unread emails (true/false)
- `starred` (optional): Filter starred threads (true/false)

**Example Request:**

```
GET /api/emails/threads?page=1&limit=20&unread=true
```

**Expected Success Response (200):**

```json
{
  "success": true,
  "data": {
    "threads": [
      {
        "_id": "thread-id",
        "userId": "user-id",
        "subject": "Email Thread Subject",
        "participants": [
          {
            "email": "participant1@example.com",
            "name": "Participant 1"
          },
          {
            "email": "participant2@example.com",
            "name": "Participant 2"
          }
        ],
        "messageCount": 5,
        "unreadCount": 2,
        "lastMessageAt": "2024-01-15T10:30:00.000Z",
        "lastMessagePreview": "Preview of last message...",
        "lastMessageFrom": {
          "email": "sender@example.com",
          "name": "Sender"
        },
        "isStarred": false,
        "createdAt": "2024-01-15T09:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 10,
      "pages": 1
    }
  }
}
```

**Testing Steps:**

1. Find `GET /emails/threads`
2. Click **"Try it out"**
3. Add query parameters if needed
4. Click **"Execute"**
5. Save a `threadId` from response for next test

---

### API 6: Get Specific Thread

**Endpoint:** `GET /api/emails/threads/{threadId}`

**Purpose:** Get a specific thread with all its emails

**Path Parameter:**

- `threadId` (required): The thread ID from previous API

**Example Request:**

```
GET /api/emails/threads/507f1f77bcf86cd799439011
```

**Expected Success Response (200):**

```json
{
  "success": true,
  "data": {
    "thread": {
      "_id": "thread-id",
      "userId": "user-id",
      "subject": "Thread Subject",
      "participants": [...],
      "messageCount": 3,
      "unreadCount": 0,
      "lastMessageAt": "2024-01-15T10:30:00.000Z",
      "lastMessagePreview": "Last message preview...",
      "lastMessageFrom": {...}
    },
    "emails": [
      {
        "_id": "email-id-1",
        "subject": "Thread Subject",
        "from": {...},
        "to": [...],
        "body": {...},
        "direction": "inbound",
        "createdAt": "2024-01-15T09:00:00.000Z"
      },
      {
        "_id": "email-id-2",
        "subject": "Re: Thread Subject",
        "from": {...},
        "to": [...],
        "body": {...},
        "direction": "outbound",
        "createdAt": "2024-01-15T09:15:00.000Z"
      }
    ]
  }
}
```

**Note:** This endpoint automatically marks all emails in the thread as read.

**Testing Steps:**

1. Find `GET /emails/threads/{threadId}`
2. Click **"Try it out"**
3. Enter a `threadId` from API 5 response
4. Click **"Execute"**
5. Review the thread and all emails

---

### API 7: Get Specific Email

**Endpoint:** `GET /api/emails/{emailId}`

**Purpose:** Get a specific email by ID

**Path Parameter:**

- `emailId` (required): The email ID

**Example Request:**

```
GET /api/emails/507f1f77bcf86cd799439011
```

**Expected Success Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "email-id",
    "userId": "user-id",
    "mailgunMessageId": "<message-id@mailgun.com>",
    "from": {
      "email": "sender@example.com",
      "name": "Sender Name"
    },
    "to": [...],
    "cc": [...],
    "bcc": [...],
    "subject": "Email Subject",
    "body": {
      "text": "Email body text",
      "html": "<p>Email body HTML</p>"
    },
    "threadId": "thread-id",
    "direction": "inbound",
    "status": "delivered",
    "deliveryStatus": {
      "delivered": true,
      "deliveredAt": "2024-01-15T10:00:00.000Z",
      "opened": false,
      "clicked": false
    },
    "isRead": true,
    "isStarred": false,
    "sentiment": {
      "score": 0.5,
      "label": "positive",
      "analyzedAt": "2024-01-15T10:00:05.000Z"
    },
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Note:** This endpoint automatically marks the email as read.

**Testing Steps:**

1. Find `GET /emails/{emailId}`
2. Click **"Try it out"**
3. Enter an `emailId` from API 3 or API 4 response
4. Click **"Execute"**
5. Review the full email details

---

### API 8: Mark Email as Read/Unread

**Endpoint:** `PATCH /api/emails/{emailId}/read`

**Purpose:** Mark an email as read or unread

**Path Parameter:**

- `emailId` (required): The email ID

**Request Body:**

```json
{
  "isRead": true
}
```

**Or to mark as unread:**

```json
{
  "isRead": false
}
```

**Expected Success Response (200):**

```json
{
  "success": true,
  "message": "Email updated successfully",
  "data": {
    "_id": "email-id",
    "isRead": true,
    "updatedAt": "2024-01-15T10:35:00.000Z"
  }
}
```

**Testing Steps:**

1. Find `PATCH /emails/{emailId}/read`
2. Click **"Try it out"**
3. Enter an `emailId`
4. Paste request body with `isRead: true` or `false`
5. Click **"Execute"**
6. Verify the email status changed

---

### API 9: Star/Unstar Email

**Endpoint:** `PATCH /api/emails/{emailId}/star`

**Purpose:** Star or unstar an email

**Path Parameter:**

- `emailId` (required): The email ID

**Request Body:**

```json
{
  "isStarred": true
}
```

**Or to unstar:**

```json
{
  "isStarred": false
}
```

**Expected Success Response (200):**

```json
{
  "success": true,
  "message": "Email updated successfully",
  "data": {
    "_id": "email-id",
    "isStarred": true,
    "updatedAt": "2024-01-15T10:40:00.000Z"
  }
}
```

**Testing Steps:**

1. Find `PATCH /emails/{emailId}/star`
2. Click **"Try it out"**
3. Enter an `emailId`
4. Paste request body with `isStarred: true` or `false`
5. Click **"Execute"**
6. Verify the email starred status changed

---

### API 10: Delete Email

**Endpoint:** `DELETE /api/emails/{emailId}`

**Purpose:** Delete an email (soft delete)

**Path Parameter:**

- `emailId` (required): The email ID

**Example Request:**

```
DELETE /api/emails/507f1f77bcf86cd799439011
```

**Expected Success Response (200):**

```json
{
  "success": true,
  "message": "Email deleted successfully"
}
```

**Note:** This is a soft delete. The email is marked as deleted but not permanently removed.

**Testing Steps:**

1. Find `DELETE /emails/{emailId}`
2. Click **"Try it out"**
3. Enter an `emailId`
4. Click **"Execute"**
5. Verify deletion success
6. Try to get the email again - it should not appear in inbox

---

### API 11: Get Email Statistics

**Endpoint:** `GET /api/emails/stats`

**Purpose:** Get email statistics for the authenticated user

**Example Request:**

```
GET /api/emails/stats
```

**Expected Success Response (200):**

```json
{
  "success": true,
  "data": {
    "totalEmails": 150,
    "unreadEmails": 25,
    "sentEmails": 80,
    "receivedEmails": 70,
    "starredEmails": 10,
    "totalThreads": 45
  }
}
```

**Testing Steps:**

1. Find `GET /emails/stats`
2. Click **"Try it out"**
3. Click **"Execute"**
4. Review the statistics

---

## 📝 Recommended Testing Order

### Phase 1: Setup (Do First)

1. ✅ Authenticate and authorize in Swagger
2. ✅ Validate Mailgun Configuration (API 1)
3. ✅ Save Mailgun Configuration (API 2)

### Phase 2: Send & Receive

4. ✅ Send Email (API 3) - Send a test email
5. ✅ Get Inbox Emails (API 4) - Verify email received
6. ✅ Get Email Threads (API 5) - Check threads created

### Phase 3: Read & Manage

7. ✅ Get Specific Email (API 7) - View email details
8. ✅ Get Specific Thread (API 6) - View conversation
9. ✅ Mark Email as Read (API 8) - Test read status
10. ✅ Star Email (API 9) - Test starring

### Phase 4: Statistics & Cleanup

11. ✅ Get Email Statistics (API 11) - Check stats
12. ✅ Delete Email (API 10) - Test deletion

---

## 🐛 Troubleshooting

### Common Issues:

1. **404 Error - "Cannot POST /api/api/emails/send"**

   - **Problem:** Double `/api/api` in the URL
   - **Solution:**
     - ✅ Correct URL: `http://localhost:5111/api/emails/send`
     - ❌ Wrong URL: `http://localhost:5111/api/api/emails/send`
     - In Swagger UI, check the base URL is set to `http://localhost:5111/api`
     - The endpoint path should be `/emails/send` (Swagger will add `/api` automatically)
     - If testing manually, use the full URL: `http://localhost:5111/api/emails/send`

2. **401 Unauthorized**

   - Solution: Re-authenticate and update your Bearer token
   - Make sure you clicked "Authorize" and entered: `Bearer {your-token}`

3. **403 Forbidden (Mailgun Config APIs)**

   - Solution: Ensure your user has `Company` role

4. **400 Bad Request - "Email inbox not configured"**

   - Solution: Ensure Mailgun configuration is saved (API 2)
   - The user must have a `mailgunConfig` with `inboxEmail` set up

5. **400 Bad Request - "Invalid API key"**

   - Solution: Verify your Mailgun credentials are correct
   - Make sure you validated the configuration first (API 1)

6. **404 Not Found (Email/Thread)**
   - Solution: Use valid IDs from previous API responses
   - Make sure you're using MongoDB ObjectId format (24 character hex string)

---

## 📚 Additional Notes

- All email APIs require authentication (Bearer token)
- Mailgun configuration APIs require `Company` role
- Email IDs and Thread IDs are MongoDB ObjectIds
- Webhook endpoints (`/webhook/incoming` and `/webhook/events`) are called by Mailgun automatically and shouldn't be tested manually
- Sent emails will appear in your Mailgun dashboard
- Incoming emails are processed via webhooks (configure in Mailgun dashboard)

---

## ✅ Testing Checklist

- [ ] Authenticated in Swagger
- [ ] Validated Mailgun configuration
- [ ] Saved Mailgun configuration
- [ ] Sent a test email
- [ ] Retrieved inbox emails
- [ ] Retrieved email threads
- [ ] Viewed a specific thread
- [ ] Viewed a specific email
- [ ] Marked email as read/unread
- [ ] Starred/unstarred an email
- [ ] Retrieved email statistics
- [ ] Deleted an email

---

**Happy Testing! 🚀**
