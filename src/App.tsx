import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { SocketProvider } from './contexts/SocketContext';
import { Layout } from './components/layout/Layout';

// Pages
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { PostJob } from './pages/PostJob';
import { FindJobs } from './pages/FindJobs';
import { MyJobs } from './pages/MyJobs';
import { MyBids } from './pages/MyBids';
import { Messages } from './pages/Messages';
import { Profile } from './pages/Profile';
import { NotFound } from './pages/NotFound';
import { NotificationsPage } from './pages/NotificationsPage';
import { Settings } from './pages/Settings';
import { AdminDashboard } from './pages/AdminDashboard';
import { JobDetails } from './pages/JobDetails';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// App Routes Component
function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/" 
        element={user ? <Navigate to="/dashboard" replace /> : <Home />} 
      />
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
      />
      <Route 
        path="/register" 
        element={user ? <Navigate to="/dashboard" replace /> : <Register />} 
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Placeholder routes - will be implemented next */}
      <Route
        path="/post-job"
        element={
          <ProtectedRoute>
            <Layout>
              <PostJob />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/find-jobs"
        element={
          <ProtectedRoute>
            <Layout>
              <FindJobs />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-jobs"
        element={
          <ProtectedRoute>
            <Layout>
              <MyJobs />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-bids"
        element={
          <ProtectedRoute>
            <Layout>
              <MyBids />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/job/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <JobDetails />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <Layout>
              <Messages />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Layout>
              <NotificationsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <Layout>
              <AdminDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Catch all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// Theme-aware app wrapper
function AppContent() {
  const { theme } = useTheme();
  
  return (
    <div className={`min-h-screen ${theme}`}>
      <AppRoutes />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: theme === 'dark' ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
            color: theme === 'dark' ? '#e2e8f0' : '#1e293b',
            border: theme === 'dark' ? '1px solid rgba(226, 232, 240, 0.1)' : '1px solid rgba(30, 41, 59, 0.1)',
            borderRadius: '12px',
            fontSize: '14px',
            padding: '12px 16px',
          },
          duration: 4000,
        }}
      />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <SocketProvider>
            <AppContent />
          </SocketProvider>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;