
import { Header } from '@/components/ui/layout/Header';
import { BlogPostView } from '@/components/blog/BlogPostView';

export default function BlogPost() {
  return (
    <>
      <Header />
      <div className="mt-16">
        <BlogPostView />
      </div>
    </>
  );
}
