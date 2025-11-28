import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import PublicRoute from "@/components/PublicRoute";
import Index from "@/pages/auth/Index";
import SignUpPage from "@/pages/auth/SignUpPage";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import VerifyEmail from "@/pages/auth/VerifyEmail";
import ResendEmail from "@/pages/auth/ResendEmail";
import Dashboard from "@/pages/Dashboard";
import CompanyDetail from "@/pages/companies";
import ChatPage from "@/pages/Chat";
import AgentsPage from "@/pages/agents";
import NotFound from "@/pages/NotFound";
import SettingsPage from "@/pages/Settings";
import CompanyKnowledge from "@/pages/companyKnowledgeBase";
import CampaignsPage from "@/pages/campaigns";
import ProspectsPage from "@/pages/prospects";
import UserList from "@/pages/users/UserList";
import UserCreate from "@/pages/users/UserCreate";
import UserEdit from "@/pages/users/UserEdit";
import ContactNow from "@/pages/twilio-calling/ContactNow";
import FollowupTemplatesPage from "@/pages/followups";
import LeadDetailView from "@/pages/leaddetailview";
import RoleList from "@/pages/roles/RoleList";
import RoleForm from "@/pages/roles/RoleForm";
import ModuleList from "@/pages/modules/ModuleList";
import {
  InboxPage,
  ThreadsPage,
  ComposePage,
  EmailDetailPage,
  ThreadDetailPage,
  StatsPage,
} from "@/pages/emails";
import LeadChat from "./pages/leaddetailview/components/LeadChat";
import MembersPermissions from "@/pages/admin/MembersPermissions";

const AppRoutes = () => {
  return (
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
        path="/company-knowledge"
        element={
          <ProtectedRoute moduleName="company-knowledge">
            <CompanyKnowledge />
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
        path="/leadchattest"
        element={
          <ProtectedRoute>
            <LeadChat />
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
        path="/followups"
        element={
          <ProtectedRoute moduleName="followup-templates">
            <FollowupTemplatesPage />
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
      <Route
        path="/contact-now"
        element={
          <ProtectedRoute moduleName="contact-now">
            <ContactNow />
          </ProtectedRoute>
        }
      />
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
          <ProtectedRoute>
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
        path="/admin/members/permissions"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <MembersPermissions />
          </ProtectedRoute>
        }
      />

      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
