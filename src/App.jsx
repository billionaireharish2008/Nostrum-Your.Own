import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import CustomerLayout from '@/components/CustomerLayout';
import AdminGate from '@/components/AdminGate';
import AdminLayout from '@/components/AdminLayout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import StaffLogin from '@/pages/StaffLogin';
import Dashboard from '@/pages/Dashboard';
import Transfer from '@/pages/Transfer';
import Transactions from '@/pages/Transactions';
import TransactionDetail from '@/pages/TransactionDetail';
import ReportSuspicious from '@/pages/ReportSuspicious';
import Settings from '@/pages/Settings';
import AdminHome from '@/pages/AdminHome';
import FlaggedSessions from '@/pages/admin/FlaggedSessions';
import SessionReplay from '@/pages/admin/SessionReplay';
import UsersRoles from '@/pages/admin/UserRoles';
import AIAgents from '@/pages/admin/AIAgents';
import AuditLogs from '@/pages/admin/AuditLogs';
import AgentBuilder from '@/pages/admin/AgentBuilder';
import SystemHealth from '@/pages/admin/SystemHealth';
import AdminTransactions from '@/pages/admin/AdminTransactions';
import Reports from '@/pages/admin/Reports';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/staff-login" element={<StaffLogin />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transfer" element={<Transfer />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/transactions/:id" element={<TransactionDetail />} />
          <Route path="/report" element={<ReportSuspicious />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route element={<AdminGate />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminHome />} />
            <Route path="/admin/flagged" element={<FlaggedSessions />} />
            <Route path="/admin/replay" element={<SessionReplay />} />
            <Route path="/admin/users" element={<UsersRoles />} />
            <Route path="/admin/agents" element={<AIAgents />} />
            <Route path="/admin/agent-config" element={<AgentBuilder />} />
            <Route path="/admin/transactions" element={<AdminTransactions />} />
            <Route path="/admin/reports" element={<Reports />} />
            <Route path="/admin/audit-logs" element={<AuditLogs />} />
            <Route path="/admin/system-health" element={<SystemHealth />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
