
import { BlogPostList } from '@/components/blog/BlogPostList';

export default function Resources() {
  return (
    <div className="container mx-auto p-6">
      <BlogPostList 
        contentType="Ressource" 
        title="Ressources" 
        description="Découvrez nos ressources et guides pratiques"
      />
    </div>
  );
}
