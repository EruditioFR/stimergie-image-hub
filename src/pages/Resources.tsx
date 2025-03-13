
import { Header } from '@/components/ui/layout/Header';
import { BlogPostList } from '@/components/blog/BlogPostList';

export default function Resources() {
  return (
    <>
      <Header />
      <div className="container mx-auto p-6 mt-16">
        <BlogPostList 
          contentType="Ressource" 
          title="Ressources" 
          description="Découvrez nos ressources et guides pratiques"
        />
      </div>
    </>
  );
}
