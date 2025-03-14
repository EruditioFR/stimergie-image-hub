
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ImageProvider } from "@/context/ImageContext";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "@/pages/Index";
import Gallery from "@/pages/Gallery";
import ImageView from "@/pages/ImageView";
import NotFound from "@/pages/NotFound";
import Clients from "@/pages/Clients";
import Projects from "@/pages/Projects";
import Users from "@/pages/Users";
import Auth from "@/pages/Auth";
import Images from "@/pages/Images";
import SharedAlbum from "@/pages/SharedAlbum";
import Resources from "@/pages/Resources";
import Ensemble from "@/pages/Ensemble";
import BlogEditor from "@/pages/BlogEditor";
import BlogPost from "@/pages/BlogPost";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ImageProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/image/:id" element={<ImageView />} />
              <Route path="/shared-album/:shareKey" element={<SharedAlbum />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/ensemble" element={<Ensemble />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route 
                path="/blog/new" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'admin_client']}>
                    <BlogEditor />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/blog/edit/:id" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'admin_client']}>
                    <BlogEditor />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/images" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'admin_client']}>
                    <Images />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/clients" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Clients />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/projects" 
                element={
                  <ProtectedRoute>
                    <Projects />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/users" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'admin_client']}>
                    <Users />
                  </ProtectedRoute>
                } 
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ImageProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
