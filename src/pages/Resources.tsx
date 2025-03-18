
import { Header } from '@/components/ui/layout/Header';
import { BlogPostList } from '@/components/blog/BlogPostList';
import { Footer } from '@/components/ui/layout/Footer';
import { CacheDropboxImages } from '@/components/admin/CacheDropboxImages';
import { useAuth } from '@/context/AuthContext';

export default function Resources() {
  const { user, isAdmin } = useAuth();
  const hasAdminAccess = isAdmin();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-6 mt-16">
        {hasAdminAccess && (
          <div className="flex justify-end mb-4">
            <CacheDropboxImages />
          </div>
        )}
        <BlogPostList 
          contentType="Ressource" 
          title="Ressources" 
          description="Découvrez nos ressources et guides pratiques"
        />
      </main>
      <Footer />
    </div>
  );
}
