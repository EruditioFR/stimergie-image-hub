
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Hero } from '@/components/Hero';
import { Header } from '@/components/ui/layout/Header';
import { Footer } from '@/components/ui/layout/Footer';
import { ImageGallery } from '@/components/ImageGallery';
import { Button } from '@/components/ui/button';
import { useImages } from '@/context/ImageContext';

const Index = () => {
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <Hero />
        
        {/* Featured Images Section */}
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <ImageGallery 
              title="Images en vedette" 
              subtitle="Découvrez notre sélection d'images exceptionnelles"
              limit={6}
              className="animate-fade-up"
            />
            
            <div className="mt-12 text-center">
              <Link to="/gallery">
                <Button size="lg" className="px-8">
                  Explorer toute la galerie
                </Button>
              </Link>
            </div>
          </div>
        </section>
        
        {/* Categories Section */}
        <section className="py-20 px-6 bg-muted/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3">Parcourir par catégorie</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Explorez notre collection d'images par thématique pour trouver exactement ce que vous cherchez
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category, index) => (
                <Link 
                  key={category.name} 
                  to={`/gallery?tag=${category.tag}`}
                  className="group relative h-60 rounded-xl overflow-hidden shadow-md animate-fade-up"
                  style={{ 
                    animationDelay: `${0.1 * index}s`, 
                    animationFillMode: 'forwards' 
                  }}
                >
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                    style={{ backgroundImage: `url(${category.image})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
                  <div className="absolute bottom-0 left-0 p-6">
                    <h3 className="text-xl font-semibold text-white mb-1">{category.name}</h3>
                    <p className="text-white/80 text-sm">{category.count} images</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
        
        {/* Call to Action */}
        <section className="py-24 px-6 relative overflow-hidden">
          <div 
            className="absolute inset-0 -z-10 opacity-10"
            style={{ 
              backgroundImage: 'url(https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=2000&q=80)', 
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(8px)'
            }}
          />
          
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              Rejoignez-nous
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Découvrez, téléchargez et partagez des images exceptionnelles
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Explorez notre vaste collection d'images gratuites de haute qualité pour tous vos projets
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8">
                Créer un compte
              </Button>
              <Button size="lg" variant="outline" className="px-8">
                En savoir plus
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

// Mock categories data
const categories = [
  {
    name: 'Nature',
    tag: 'nature',
    count: 1240,
    image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Technologie',
    tag: 'technologie',
    count: 867,
    image: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Architecture',
    tag: 'architecture',
    count: 742,
    image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Personnes',
    tag: 'personnes',
    count: 1354,
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Animaux',
    tag: 'animaux',
    count: 631,
    image: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Voyage',
    tag: 'voyage',
    count: 945,
    image: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=800&q=80'
  }
];

export default Index;
