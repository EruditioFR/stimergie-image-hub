
import { BlogPostList } from '@/components/blog/BlogPostList';

export default function Ensemble() {
  return (
    <div className="container mx-auto p-6">
      <BlogPostList 
        contentType="Ensemble" 
        title="Ensemble" 
        description="Découvrez nos dernières actualités et collaborations"
      />
    </div>
  );
}
