
import { Header } from '@/components/ui/layout/Header';
import { BlogPostList } from '@/components/blog/BlogPostList';

export default function Ensemble() {
  return (
    <>
      <Header />
      <div className="container mx-auto p-6 mt-16">
        <BlogPostList 
          contentType="Ensemble" 
          title="Ensemble" 
          description="Découvrez nos dernières actualités et collaborations"
        />
      </div>
    </>
  );
}
