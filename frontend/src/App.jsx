import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ChatWindow from "@/components/ChatWindow"; // your existing component

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to='/login' replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path='/login' element={<LoginPage />} />
      <Route path='/register' element={<RegisterPage />} />
      <Route
        path='/dashboard'
        element={
          <ProtectedRoute>
            <ChatWindow />
          </ProtectedRoute>
        }
      />
      {/* Default redirect */}
      <Route path='*' element={<Navigate to='/login' replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes></AppRoutes>
      </BrowserRouter>
    </AuthProvider>
  );
}
