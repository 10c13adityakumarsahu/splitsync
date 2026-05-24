import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';

// Placeholders for Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProfileSetup from './pages/ProfileSetup';
import Dashboard from './pages/Dashboard';
import PublicSettlement from './pages/PublicSettlement';
import GroupDetails from './pages/GroupDetails';
import AddExpense from './pages/AddExpense';
import BottomNav from './components/BottomNav';

const queryClient = new QueryClient();

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const ConditionalRoot = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Landing />;
  return (
    <LayoutWithNav>
      <Dashboard />
    </LayoutWithNav>
  );
};

const LayoutWithNav = ({ children }) => {
  return (
    <div className="pb-16">
      {children}
      <BottomNav />
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen font-sans text-slate-900 bg-slate-50">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/settle/:token" element={<PublicSettlement />} />
              
              {/* Profile Setup */}
              <Route 
                path="/profile-setup" 
                element={
                  <ProtectedRoute>
                    <LayoutWithNav>
                      <ProfileSetup />
                    </LayoutWithNav>
                  </ProtectedRoute>
                } 
              />
              
              {/* Conditional Root */}
              <Route 
                path="/" 
                element={
                  <ConditionalRoot />
                } 
              />
              <Route 
                path="/groups/:id" 
                element={
                  <ProtectedRoute>
                    <LayoutWithNav>
                      <GroupDetails />
                    </LayoutWithNav>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/groups/:id/add-expense" 
                element={
                  <ProtectedRoute>
                    <LayoutWithNav>
                      <AddExpense />
                    </LayoutWithNav>
                  </ProtectedRoute>
                } 
              />
              
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
