
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/ui/layout/Header';
import { Footer } from '@/components/ui/layout/Footer';
import ImageDetail from '@/components/ImageDetail';
import { useImages } from '@/context/ImageContext';

const ImageView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { images } = useImages();
  
  // Vérifier si l'image existe
  const imageExists = images.some(img => img.id === id);
  
  // Rediriger vers la galerie si l'image n'existe pas
  useEffect(() => {
    if (id && !imageExists && images.length > 0) {
      console.log(`Image avec ID ${id} non trouvée dans la liste de ${images.length} images`);
    }
  }, [id, images, imageExists]);
  
  // Scroll to top when navigating to this page
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <ImageDetail />
      </main>
      
      <Footer />
    </div>
  );
};

export default ImageView;
