
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { debounce } from '@/lib/utils';
import { fetchProjectIdsForClient } from '@/services/gallery/projectUtils';

export function useAutocomplete(query: string, userRole?: string, userClientId?: string | null) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async (searchQuery: string) => {
      if (!searchQuery || searchQuery.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);

      try {
        // Pour les utilisateurs avec le rôle "user", filtrer par leur client
        const isUserRole = userRole === 'user' && userClientId;
        let projectIds: string[] | null = null;
        
        if (isUserRole) {
          projectIds = await fetchProjectIdsForClient(userClientId);
          if (!projectIds || projectIds.length === 0) {
            setSuggestions([]);
            return;
          }
        }

        // Construction des requêtes avec filtres par projet si nécessaire
        let titleQuery = supabase
          .from('images')
          .select('title')
          .ilike('title', `%${searchQuery}%`)
          .limit(5);
          
        let tagQuery = supabase
          .from('images')
          .select('tags')
          .ilike('tags', `%${searchQuery}%`)
          .limit(10);

        // Appliquer le filtre par projet pour les users
        if (isUserRole && projectIds) {
          titleQuery = titleQuery.in('id_projet', projectIds);
          tagQuery = tagQuery.in('id_projet', projectIds);
        }

        // Exécuter les requêtes
        const { data: titleData, error: titleError } = await titleQuery;
        const { data: tagData, error: tagError } = await tagQuery;

        if (titleError) {
          console.error('Error fetching title suggestions:', titleError);
          return;
        }

        if (tagError) {
          console.error('Error fetching tag suggestions:', tagError);
          return;
        }

        // Process title suggestions
        const titleSuggestions = titleData?.map(item => item.title) || [];

        // Process tag suggestions
        const tagSuggestions: string[] = [];
        tagData.forEach(item => {
          if (typeof item.tags === 'string') {
            try {
              // Try to parse JSON tags
              const parsedTags = JSON.parse(item.tags);
              if (Array.isArray(parsedTags)) {
                parsedTags.forEach(tag => {
                  if (typeof tag === 'string' && 
                      tag.toLowerCase().includes(searchQuery.toLowerCase()) && 
                      !tagSuggestions.includes(tag)) {
                    tagSuggestions.push(tag);
                  }
                });
              }
            } catch (e) {
              // If not JSON, try splitting by comma
              const tags = item.tags.split(',').map(t => t.trim());
              tags.forEach(tag => {
                if (tag.toLowerCase().includes(searchQuery.toLowerCase()) && 
                    !tagSuggestions.includes(tag)) {
                  tagSuggestions.push(tag);
                }
              });
            }
          }
        });

        // Combine and deduplicate suggestions
        const allSuggestions = [...new Set([...titleSuggestions, ...tagSuggestions])];
        
        // Sort by relevance (starts with search query first)
        allSuggestions.sort((a, b) => {
          const aStartsWith = a.toLowerCase().startsWith(searchQuery.toLowerCase());
          const bStartsWith = b.toLowerCase().startsWith(searchQuery.toLowerCase());
          
          if (aStartsWith && !bStartsWith) return -1;
          if (!aStartsWith && bStartsWith) return 1;
          return a.localeCompare(b);
        });

        setSuggestions(allSuggestions.slice(0, 10)); // Limit to 10 suggestions
      } catch (error) {
        console.error('Error in autocomplete:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce the search to avoid too many requests
    const debouncedFetch = debounce(fetchSuggestions, 300);

    if (query.trim().length >= 2) {
      debouncedFetch(query);
    } else {
      setSuggestions([]);
    }

    return () => {
      // Clean up
    };
  }, [query, userRole, userClientId]);

  return { suggestions, isLoading };
}
