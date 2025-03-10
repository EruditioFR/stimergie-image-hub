
import { createContext, useContext, useState, ReactNode } from 'react';

// Mock data for initial state
const initialImages = [
  {
    id: '1',
    src: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=800&q=80',
    alt: 'A woman sitting on a bed using a laptop',
    title: 'Travail à distance',
    author: 'Anna Johnson',
    tags: ['travail', 'technologie', 'lifestyle']
  },
  {
    id: '2',
    src: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=80',
    alt: 'Turned on gray laptop computer',
    title: 'Technologie moderne',
    author: 'Michael Chen',
    tags: ['technologie', 'informatique']
  },
  {
    id: '3',
    src: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    alt: 'Macro photography of black circuit board',
    title: 'Circuit imprimé',
    author: 'Sarah Williams',
    tags: ['technologie', 'informatique', 'électronique']
  },
  {
    id: '4',
    src: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=800&q=80',
    alt: 'Monitor showing Java programming',
    title: 'Code informatique',
    author: 'Alex Developer',
    tags: ['code', 'développement', 'informatique']
  },
  {
    id: '5',
    src: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=800&q=80',
    alt: 'Person using MacBook Pro',
    title: 'Espace de travail',
    author: 'Jessica Miller',
    tags: ['travail', 'bureau', 'productivité']
  },
  {
    id: '6',
    src: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
    alt: 'Woman using black laptop computer',
    title: 'Travail créatif',
    author: 'Thomas Creative',
    tags: ['travail', 'créativité', 'design']
  }
];

interface Image {
  id: string;
  src: string;
  alt: string;
  title: string;
  author: string;
  tags: string[];
}

interface ImageContextType {
  images: Image[];
  featuredImages: Image[];
  searchImages: (query: string) => Image[];
  getImageById: (id: string) => Image | undefined;
  getImagesByTag: (tag: string) => Image[];
}

const ImageContext = createContext<ImageContextType | null>(null);

export function ImageProvider({ children }: { children: ReactNode }) {
  const [images] = useState<Image[]>(initialImages);

  // Get featured images (could have different logic in a real app)
  const featuredImages = images.slice(0, 3);

  // Search images by query
  const searchImages = (query: string): Image[] => {
    const lowerCaseQuery = query.toLowerCase();
    return images.filter(
      image => 
        image.title.toLowerCase().includes(lowerCaseQuery) ||
        image.tags.some(tag => tag.toLowerCase().includes(lowerCaseQuery)) ||
        image.author.toLowerCase().includes(lowerCaseQuery)
    );
  };

  // Get image by ID
  const getImageById = (id: string): Image | undefined => {
    return images.find(image => image.id === id);
  };

  // Get images by tag
  const getImagesByTag = (tag: string): Image[] => {
    return images.filter(image => 
      image.tags.some(imageTag => imageTag.toLowerCase() === tag.toLowerCase())
    );
  };

  return (
    <ImageContext.Provider value={{
      images,
      featuredImages,
      searchImages,
      getImageById,
      getImagesByTag
    }}>
      {children}
    </ImageContext.Provider>
  );
}

export function useImages() {
  const context = useContext(ImageContext);
  if (!context) {
    throw new Error('useImages must be used within an ImageProvider');
  }
  return context;
}
