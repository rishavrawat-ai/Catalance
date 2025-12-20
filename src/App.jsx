import PropTypes from "prop-types";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "@/components/home/Home.jsx";
import Client from "@/components/client/Client.jsx";
import ClientDashboard from "@/components/client/ClientDashboard.jsx";
import ClientProposal from "@/components/client/ClientProposal.jsx";
import ProposalDrafts from "@/components/client/ProposalDrafts.jsx";
import ClientProjects from "@/components/client/ClientProjects.jsx";
import ClientProjectDetail from "@/components/client/ClientProjectDetail.jsx";
import ClientChat from "@/components/client/ClientChat.jsx";
import ClientProfile from "@/components/client/ClientProfile.jsx";
import ProjectManagerDashboard from "@/components/project-manager/ProjectManagerDashboard";
import { ThemeProvider } from "./components/theme-provider";
import Navbar from "./components/Navbar";
import SignupPage from "./components/forms/Signup";
import LoginPage from "./components/forms/Login";
import PMLogin from "@/components/project-manager/PMLogin";
import FreelancerDashboard from "@/components/freelancer/FreelancerDashboard";
import FreelancerProposal from "@/components/freelancer/FreelancerProposal";
import FreelancerProfile from "@/components/freelancer/FreelancerProfile";
import FreelancerProjects from "@/components/freelancer/FreelancerProjects";
import FreelancerProjectDetail from "@/components/freelancer/FreelancerProjectDetail";
import FreelancerChat from "@/components/freelancer/FreelancerChat";
import { useAuth } from "@/context/AuthContext";
import FreelancerMultiStepForm from "./components/freelancer/multi-step-form";
import NotepadPage from "@/components/ui/notepad-page";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminProjects from "@/components/admin/AdminProjects";
import AdminProjectDetail from "@/components/admin/AdminProjectDetail";
import AdminDisputes from "@/components/admin/AdminDisputes";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminRoute from "@/components/auth/AdminRoute";

const App = () => {
  return (
    <main>
      <ThemeProvider defaultTheme="dark" storageKey="freelancer-ui-theme-v1">
        <Routes>
          <Route
            path="/"
            element={
              <LayoutWithNavbar>
                <Home />
              </LayoutWithNavbar>
            }
          />
          <Route
            path="/signup"
            element={
              <SignupPage />
            }
          />
          <Route
            path="/login"
            element={
              <LayoutWithNavbar>
                <LoginPage />
              </LayoutWithNavbar>
            }
          />
          <Route
            path="/project-manager/login"
            element={
              <PMLogin />
            }
          />
          <Route
            path="/client"
            element={
              <ProtectedRoute>
                <ClientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/project"
            element={
              <ProtectedRoute>
                <ClientProjects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/project/:projectId"
            element={
              <ProtectedRoute>
                <ClientProjectDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/proposal"
            element={
              <ProtectedRoute>
                <ClientProposal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/proposal/drafts"
            element={
              <ProtectedRoute>
                <ProposalDrafts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/messages"
            element={
              <ProtectedRoute>
                <ClientChat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/profile"
            element={
              <ProtectedRoute>
                <ClientProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/project-manager"
            element={
              <ProtectedRoute loginPath="/project-manager/login">
                <ProjectManagerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/service"
            element={
              <LayoutWithNavbar>
                <Client />
              </LayoutWithNavbar>
            }
          />
          <Route
            path="/freelancer"
            element={
              <ProtectedRoute>
                <FreelancerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/freelancer/proposals"
            element={
              <ProtectedRoute>
                <FreelancerProposal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/freelancer/proposals/received"
            element={
              <ProtectedRoute>
                <FreelancerProposal filter="received" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/freelancer/proposals/accepted"
            element={
              <ProtectedRoute>
                <FreelancerProposal filter="accepted" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/freelancer/project"
            element={
              <ProtectedRoute>
                <FreelancerProjects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/freelancer/project/:projectId"
            element={
              <ProtectedRoute>
                <FreelancerProjectDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/freelancer/messages"
            element={
              <ProtectedRoute>
                <FreelancerChat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/freelancer/onboarding"
            element={
              <LayoutWithNavbar>
                <FreelancerMultiStepForm />
              </LayoutWithNavbar>
            }
          />
          <Route
            path="/freelancer/profile"
            element={
              <ProtectedRoute>
                <FreelancerProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notepad"
            element={
              <NotepadPage />
            }
          />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/clients"
            element={
              <AdminRoute>
                <AdminUsers roleFilter="CLIENT" />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/freelancers"
            element={
              <AdminRoute>
                <AdminUsers roleFilter="FREELANCER" />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/project-managers"
            element={
              <AdminRoute>
                <AdminDisputes />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/projects"
            element={
              <AdminRoute>
                <AdminProjects />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/projects/:id"
            element={
              <AdminRoute>
                <AdminProjectDetail />
              </AdminRoute>
            }
          />
          <Route
            path="*"
            element={
              <LayoutWithNavbar>
                <NotFound />
              </LayoutWithNavbar>
            }
          />
        </Routes>
      </ThemeProvider>
    </main>
  );
};

const LayoutWithNavbar = ({ children }) => (
  <>
    <Navbar />
    {children}
  </>
);

LayoutWithNavbar.propTypes = {
  children: PropTypes.node.isRequired,
};

const ProtectedRoute = ({ children, loginPath = "/login" }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="loading loading-spinner text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={loginPath} replace />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  loginPath: PropTypes.string,
};

const NotFound = () => (
  <main className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
    <p className="text-sm uppercase tracking-[0.3em] text-emerald-400/80">
      404
    </p>
    <h1 className="text-3xl md:text-4xl font-light">Page not found</h1>
    <p className="text-emerald-50/70 max-w-md">
      The route you are looking for doesn&apos;t exist. Use the main navigation
      to head back home.
    </p>
  </main>
);

export default App;
