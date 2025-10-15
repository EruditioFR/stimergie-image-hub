import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ImageProvider } from "@/context/ImageContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { unifiedCacheManager } from "@/lib/cache/UnifiedCacheManager";
import Index from "./pages/Index";
import Gallery from "./pages/Gallery";
import Auth from "./pages/Auth";
import Images from "./pages/Images";
import Clients from "./pages/Clients";
import Projects from "./pages/Projects";
import Users from "./pages/Users";
import AccessPeriods from "./pages/AccessPeriods";
import Downloads from "./pages/Downloads";
import NotFound from "./pages/NotFound";
import ImageView from "./pages/ImageView";
import SharedAlbum from "./pages/SharedAlbum";
import Ensemble from "./pages/Ensemble";
import BlogPost from "./pages/BlogPost";
import BlogEditor from "./pages/BlogEditor";
import Resources from "./pages/Resources";
import ResetPassword from "./pages/ResetPassword";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Licenses from "./pages/Licenses";
import About from "./pages/About";
import Profile from "./pages/Profile";

// Use the unified cache system
const queryClient = unifiedCacheManager.getQueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ImageProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/resources" element={<Resources />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/licenses" element={<Licenses />} />
                <Route path="/about" element={<About />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/shared-album/:albumKey" element={<SharedAlbum />} />
                <Route path="/shared-album/:shareKey" element={<SharedAlbum />} />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/gallery" element={
                  <ProtectedRoute>
                    <Gallery />
                  </ProtectedRoute>
                } />
                <Route path="/images/:id" element={
                  <ProtectedRoute>
                    <ImageView />
                  </ProtectedRoute>
                } />
                <Route path="/images" element={
                  <ProtectedRoute allowedRoles={['admin', 'admin_client', 'user']}>
                    <Images />
                  </ProtectedRoute>
                } />
                <Route path="/clients" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Clients />
                  </ProtectedRoute>
                } />
                <Route path="/projects" element={
                  <ProtectedRoute>
                    <Projects />
                  </ProtectedRoute>
                } />
                <Route path="/users" element={
                  <ProtectedRoute allowedRoles={['admin', 'admin_client']}>
                    <Users />
                  </ProtectedRoute>
                } />
                <Route path="/access-periods" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AccessPeriods />
                  </ProtectedRoute>
                } />
                <Route path="/downloads" element={
                  <ProtectedRoute>
                    <Downloads />
                  </ProtectedRoute>
                } />
                <Route path="/ensemble" element={
                  <ProtectedRoute>
                    <Ensemble />
                  </ProtectedRoute>
                } />
                <Route path="/blog-editor" element={
                  <ProtectedRoute allowedRoles={['admin', 'admin_client']}>
                    <BlogEditor />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ImageProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
