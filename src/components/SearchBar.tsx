
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  className?: string;
  variant?: 'default' | 'minimal';
}

export function SearchBar({ className, variant = 'default' }: SearchBarProps) {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Synchronize with URL parameters when component mounts
  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/gallery?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      // If search is empty, remove query parameter
      navigate('/gallery');
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    navigate('/gallery');
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className={cn(
        "relative w-full max-w-xl",
        className
      )}
    >
      <div className="relative">
        <Search className={cn(
          "absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground",
          variant === 'default' ? "h-5 w-5" : "h-4 w-4"
        )} />
        
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Recherchez des images..."
          className={cn(
            "w-full pr-10 pl-10 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50",
            variant === 'default' 
              ? "py-3 text-base bg-background shadow-sm border border-border" 
              : "py-2 text-sm bg-muted"
          )}
        />
        
        {searchQuery && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-12 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className={variant === 'default' ? "h-5 w-5" : "h-4 w-4"} />
            <span className="sr-only">Effacer la recherche</span>
          </button>
        )}
        
        <Button
          type="submit"
          size={variant === 'default' ? 'default' : 'sm'}
          className={cn(
            "absolute right-0 top-1/2 transform -translate-y-1/2 rounded-full",
            variant === 'default' ? "mr-1.5" : "mr-1"
          )}
        >
          {variant === 'default' ? 'Rechercher' : <Search className="h-4 w-4" />}
        </Button>
      </div>
    </form>
  );
}

export default SearchBar;
