
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useAutocomplete(query: string, userRole: string, userClientId: string | null) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!query || query.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      
      try {
        let baseQuery = supabase
          .from('images')
          .select('title, tags');

        // Apply user role restrictions
        if (['admin_client', 'user'].includes(userRole) && userClientId) {
          // Get projects for this client first
          const { data: projects } = await supabase
            .from('projets')
            .select('id')
            .eq('id_client', userClientId);
          
          if (projects && projects.length > 0) {
            const projectIds = projects.map(p => p.id);
            baseQuery = baseQuery.in('id_projet', projectIds);
          } else {
            // No projects found, return empty suggestions
            setSuggestions([]);
            setIsLoading(false);
            return;
          }
        }

        const { data: images, error } = await baseQuery.limit(100);

        if (error) {
          console.error('Error fetching autocomplete suggestions:', error);
          setSuggestions([]);
          return;
        }

        const allSuggestions = new Set<string>();
        
        if (images) {
          images.forEach((image) => {
            // Add title suggestions (if title contains the query)
            if (image.title && image.title.toLowerCase().includes(query.toLowerCase())) {
              allSuggestions.add(image.title);
            }
            
            // Add tag suggestions
            if (image.tags) {
              const tags = typeof image.tags === 'string' 
                ? image.tags.split(',').map(tag => tag.trim()) 
                : image.tags;
              
              if (Array.isArray(tags)) {
                tags.forEach(tag => {
                  if (tag.toLowerCase().includes(query.toLowerCase())) {
                    allSuggestions.add(tag);
                  }
                });
              }
            }
          });
        }

        // Convert to array and sort by relevance (starts with query first)
        const sortedSuggestions = Array.from(allSuggestions)
          .filter(suggestion => suggestion.toLowerCase().includes(query.toLowerCase()))
          .sort((a, b) => {
            const aStartsWith = a.toLowerCase().startsWith(query.toLowerCase());
            const bStartsWith = b.toLowerCase().startsWith(query.toLowerCase());
            
            if (aStartsWith && !bStartsWith) return -1;
            if (!aStartsWith && bStartsWith) return 1;
            return a.localeCompare(b);
          })
          .slice(0, 10); // Limit to 10 suggestions

        setSuggestions(sortedSuggestions);
      } catch (error) {
        console.error('Error in autocomplete:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [query, userRole, userClientId]);

  return { suggestions, isLoading };
}
