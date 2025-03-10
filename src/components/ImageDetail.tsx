
import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Download, Heart, Share2, ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LazyImage } from '@/components/LazyImage';
import { ImageGallery } from '@/components/ImageGallery';

// Mock data
const mockImageDetails = {
  id: '1',
  src: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=1920&q=80',
  alt: 'A woman sitting on a bed using a laptop',
  title: 'Travail à distance',
  author: 'Anna Johnson',
  authorAvatar: 'https://images.unsplash.com/profile-1649972904349-6e44c42644a7?auto=format&fit=crop&w=150&h=150&q=80',
  description: 'Une femme travaillant depuis son domicile sur son ordinateur portable, représentant le nouveau mode de travail moderne et flexible.',
  date: '15 juin 2023',
  tags: ['travail', 'technologie', 'lifestyle', 'remote'],
  downloads: 1250,
  likes: 432,
  views: 5643
};

export function ImageDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [imageDetails, setImageDetails] = useState(mockImageDetails);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // In a real app, you would fetch the image details based on the id
  
  const handleDownload = () => {
    // Logic to download the image
    window.open(imageDetails.src, '_blank');
  };

  const handleLike = () => {
    setLiked(!liked);
    // Update like count logic would go here
  };

  const handleShare = () => {
    // Share logic would go here
    navigator.clipboard.writeText(window.location.href);
    // Would show a toast notification in a real app
    alert('Lien copié dans le presse-papier');
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const goBack = () => {
    navigate(-1);
  };

  return (
    <>
      {/* Fullscreen Image View */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center animate-fade-in">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-4 right-4 text-foreground z-10"
            onClick={toggleFullscreen}
          >
            <X className="h-6 w-6" />
          </Button>
          <div className="w-full h-full p-4 md:p-8 flex items-center justify-center">
            <img 
              src={imageDetails.src} 
              alt={imageDetails.alt} 
              className="max-w-full max-h-full object-contain animate-fade-in" 
            />
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-12 animate-fade-up">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          className="mb-6 pl-0 text-muted-foreground"
          onClick={goBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Main Image Section */}
          <div className="lg:col-span-3 space-y-6">
            <div 
              className="rounded-xl overflow-hidden cursor-zoom-in shadow-lg bg-card"
              onClick={toggleFullscreen}
            >
              <LazyImage 
                src={imageDetails.src} 
                alt={imageDetails.alt} 
                className="w-full aspect-auto"
                aspectRatio="aspect-auto"
              />
            </div>

            {/* Mobile Action Buttons */}
            <div className="flex lg:hidden justify-between items-center">
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-2"
                  onClick={handleLike}
                >
                  <Heart className={`h-4 w-4 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
                  <span>{liked ? imageDetails.likes + 1 : imageDetails.likes}</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-2"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4" />
                  <span>Partager</span>
                </Button>
              </div>
              <Button
                onClick={handleDownload}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                <span>Télécharger</span>
              </Button>
            </div>

            {/* Image Information */}
            <div className="bg-card rounded-xl p-6 shadow-sm">
              <h1 className="text-2xl font-bold mb-2">{imageDetails.title}</h1>
              <p className="text-muted-foreground mb-6">{imageDetails.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {imageDetails.tags.map(tag => (
                  <Link 
                    key={tag} 
                    to={`/gallery?tag=${tag}`}
                    className="py-1 px-3 text-xs rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
              
              <div className="flex flex-wrap gap-x-8 gap-y-4 text-sm text-muted-foreground">
                <div>
                  <span className="block text-foreground font-medium">Date ajoutée</span>
                  <span>{imageDetails.date}</span>
                </div>
                <div>
                  <span className="block text-foreground font-medium">Vues</span>
                  <span>{imageDetails.views}</span>
                </div>
                <div>
                  <span className="block text-foreground font-medium">Téléchargements</span>
                  <span>{imageDetails.downloads}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar with Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Author Information */}
            <div className="bg-card rounded-xl p-6 shadow-sm">
              <div className="flex items-center space-x-4 mb-4">
                <img 
                  src={imageDetails.authorAvatar} 
                  alt={imageDetails.author}
                  className="w-12 h-12 rounded-full object-cover" 
                />
                <div>
                  <h3 className="font-medium">{imageDetails.author}</h3>
                  <p className="text-sm text-muted-foreground">Photographe</p>
                </div>
              </div>
              <Button variant="outline" className="w-full">Voir le profil</Button>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden lg:block bg-card rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="font-medium mb-4">Actions</h3>
              
              <Button 
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                <span>Télécharger</span>
              </Button>
              
              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  className="flex-1 flex items-center justify-center gap-2"
                  onClick={handleLike}
                >
                  <Heart className={`h-4 w-4 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
                  <span>{liked ? 'Aimé' : 'J\'aime'}</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 flex items-center justify-center gap-2"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4" />
                  <span>Partager</span>
                </Button>
              </div>
            </div>

            {/* License Information */}
            <div className="bg-card rounded-xl p-6 shadow-sm">
              <h3 className="font-medium mb-4">Informations de licence</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Cette image est disponible sous licence gratuite pour usage personnel et commercial.
              </p>
              <Link to="/licenses" className="text-sm text-primary hover:underline">
                En savoir plus sur nos licences
              </Link>
            </div>
          </div>
        </div>

        {/* Related Images */}
        <div className="mt-20">
          <ImageGallery 
            title="Images similaires" 
            subtitle="Découvrez d'autres images qui pourraient vous intéresser"
            limit={3}
          />
        </div>
      </div>
    </>
  );
}

export default ImageDetail;
