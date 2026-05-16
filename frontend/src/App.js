import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminCountries from "./pages/admin/AdminCountries";
import AdminCountryEdit from "./pages/admin/AdminCountryEdit";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Toaster } from "./components/ui/sonner";

function Protected({ children }) {
  const { user, ready } = useAuth();
  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#FAFAFA]">
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-500">
          loading…
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/admin/login" replace />;
  return children;
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public landing — tenant resolved from hostname or ?tenant= */}
            <Route path="/" element={<Landing />} />
            <Route path="/preview/:slug" element={<Landing />} />

            {/* Admin */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <Protected>
                  <AdminLayout />
                </Protected>
              }
            >
              <Route index element={<AdminCountries />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="countries/:id" element={<AdminCountryEdit />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;
