# BDR/SDR Dashboard Implementation

## Overview

This implementation creates a specialized dashboard for BDR/SDR (Business Development Representative/Sales Development Representative) users with the `CompanyUser` role. The dashboard focuses on individual performance, daily execution, and personal productivity rather than company-wide metrics.

## Key Features Implemented

### 1. Today's Mission (Above the Fold)
- **Priority Queue**: Ranked list of leads to contact today, ordered by urgency, conversion likelihood, and SLA risk
- **Daily Goal Tracker**: Visual progress bars for conversations started, meetings booked, and qualified opportunities

### 2. Live Pipeline Snapshot (Personal View)
- **Active Opportunities**: Count, total value, and breakdown by stage (New/Contacted/Qualified/Meeting Set)
- **Meetings Booked**: Today/this week counts, show-up rates, and upcoming meetings in next 48h

### 3. Execution Quality & Speed
- **Speed-to-Lead**: Median response time and SLA compliance tracking
- **Follow-up Consistency**: Execution rate and missed follow-ups highlighting
- **Conversation Effectiveness**: Positive responses, objections, and AI-derived quality score

### 4. Real-Time Assistance
- **Talk Track Assistant**: Contextual suggestions including opening lines, discovery questions, objection handling, and next steps
- **Message Suggestions**: Draft emails, subject lines, and tone adjustments

### 5. Activity & Productivity (Personal Focus)
- **Activity Summary**: Calls made, emails sent, conversations held (today vs. week)
- **Time Allocation**: Visual breakdown of selling time vs. admin time

### 6. Personal Performance
- **Conversion Rates**: Contact→Conversation, Conversation→Meeting, Meeting→Qualified (compared to personal averages)
- **Coaching Insights**: AI-generated suggestions for improvement

### 7. Alerts & Nudges (Action-Oriented)
- **At-Risk Items**: SLA breaches, overdue follow-ups, missing prep notes, stalled deals
- Each alert includes one-click actions to resolve issues

## File Structure

```
src/
├── components/dashboard/bdr/
│   ├── BDRDashboard.tsx              # Main dashboard component
│   ├── TodaysPriorityQueue.tsx       # Priority leads queue
│   ├── DailyGoalTracker.tsx          # Goal progress tracking
│   ├── PersonalPipelineCard.tsx      # Pipeline overview
│   ├── ExecutionQualityCard.tsx      # Quality metrics
│   ├── TalkTrackAssistant.tsx        # AI-powered talk tracks
│   └── AtRiskAlertsCard.tsx          # Risk alerts and actions
├── hooks/
│   └── useBDRDashboard.ts            # Custom hook for dashboard data
├── services/
│   ├── bdr-dashboard.service.ts      # API service layer
│   └── bdr-dashboard-mock.service.ts # Mock data for development
└── types/
    └── bdr-dashboard.types.ts        # TypeScript interfaces
```

## Role-Based Access

The dashboard automatically detects user roles:
- **CompanyUser**: Shows BDR/SDR dashboard with personal metrics
- **CompanyAdmin**: Shows existing admin dashboard with company-wide analytics
- **Admin**: Redirects to admin dashboard

## API Endpoints (To Be Implemented)

The following API endpoints need to be created in the backend:

```
GET /dashboard/bdr-overview              # Complete dashboard data
GET /dashboard/bdr/daily-goals           # Daily goal tracking
GET /dashboard/bdr/priority-queue        # Priority leads queue
GET /dashboard/bdr/pipeline-snapshot     # Personal pipeline data
GET /dashboard/bdr/execution-quality     # Quality metrics
GET /dashboard/bdr/talk-track/:leadId    # Contextual talk tracks
GET /dashboard/bdr/message-suggestions   # Message suggestions
GET /dashboard/bdr/activity-summary      # Activity metrics
GET /dashboard/bdr/conversion-rates      # Personal conversion rates
GET /dashboard/bdr/coaching-insights     # AI coaching suggestions
GET /dashboard/bdr/at-risk-items         # Risk alerts

POST /dashboard/bdr/quick-action/:itemId # Execute quick actions
PUT /dashboard/bdr/daily-goals           # Update goal targets
```

## Mock Data

Currently using mock data for development. To switch to real APIs:
1. Set `USE_MOCK_DATA = false` in `bdr-dashboard.service.ts`
2. Implement the backend API endpoints
3. Remove the mock service file

## Design Principles

1. **Eliminate "what should I do now?" paralysis** - Clear priority queue and recommended actions
2. **Personal focus, not team comparison** - Individual metrics vs. personal averages
3. **Action-oriented alerts** - Every alert includes a solution
4. **Momentum-driven design** - Visual progress tracking for motivation
5. **Real-time assistance** - AI-powered suggestions for better conversations

## Usage

The BDR dashboard automatically loads when a user with `CompanyUser` role accesses the main dashboard route (`/dashboard`). The component uses the `useBDRDashboard` hook to manage data fetching, state, and actions.

## Next Steps

1. Implement backend API endpoints
2. Add real-time WebSocket updates for live data
3. Integrate with existing CRM and communication systems
4. Add mobile-responsive optimizations
5. Implement user preferences and customization options