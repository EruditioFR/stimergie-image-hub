
import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const heroImages = [
  'https://images.unsplash.com/photo-1649972904349-6e44c42644a7',
  'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b',
  'https://images.unsplash.com/photo-1518770660439-4636190af475'
];

export function Hero() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % heroImages.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle search submission
    console.log('Search query:', searchInput);
    // Navigate to search results page
  };

  return (
    <div className="relative h-[75vh] min-h-[600px] w-full overflow-hidden">
      {/* Background Images */}
      {heroImages.map((image, index) => (
        <div
          key={index}
          className={cn(
            "absolute inset-0 transition-opacity duration-1000 ease-in-out bg-cover bg-center",
            index === activeIndex ? "opacity-100" : "opacity-0"
          )}
          style={{ backgroundImage: `url(${image}?auto=format&fit=crop&w=2000&q=80)` }}
        />
      ))}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center items-center text-center text-white px-6">
        <div className="animate-fade-up opacity-0" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight max-w-4xl mx-auto mb-4">
            Découvrez des images exceptionnelles pour votre créativité
          </h1>
        </div>
        
        <div className="animate-fade-up opacity-0" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-8">
            Explorez notre collection d'images de haute qualité pour tous vos projets
          </p>
        </div>

        <div className="w-full max-w-xl mx-auto animate-fade-up opacity-0" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Recherchez des images..."
                className="w-full h-14 pl-12 pr-32 rounded-full text-foreground bg-white/90 backdrop-blur-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full h-10 px-6"
              >
                Rechercher
              </Button>
            </div>
          </form>
        </div>

        <div className="mt-10 animate-fade-up opacity-0" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
          <div className="flex flex-wrap justify-center gap-2 text-sm">
            <span className="text-white/60">Suggestions populaires:</span>
            <Button variant="link" className="text-white p-0 h-auto">Nature</Button>
            <span className="text-white/60">•</span>
            <Button variant="link" className="text-white p-0 h-auto">Architecture</Button>
            <span className="text-white/60">•</span>
            <Button variant="link" className="text-white p-0 h-auto">Personnes</Button>
            <span className="text-white/60">•</span>
            <Button variant="link" className="text-white p-0 h-auto">Technologie</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Hero;
