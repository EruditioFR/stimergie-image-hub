import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Index from './pages/Index';
import Ensemble from './pages/Ensemble';
import Gallery from './pages/Gallery';
import ImageView from './pages/ImageView';
import Images from './pages/Images';
import { AuthProvider } from './context/AuthContext';
import { ImageProvider } from './context/ImageContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoadingScreen } from './components/ui/LoadingScreen';
import Projects from './pages/Projects';
import Clients from './pages/Clients';
import Users from './pages/Users';
import NotFound from './pages/NotFound';
import Resources from './pages/Resources';
import Downloads from './pages/Downloads';
import BlogEditor from './pages/BlogEditor';
import BlogPost from './pages/BlogPost';
import ResetPassword from './pages/ResetPassword';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import SharedAlbum from './pages/SharedAlbum';
import './App.css';

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ImageProvider>
          <Router>
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/" element={<Index />} />
                <Route path="/ensemble/:ensembleId" element={<Ensemble />} />
                <Route path="/gallery/:ensembleId" element={<Gallery />} />
                <Route path="/shared/:albumId" element={<SharedAlbum />} />
                <Route path="/image/:imageId" element={<ImageView />} />

                <Route path="/blog/:blogId" element={<BlogPost />} />

                <Route path="/downloads" element={
                  <ProtectedRoute>
                    <Downloads />
                  </ProtectedRoute>
                } />

                <Route path="/images" element={
                  <ProtectedRoute>
                    <Images />
                  </ProtectedRoute>
                } />

                <Route path="/projects" element={
                  <ProtectedRoute>
                    <Projects />
                  </ProtectedRoute>
                } />

                <Route path="/clients" element={
                  <ProtectedRoute>
                    <Clients />
                  </ProtectedRoute>
                } />

                <Route path="/users" element={
                  <ProtectedRoute>
                    <Users />
                  </ProtectedRoute>
                } />

                <Route path="/resources" element={
                  <ProtectedRoute>
                    <Resources />
                  </ProtectedRoute>
                } />

                <Route path="/blog-editor" element={
                  <ProtectedRoute>
                    <BlogEditor />
                  </ProtectedRoute>
                } />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </Router>
        </ImageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
