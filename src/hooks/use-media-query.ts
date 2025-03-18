
import { useState, useEffect } from 'react';

/**
 * Hook pour détecter les media queries
 * 
 * @param query La requête media à évaluer
 * @returns Booléen indiquant si la requête média correspond
 */
export function useMediaQuery(query: string): boolean {
  // État initial basé sur une correspondance lors du premier rendu
  const getMatches = (): boolean => {
    // Éviter les erreurs de SSR en vérifiant si window existe
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  };

  const [matches, setMatches] = useState<boolean>(getMatches());

  useEffect(() => {
    // Définir le gestionnaire de changement de correspondance
    const handleChange = () => {
      setMatches(getMatches());
    };
    
    // Créer un MediaQueryList avec la requête
    const mediaQuery = window.matchMedia(query);
    
    // Définir un rappel initial
    handleChange();
    
    // Ajouter un écouteur
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Compatibilité avec les anciens navigateurs
      mediaQuery.addListener(handleChange);
    }
    
    // Nettoyer l'écouteur
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // Compatibilité avec les anciens navigateurs
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [query]);

  return matches;
}
