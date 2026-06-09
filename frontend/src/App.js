import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminCountries from "./pages/admin/AdminCountries";
import AdminCountryEdit from "./pages/admin/AdminCountryEdit";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminBlogList from "./pages/admin/AdminBlogList";
import AdminBlogEditor from "./pages/admin/AdminBlogEditor";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Toaster } from "./components/ui/sonner";

// Hostnames that should NOT serve a tenant landing — they go straight to /admin.
// Add new internal/staff hosts here (no protocol, no path).
const ADMIN_HOSTS = new Set(
  (process.env.REACT_APP_ADMIN_HOSTS ||
    "localhost,127.0.0.1,crymsonsky3.netlify.app,crymsonsky3.menelausholding.com"
  )
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean)
);

function isAdminHost() {
  if (typeof window === "undefined") return false;
  return ADMIN_HOSTS.has(window.location.hostname.toLowerCase());
}

function RootRoute() {
  return isAdminHost() ? <Navigate to="/admin/login" replace /> : <Landing />;
}

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
            {/* On admin/internal hosts, root redirects to /admin/login. */}
            <Route path="/" element={<RootRoute />} />
            <Route path="/preview/:slug" element={<Landing />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/preview/:slug/blog" element={<Blog />} />
            <Route path="/preview/:slug/blog/:postSlug" element={<BlogPost />} />

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
              <Route path="blog" element={<AdminBlogList />} />
              <Route path="countries/:id" element={<AdminCountryEdit />} />
            </Route>
            <Route
              path="/admin/blog/:id"
              element={
                <Protected>
                  <AdminBlogEditor />
                </Protected>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;
