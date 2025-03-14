
import { Header } from '@/components/ui/layout/Header';
import { BlogPostList } from '@/components/blog/BlogPostList';
import { Footer } from '@/components/ui/layout/Footer';

export default function Resources() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-6 mt-16">
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
