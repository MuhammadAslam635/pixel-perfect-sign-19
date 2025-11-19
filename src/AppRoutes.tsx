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
import ClientsPage from "@/pages/clients";
import UserList from "@/pages/users/UserList";
import UserCreate from "@/pages/users/UserCreate";
import UserEdit from "@/pages/users/UserEdit";
import ContactNow from "@/pages/twilio-calling/ContactNow";
import FollowupTemplatesPage from "@/pages/followup-templates";
import LeadDetailView from "@/pages/leaddetailview";
import {
  InboxPage,
  ThreadsPage,
  ComposePage,
  EmailDetailPage,
  ThreadDetailPage,
  StatsPage,
} from "@/pages/emails";

const contactNowRoles = ["CompanyUser"];

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
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/companies"
        element={
          <ProtectedRoute>
            <CompanyDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/company-knowledge"
        element={
          <ProtectedRoute>
            <CompanyKnowledge />
          </ProtectedRoute>
        }
      />
      <Route
        path="/agents"
        element={
          <ProtectedRoute>
            <AgentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/campaigns"
        element={
          <ProtectedRoute>
            <CampaignsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/clients"
        element={
          <ProtectedRoute>
            <ClientsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/followup-templates"
        element={
          <ProtectedRoute>
            <FollowupTemplatesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <UserList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users/create"
        element={
          <ProtectedRoute>
            <UserCreate />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users/:id/edit"
        element={
          <ProtectedRoute>
            <UserEdit />
          </ProtectedRoute>
        }
      />
      <Route
        path="/contact-now"
        element={
          <ProtectedRoute allowedRoles={contactNowRoles}>
            <ContactNow />
          </ProtectedRoute>
        }
      />
      <Route
        path="/emails/inbox"
        element={
          <ProtectedRoute>
            <InboxPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/emails/threads"
        element={
          <ProtectedRoute>
            <ThreadsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/emails/compose"
        element={
          <ProtectedRoute>
            <ComposePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/emails/stats"
        element={
          <ProtectedRoute>
            <StatsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/emails/:emailId"
        element={
          <ProtectedRoute>
            <EmailDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/emails/threads/:threadId"
        element={
          <ProtectedRoute>
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

      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
