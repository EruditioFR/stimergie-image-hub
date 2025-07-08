
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAutocomplete } from '@/hooks/useAutocomplete';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SearchBarProps {
  className?: string;
  variant?: 'default' | 'minimal';
}

export function SearchBar({ className, variant = 'default' }: SearchBarProps) {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();
  const suggestionRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { userRole, user } = useAuth();
  const [userClientId, setUserClientId] = useState<string | null>(null);
  
  // Récupérer l'ID client pour les utilisateurs avec le rôle "user"
  useEffect(() => {
    const getUserClientId = async () => {
      if (userRole === 'user' && user) {
        try {
          const { data, error } = await supabase.rpc('get_user_client_id', {
            user_id: user.id
          });
          
          if (error) {
            console.error('Error fetching user client ID:', error);
            return;
          }
          
          if (data) {
            setUserClientId(data);
          }
        } catch (error) {
          console.error('Error fetching user client ID:', error);
        }
      }
    };
    
    getUserClientId();
  }, [userRole, user]);

  // Get search suggestions based on input
  const { suggestions, isLoading } = useAutocomplete(searchQuery, userRole, userClientId);

  // Synchronize with URL parameters when component mounts
  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/gallery?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      // If search is empty, remove query parameter
      navigate('/gallery');
    }
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    navigate('/gallery');
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    navigate(`/gallery?q=${encodeURIComponent(suggestion)}`);
    setShowSuggestions(false);
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
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (e.target.value.trim().length > 0) {
              setShowSuggestions(true);
            } else {
              setShowSuggestions(false);
            }
          }}
          onFocus={() => {
            if (searchQuery.trim().length > 0) {
              setShowSuggestions(true);
            }
          }}
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

      {/* Autocomplete suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionRef}
          className="absolute z-10 w-full mt-1 bg-background shadow-lg rounded-md border border-border max-h-60 overflow-y-auto"
        >
          {isLoading ? (
            <div className="p-2 text-sm text-muted-foreground">Chargement...</div>
          ) : (
            <ul>
              {suggestions.map((suggestion, index) => (
                <li 
                  key={index}
                  className="px-4 py-2 text-sm hover:bg-muted cursor-pointer"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </form>
  );
}

export default SearchBar;
