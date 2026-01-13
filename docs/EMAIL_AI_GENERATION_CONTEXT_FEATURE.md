# Email AI Generation with Lead Context Feature

## Overview

This feature enhances the email composer's "Generate with AI" button to automatically detect if the recipient email belongs to a known lead. When a lead is detected, the system generates a personalized email based on the lead's profile, company information, and communication history.

## How It Works

### User Flow

1. User composes a new email and enters a recipient email address
2. User clicks the "Generate with AI" button
3. System sends the recipient email to the backend
4. **Backend automatically checks if the email belongs to a lead:**
   - If lead is found: Generates personalized email with lead's profile, company info, and history
   - If not found: Enhances any existing content or creates general professional email
5. Frontend receives enhanced/generated content and displays it

### Features

- ✅ Automatic lead detection by email address (backend-side)
- ✅ Context-aware email generation for known leads
- ✅ Uses existing lead profile, company data, and communication history
- ✅ Auto-fills subject line if empty (for leads)
- ✅ Auto-fills email body with personalized content
- ✅ Graceful fallback for non-lead recipients
- ✅ User feedback via toast notifications
- ✅ Works even without existing content when recipient is a lead

## Technical Implementation

### Backend Changes

#### 1. Enhanced Email Content Endpoint

**File:** `backend/controller/connectionMessageController.js`

Updated `enhanceEmailContent` function to:

- Accept optional `recipientEmail` parameter
- Search for lead by email address within user's companies
- If lead found:
  - Fetch lead's company information
  - Fetch brand knowledge
  - Generate personalized email with context using GPT-4
  - Return enhanced content with subject line and recipient info
- If lead not found:
  - Fall back to basic content enhancement
  - Improve existing content structure and clarity

**Key Features:**

- Searches only within user's owned companies for security
- Populates company details for rich context
- Uses buildContext helper for consistent formatting
- Returns structured JSON with subject, body, and HTML
- Includes recipient info to inform frontend of lead status

#### 2. API Endpoint

```
POST /api/connection-messages/enhance-content
```

**Request Body:**

```json
{
  "content": "optional draft content",
  "tone": "professional",
  "recipientEmail": "john@example.com"
}
```

**Response (Lead Found):**

```json
{
  "success": true,
  "message": "Personalized email generated successfully for lead",
  "data": {
    "originalContent": "",
    "enhancedContent": "Plain text body...",
    "enhancedContentHtml": "<p>HTML body...</p>",
    "subject": "Personalized subject line",
    "tone": "professional",
    "characterCount": 450,
    "wordCount": 85,
    "recipientInfo": {
      "name": "John Doe",
      "email": "john@example.com",
      "position": "CEO",
      "company": "Example Corp",
      "isLead": true
    }
  }
}
```

**Response (Lead Not Found):**

```json
{
  "success": true,
  "message": "Email content enhanced successfully",
  "data": {
    "originalContent": "draft content",
    "enhancedContent": "Enhanced version...",
    "tone": "professional",
    "characterCount": 320,
    "wordCount": 62
  }
}
```

### Frontend Changes

#### 1. Connection Messages Service

**File:** `src/services/connectionMessages.service.ts`

Updated `EnhanceEmailContentInput` interface:

```typescript
export interface EnhanceEmailContentInput {
  content: string;
  tone?: EmailTone;
  context?: string;
  recipientEmail?: string; // NEW: triggers lead detection
}
```

Updated `EnhanceEmailContentData` interface:

```typescript
export interface EnhanceEmailContentData {
  originalContent: string;
  enhancedContent: string;
  enhancedContentHtml?: string; // NEW: HTML version
  subject?: string; // NEW: for personalized emails
  tone: string;
  characterCount: number;
  wordCount: number;
  recipientInfo?: {
    // NEW: lead information
    name: string;
    email: string;
    position?: string;
    company?: string;
    isLead: boolean;
  };
}
```

#### 2. Email Composer Component

**File:** `src/components/email/EmailComposer.tsx`

Simplified `handleEnhanceWithAI` function:

1. Validates recipient email exists
2. Extracts plain text from HTML editor
3. Calls `enhanceEmailContent` with:
   - content (can be empty)
   - tone: "professional"
   - recipientEmail
4. Backend handles lead detection automatically
5. Updates UI based on response:
   - Sets subject if provided and current is empty
   - Sets body with HTML or formatted text
   - Shows appropriate toast message based on `isLead` flag

**Benefits of Backend Approach:**

- Single API call instead of two
- Centralized lead detection logic
- Consistent security checks
- Simpler frontend code
- Better error handling

## User Experience Improvements

### Toast Notifications

- **Lead found & email generated:** "Personalized email generated for [Name] based on their profile and history."
- **Content enhanced:** "Your message has been improved with AI assistance."
- **No recipient:** "Please add a recipient email address first."
- **Enhancement failed:** "Unable to enhance your content. Please try again."

### Button States

- **Enabled:** When recipient email is added
- **Disabled:** When no recipient email is added (shows tooltip: "Add a recipient email first")
- **Loading:** Shows "Generating..." during AI generation

## Security & Permissions

- Requires authentication (Bearer token)
- Only searches leads within companies owned by the authenticated user
- Email addresses are case-insensitive matched
- Secure company context resolution

## Benefits

1. **Seamless Integration:** Backend handles all lead detection automatically
2. **Single API Call:** Reduced latency and simpler frontend code
3. **Personalization:** Emails tailored to specific lead with relevant context
4. **Efficiency:** Saves time by auto-generating content based on lead data
5. **Context-Aware:** Uses communication history for appropriate messages
6. **Smart Detection:** Automatically determines if recipient is a known lead
7. **Graceful Fallback:** Handles unknown recipients transparently
8. **Consistent Security:** Centralized authorization and filtering

## Implementation Advantages

### Backend-Side Lead Detection:

- ✅ Single API call instead of two separate requests
- ✅ Reduced network overhead
- ✅ Centralized business logic
- ✅ Consistent security enforcement
- ✅ Better error handling and logging
- ✅ Easier to maintain and test
- ✅ Can leverage database optimizations

### User Experience:

- ✅ Faster response (fewer round trips)
- ✅ Works with or without existing content
- ✅ Clear feedback about lead status
- ✅ Automatic subject line generation for leads
- ✅ Transparent operation

## Future Enhancements

Potential improvements:

- Support for multiple recipients (check all and prioritize)
- Display lead information badge in UI when detected
- Include recent communication timeline in generated email
- Support for different email types based on lead stage
- Remember user preferences for tone and length
- A/B testing for email variations
- Email template library for different scenarios
