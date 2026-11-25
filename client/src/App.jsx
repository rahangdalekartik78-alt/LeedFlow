// Routes + ProtectedRoute.
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-center text-slate-500">Loading…</div>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
