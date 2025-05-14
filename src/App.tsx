
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Index from './pages/Index';
import Resources from './pages/Resources';
import Gallery from './pages/Gallery';
import Auth from './pages/Auth';
import NotFound from './pages/NotFound';
import { AuthProvider } from './context/AuthContext';
import { ImageProvider } from './context/ImageContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoadingScreen from './components/ui/LoadingScreen';
import Projects from './pages/Projects';
import Clients from './pages/Clients';
import Users from './pages/Users';
import Images from './pages/Images';
import Downloads from './pages/Downloads';
import Ensemble from './pages/Ensemble';
import BlogEditor from './pages/BlogEditor';
import BlogPost from './pages/BlogPost';
import ResetPassword from './pages/ResetPassword';
import ProtectedRoute from './components/auth/ProtectedRoute';
import SharedAlbum from './pages/SharedAlbum';
import './App.css';

// Initialize the query client with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,  // 10 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate app initialization
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ImageProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/images" element={<Images />} />
              <Route path="/downloads" element={<Downloads />} />
              <Route path="/album/:shareKey" element={<SharedAlbum />} />
              <Route path="/ensemble" element={<Ensemble />} />
              
              <Route path="/blog/edit/:id" element={
                <ProtectedRoute allowedRoles={['admin', 'admin_client']}>
                  <BlogEditor />
                </ProtectedRoute>
              } />
              <Route path="/blog/new" element={
                <ProtectedRoute allowedRoles={['admin', 'admin_client']}>
                  <BlogEditor />
                </ProtectedRoute>
              } />
              <Route path="/blog/:slug" element={<BlogPost />} />
              
              <Route path="/projects" element={
                <ProtectedRoute allowedRoles={['admin', 'admin_client']}>
                  <Projects />
                </ProtectedRoute>
              } />
              <Route path="/clients" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Clients />
                </ProtectedRoute>
              } />
              <Route path="/users" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Users />
                </ProtectedRoute>
              } />
              
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" />} />
            </Routes>
          </Router>
        </ImageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
