import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import PublicRoute from "@/components/PublicRoute";
import type { SelectedCallLogView } from "@/pages/crm/leads/leaddetailview";

// Lazy load all page components
const Index = lazy(() => import("@/pages/auth/Index"));
const SignUpPage = lazy(() => import("@/pages/auth/SignUpPage"));
const ForgotPassword = lazy(() => import("@/pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/auth/ResetPassword"));
const ChangePassword = lazy(() => import("@/pages/auth/ChangePassword"));
const VerifyEmail = lazy(() => import("@/pages/auth/VerifyEmail"));
const ResendEmail = lazy(() => import("@/pages/auth/ResendEmail"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const CompanyDetail = lazy(() => import("@/pages/crm/companies"));
const ChatPage = lazy(() => import("@/pages/Chat"));
const AgentsPage = lazy(() => import("@/pages/agents"));
const AgentDetails = lazy(
  () => import("@/pages/agents/components/AgentDetails")
);
const NotFound = lazy(() => import("@/pages/NotFound"));
const SettingsPage = lazy(() => import("@/pages/Settings"));
const Feedback = lazy(() => import("@/pages/Feedback/Feedback"));
const FeedbackChat = lazy(() => import("@/pages/Feedback/FeedbackChat"));
const CompanyKnowledge = lazy(() => import("@/pages/companyKnowledgeBase"));
const CampaignsPage = lazy(() => import("@/pages/campaigns"));
const FacebookCampaignsPage = lazy(() => import("@/pages/campaigns/facebook"));
const FacebookCampaignAnalysisPage = lazy(
  () => import("@/pages/campaigns/facebook/analysis")
);
const ProspectsPage = lazy(() => import("@/pages/prospects"));
const NewsPage = lazy(() => import("@/pages/News"));
const UserList = lazy(() => import("@/pages/users/UserList"));
const UserCreate = lazy(() => import("@/pages/users/UserCreate"));
const UserEdit = lazy(() => import("@/pages/users/UserEdit"));
// const ContactNow = lazy(() => import("@/pages/twilio-calling/ContactNow"));
const FollowupTemplatesPage = lazy(() => import("@/pages/crm/followups"));
const FollowUp2Page = lazy(() => import("@/pages/crm/followups-2"));
const LeadDetailView = lazy(() => import("@/pages/crm/leads/leaddetailview"));
const RoleList = lazy(() => import("@/pages/roles/RoleList"));
const RoleForm = lazy(() => import("@/pages/roles/RoleForm"));
const ModuleList = lazy(() => import("@/pages/modules/ModuleList"));
const InboxPage = lazy(() =>
  import("@/pages/crm/emails").then((module) => ({ default: module.InboxPage }))
);
const ThreadsPage = lazy(() =>
  import("@/pages/crm/emails").then((module) => ({
    default: module.ThreadsPage,
  }))
);
const ComposePage = lazy(() =>
  import("@/pages/crm/emails").then((module) => ({
    default: module.ComposePage,
  }))
);
const EmailDetailPage = lazy(() =>
  import("@/pages/crm/emails").then((module) => ({
    default: module.EmailDetailPage,
  }))
);
const ThreadDetailPage = lazy(() =>
  import("@/pages/crm/emails").then((module) => ({
    default: module.ThreadDetailPage,
  }))
);
const StatsPage = lazy(() =>
  import("@/pages/crm/emails").then((module) => ({ default: module.StatsPage }))
);
const LeadChat = lazy(
  () => import("@/pages/crm/leads/leaddetailview/components/LeadChat")
);
const LeadsPage = lazy(() => import("@/pages/crm/leads"));
const CalendarPage = lazy(() => import("@/pages/crm/calendar"));
const OnboardingPage = lazy(() => import("@/pages/onboarding"));
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminPrompts = lazy(() => import("@/pages/admin/prompts"));
const AdminSettings = lazy(() => import("@/pages/admin/Settings"));
const AdminUsers = lazy(() => import("@/pages/admin/Users"));
const AdminIndustryCategories = lazy(
  () => import("@/pages/admin/IndustryCategories")
);
const AdminEnrichmentConfigs = lazy(
  () => import("@/pages/admin/EnrichmentConfigs")
);
const AdminFeedbacks = lazy(
  () => import("@/pages/admin/feedbacks/AdminFeedbacks")
);
const UserFeedbackList = lazy(
  () => import("@/pages/admin/feedbacks/UserFeedbackList")
);
const FeedbackDetail = lazy(
  () => import("@/pages/admin/feedbacks/FeedbackDetail")
);

// Loading component for suspense fallback
const PageLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
  </div>
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <Routes>
        {/* Public Routes - Redirect to dashboard if already logged in */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <Index />
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Index />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <SignUpPage />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          }
        />
        <Route
          path="/change-password"
          element={
            <ProtectedRoute skipOnboardingCheck>
              <ChangePassword />
            </ProtectedRoute>
          }
        />
        <Route
          path="/verify-email"
          element={
            <PublicRoute>
              <VerifyEmail />
            </PublicRoute>
          }
        />
        <Route
          path="/resend-email"
          element={
            <PublicRoute>
              <ResendEmail />
            </PublicRoute>
          }
        />

        {/* Protected Routes - Only accessible when logged in */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute skipOnboardingCheck>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute moduleName="dashboard">
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/companies"
          element={
            <ProtectedRoute moduleName="companies">
              <CompanyDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute moduleName="chat">
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute moduleName="settings">
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/feedback/:feedbackId/chat"
          element={
            <ProtectedRoute moduleName="feedback">
              <FeedbackChat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/feedback"
          element={
            <ProtectedRoute moduleName="feedback">
              <Feedback />
            </ProtectedRoute>
          }
        />
        <Route
          path="/company-knowledge"
          element={
            <ProtectedRoute moduleName="company-knowledge">
              <CompanyKnowledge />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leads"
          element={
            <ProtectedRoute moduleName="leads">
              <LeadsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/agents"
          element={
            <ProtectedRoute moduleName="agents">
              <AgentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/agent-detail/:name"
          element={
            <ProtectedRoute moduleName="agents">
              <AgentDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leadchattest"
          element={
            <ProtectedRoute>
              <LeadChat
                selectedCallLogView={null}
                setSelectedCallLogView={function (
                  value: SelectedCallLogView | null
                ): void {
                  throw new Error("Function not implemented.");
                }}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/campaigns"
          element={
            <ProtectedRoute moduleName="campaigns">
              <CampaignsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/prospects"
          element={
            <ProtectedRoute moduleName="clients">
              <ProspectsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/news"
          element={
            <ProtectedRoute>
              <NewsPage />
            </ProtectedRoute>
          }
        />
        {/* <Route
        path="/followups"
        element={
          <ProtectedRoute moduleName="followup-templates">
            <FollowupTemplatesPage />
          </ProtectedRoute>
        }
      /> */}
        <Route
          path="/followups"
          element={
            <ProtectedRoute moduleName="followups">
              <FollowUp2Page />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute moduleName="users">
              <UserList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/create"
          element={
            <ProtectedRoute moduleName="users" requiredActions={["create"]}>
              <UserCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/:id/edit"
          element={
            <ProtectedRoute moduleName="users" requiredActions={["edit"]}>
              <UserEdit />
            </ProtectedRoute>
          }
        />
        {/* <Route
        path="/contact-now"
        element={
          <ProtectedRoute moduleName="contact-now">
            <ContactNow />
          </ProtectedRoute>
        }
      /> */}
        <Route
          path="/emails/inbox"
          element={
            <ProtectedRoute moduleName="emails">
              <InboxPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/emails/threads"
          element={
            <ProtectedRoute moduleName="emails">
              <ThreadsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/emails/compose"
          element={
            <ProtectedRoute moduleName="emails" requiredActions={["create"]}>
              <ComposePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/emails/stats"
          element={
            <ProtectedRoute moduleName="emails">
              <StatsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/emails/:emailId"
          element={
            <ProtectedRoute moduleName="emails">
              <EmailDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/emails/threads/:threadId"
          element={
            <ProtectedRoute moduleName="emails">
              <ThreadDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leads/:leadId"
          element={
            <ProtectedRoute moduleName="leads">
              <LeadDetailView />
            </ProtectedRoute>
          }
        />

        {/* RBAC Routes */}
        <Route
          path="/roles"
          element={
            <ProtectedRoute moduleName="roles">
              <RoleList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/roles/create"
          element={
            <ProtectedRoute moduleName="roles" requiredActions={["create"]}>
              <RoleForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/roles/:id/edit"
          element={
            <ProtectedRoute moduleName="roles" requiredActions={["edit"]}>
              <RoleForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/modules"
          element={
            <ProtectedRoute moduleName="modules">
              <ModuleList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/calendar"
          element={
            <ProtectedRoute moduleName="calendar">
              <CalendarPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes - Only accessible by Admin role */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/prompts"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AdminPrompts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AdminSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/industry-categories"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AdminIndustryCategories />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/enrichment-configs"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AdminEnrichmentConfigs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/feedbacks"
          element={
            <ProtectedRoute allowedRoles={["Admin", "CompanyAdmin", "Company"]}>
              <AdminFeedbacks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/feedbacks/user/:userId"
          element={
            <ProtectedRoute allowedRoles={["Admin", "CompanyAdmin", "Company"]}>
              <UserFeedbackList key={window.location.pathname} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/feedbacks/:feedbackId"
          element={
            <ProtectedRoute allowedRoles={["Admin", "CompanyAdmin", "Company"]}>
              <FeedbackDetail />
            </ProtectedRoute>
          }
        />

        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
