
import { Header } from '@/components/ui/layout/Header';
import { BlogPostView } from '@/components/blog/BlogPostView';

export default function BlogPost() {
  return (
    <>
      <Header />
      <div>
        <BlogPostView />
      </div>
    </>
  );
}
