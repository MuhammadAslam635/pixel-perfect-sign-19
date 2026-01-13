# Follow-up Templates API Integration Guide

## Overview

This document describes the complete integration of the follow-up templates and plans APIs from the empatech backend into the pixel-perfect-sign-19 frontend.

## Backend API Endpoints

### Follow-up Templates

#### Base URL: `/api/followup/templates`

| Method | Endpoint         | Description                            | Auth Required |
| ------ | ---------------- | -------------------------------------- | ------------- |
| GET    | `/`              | Get all followup templates (paginated) | Yes           |
| GET    | `/:id`           | Get single template by ID              | Yes           |
| POST   | `/`              | Create new template                    | Yes           |
| PUT    | `/:id`           | Update existing template               | Yes           |
| DELETE | `/:id`           | Delete template                        | Yes           |
| POST   | `/:id/duplicate` | Duplicate template                     | Yes           |

#### Template Schema

```typescript
{
  _id: string;
  userId: string;
  companyId?: string;
  title: string;
  numberOfDaysToRun: string;
  numberOfEmails: string;
  numberOfCalls: string;
  numberOfWhatsappMessages: string;
  timeOfDayToRun: string; // HH:MM format (24-hour)
  createdAt: string;
  updatedAt: string;
}
```

#### Query Parameters (GET all templates)

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search by title (optional)

### Follow-up Plans

#### Base URL: `/api/followup/plans`

| Method | Endpoint        | Description                        | Auth Required |
| ------ | --------------- | ---------------------------------- | ------------- |
| GET    | `/`             | Get all followup plans (paginated) | Yes           |
| GET    | `/stats`        | Get aggregate statistics           | Yes           |
| GET    | `/:id`          | Get single plan by ID              | Yes           |
| GET    | `/:id/schedule` | Get detailed plan schedule         | Yes           |
| POST   | `/`             | Create new plan                    | Yes           |
| DELETE | `/:id`          | Delete active plan                 | Yes           |

#### Plan Schema

```typescript
{
  _id: string;
  templateId: string | FollowupTemplateRef;
  jobId?: string;
  userId: string;
  companyId?: string;
  status: "scheduled" | "in_progress" | "completed" | "failed";
  startDate: string;
  summary?: string;
  llmModel?: string;
  metadata?: Record<string, unknown>;
  todo: FollowupPlanTodo[];
  createdAt: string;
  updatedAt: string;
}
```

#### Plan Stats Response

```typescript
{
  totalPlans: number;
  activePlans: number;
  completedPlans: number;
  failedPlans: number;
  totalTouchpoints: number;
  avgDaysPerPlan: number | null;
  avgTouchpointsPerPlan: number | null;
}
```

#### Query Parameters (GET all plans)

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `templateId`: Filter by template ID (optional)
- `jobId`: Filter by job ID (optional)

## Frontend Integration

### Service Files

#### Location: `src/services/`

1. **followupTemplates.service.ts**

   - Exports: `followupTemplatesService`
   - Methods:
     - `getTemplates(params)` - Fetch all templates
     - `getTemplateById(id)` - Fetch single template
     - `createTemplate(payload)` - Create new template
     - `updateTemplate(id, payload)` - Update template
     - `deleteTemplate(id)` - Delete template
     - `duplicateTemplate(id)` - Duplicate template

2. **followupPlans.service.ts**
   - Exports: `followupPlansService`
   - Methods:
     - `getPlans(params)` - Fetch all plans
     - `getPlanById(id)` - Fetch single plan
     - `createPlan(payload)` - Create new plan
     - `deletePlan(id)` - Delete plan
     - `getPlanSchedule(id)` - Get plan schedule
     - `getPlanStats()` - Get aggregate statistics _(newly added)_

### React Query Hooks

#### Location: `src/hooks/`

1. **useFollowupTemplates.ts**

   - `useFollowupTemplates(params)` - Query hook for fetching templates
   - `useFollowupTemplate(id)` - Query hook for single template
   - `useCreateFollowupTemplate()` - Mutation hook for creating
   - `useUpdateFollowupTemplate()` - Mutation hook for updating
   - `useDeleteFollowupTemplate()` - Mutation hook for deleting
   - `useDuplicateFollowupTemplate()` - Mutation hook for duplicating

2. **useFollowupPlans.ts**
   - `useFollowupPlans(params)` - Query hook for fetching plans
   - `useFollowupPlan(id)` - Query hook for single plan
   - `useCreateFollowupPlan()` - Mutation hook for creating
   - `useDeleteFollowupPlan()` - Mutation hook for deleting
   - `useFollowupPlanSchedule(id)` - Query hook for plan schedule
   - `useFollowupPlanStats()` - Query hook for statistics _(newly added)_

### Components

#### Location: `src/pages/crm/followups-2/components/`

1. **FollowUpTemplates.tsx**

   - **Status**: ✅ Fully integrated with API
   - **Features**:
     - Fetches templates using `useFollowupTemplates` hook
     - Implements search functionality
     - Displays template cards with real data
     - Shows loading and error states
     - Renders empty state when no templates exist
   - **Data Displayed**:
     - Template title
     - Last updated date (dynamic calculation)
     - Run time (days)
     - Number of emails, calls, and WhatsApp messages
     - Time of day to run

2. **ActiveFollowUpPlans.tsx**
   - **Status**: ✅ Fully integrated with API
   - **Features**:
     - Fetches plans using `useFollowupPlans` hook
     - Filters for active plans (scheduled & in_progress)
     - Displays plan cards with progress timeline
     - Shows loading and error states
     - Renders empty state when no active plans
   - **Data Displayed**:
     - Plan name (from template)
     - Status badge (Scheduled/In Progress/Completed)
     - Start date
     - Cumulative counts for emails, SMS, WhatsApp, calls
     - Day-by-day progress timeline

## API Configuration

### Base URL

The API base URL is configured in `src/utils/api.ts`:

```typescript
baseURL: import.meta.env.VITE_APP_BACKEND_URL || "http://localhost:3000/api";
```

### Authentication

All API requests automatically include the Bearer token from localStorage via Axios interceptors.

### Error Handling

- 401 errors automatically clear auth data and redirect to login
- Network errors are logged to console
- Component-level error states display user-friendly messages

## Environment Variables

Add to your `.env` file:

```
VITE_APP_BACKEND_URL=https://your-backend-url.com/api
```

## Usage Examples

### Fetching Templates

```typescript
import { useFollowupTemplates } from "@/hooks/useFollowupTemplates";

function MyComponent() {
  const { data, isLoading, isError } = useFollowupTemplates({
    page: 1,
    limit: 10,
    search: "campaign",
  });

  // Access templates: data?.data?.docs
}
```

### Creating a Template

```typescript
import { useCreateFollowupTemplate } from "@/hooks/useFollowupTemplates";

function MyComponent() {
  const createTemplate = useCreateFollowupTemplate();

  const handleCreate = () => {
    createTemplate.mutate({
      title: "New Campaign",
      numberOfDaysToRun: "10",
      numberOfEmails: "5",
      numberOfCalls: "3",
      numberOfWhatsappMessages: "2",
      timeOfDayToRun: "14:00",
    });
  };
}
```

### Fetching Plan Statistics

```typescript
import { useFollowupPlanStats } from "@/hooks/useFollowupPlans";

function StatsComponent() {
  const { data, isLoading } = useFollowupPlanStats();

  // Access stats: data?.data
  // totalPlans, activePlans, completedPlans, etc.
}
```

### Creating a Plan

```typescript
import { useCreateFollowupPlan } from "@/hooks/useFollowupPlans";

function MyComponent() {
  const createPlan = useCreateFollowupPlan();

  const handleCreate = () => {
    createPlan.mutate({
      templateId: "template_id_here",
      personIds: ["person1_id", "person2_id"],
      startDate: new Date().toISOString(),
      timezone: "UTC",
      llmModel: "gpt-4",
      metadata: { source: "manual" },
    });
  };
}
```

## Changes Made

### New Features Added

1. ✅ Added `getPlanStats()` method to `followupPlansService`
2. ✅ Added `useFollowupPlanStats()` hook
3. ✅ Integrated real API data in `FollowUpTemplates.tsx` (removed mock data)
4. ✅ Added loading, error, and empty states to components

### Files Modified

1. `src/services/followupPlans.service.ts` - Added stats endpoint
2. `src/hooks/useFollowupPlans.ts` - Added stats hook
3. `src/pages/crm/followups-2/components/FollowUpTemplates.tsx` - Replaced mock data with API calls

### Files Already Integrated (No changes needed)

1. `src/services/followupTemplates.service.ts` - ✅ Already complete
2. `src/hooks/useFollowupTemplates.ts` - ✅ Already complete
3. `src/pages/crm/followups-2/components/ActiveFollowUpPlans.tsx` - ✅ Already using API

## Testing Checklist

- [ ] Verify templates load correctly on page load
- [ ] Test search functionality for templates
- [ ] Test creating a new template
- [ ] Test updating an existing template
- [ ] Test deleting a template
- [ ] Test duplicating a template
- [ ] Verify active plans display correctly
- [ ] Test creating a new plan
- [ ] Test deleting a plan
- [ ] Verify plan statistics load correctly
- [ ] Test error handling (network errors, 401, etc.)
- [ ] Verify loading states display correctly
- [ ] Verify empty states display correctly

## Notes

- All pagination is handled by the backend
- Template time must be in 24-hour format (HH:MM)
- Plans can only be deleted if they are in "active" status
- The backend automatically associates templates/plans with the authenticated user
- CompanyId is automatically resolved from the authenticated user's context

## Support

For backend API documentation, refer to:

- Backend router: `backend/routers/followup.router.js`
- Template controller: `backend/controller/followupTemplateController.js`
- Plan controller: `backend/controller/followupPlanController.js`
- Template model: `backend/model/FollowupTemplate.js`
- Plan model: `backend/model/FollowupPlan.js`
