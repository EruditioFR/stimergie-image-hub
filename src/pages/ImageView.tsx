
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Header } from '@/components/ui/layout/Header';
import { Footer } from '@/components/ui/layout/Footer';
import { ImageDetail } from '@/components/ImageDetail';
import { UserGreetingBar } from '@/components/ui/UserGreetingBar';

const ImageView = () => {
  const { id } = useParams<{ id: string }>();
  
  // Scroll to top when navigating to this page
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  return (
    <div className="min-h-screen flex flex-col">
      <UserGreetingBar />
      <Header />
      
      <main className="flex-grow">
        <ImageDetail />
      </main>
      
      <Footer />
    </div>
  );
}

export default ImageView;
