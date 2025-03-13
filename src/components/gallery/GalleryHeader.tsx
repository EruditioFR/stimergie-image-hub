
import { SearchBar } from '@/components/SearchBar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClientsFilter } from './ClientsFilter';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSearchParams } from 'react-router-dom';

interface GalleryHeaderProps {
  title: string;
  activeTab: string;
  onTabChange: (value: string) => void;
  categories: string[];
  selectedClient: string | null;
  onClientChange: (clientId: string | null) => void;
  userName?: string;
  userLastName?: string;
  availableTags?: string[];
}

export function GalleryHeader({ 
  title, 
  activeTab, 
  onTabChange, 
  categories,
  selectedClient,
  onClientChange,
  userName = "",
  userLastName = "",
  availableTags = []
}: GalleryHeaderProps) {
  const { userRole } = useAuth();
  const isAdmin = ['admin', 'admin_client'].includes(userRole);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTag, setSelectedTag] = useState<string>(searchParams.get('tag') || '');
  
  const handleTabChange = (value: string) => {
    // Convert category name to lowercase or 'all' for consistent filtering
    const normalizedValue = value.toLowerCase() === 'toutes' ? 'all' : value.toLowerCase();
    onTabChange(normalizedValue);
  };

  // Update URL when tag changes
  const handleTagChange = (tag: string) => {
    setSelectedTag(tag);
    
    // Update URL search params
    if (tag) {
      searchParams.set('tag', tag);
    } else {
      searchParams.delete('tag');
    }
    setSearchParams(searchParams);
  };
  
  // When URL changes externally, update the local state
  useEffect(() => {
    const tagParam = searchParams.get('tag');
    if (tagParam !== selectedTag) {
      setSelectedTag(tagParam || '');
    }
  }, [searchParams]);
  
  return (
    <div className="bg-muted/30 border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-6">{title}</h1>
          
          {title === "Banque d'images" && (
            <p className="text-muted-foreground max-w-3xl mx-auto">
              Bonjour {userName} {userLastName},
              <br /><br />
              Cette galerie vous propose l'ensemble des photos créées par Imprononçable pour vos projets. 
              Vous pouvez les filtrer par catégorie, par type de droits, puis les prévisualiser et les télécharger.
            </p>
          )}
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
          <SearchBar className="md:max-w-sm" variant="minimal" />
          
          {availableTags.length > 0 && (
            <Select 
              value={selectedTag} 
              onValueChange={handleTagChange}
              defaultValue=""
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filtrer par mot-clé" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="">Tous les mots-clés</SelectItem>
                  {availableTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
          
          {isAdmin && (
            <ClientsFilter 
              selectedClient={selectedClient}
              onClientChange={onClientChange}
              className="w-full md:w-auto md:ml-auto"
            />
          )}
        </div>
        
        {/* Category Tabs */}
        <Tabs 
          defaultValue={activeTab} 
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="w-full max-w-full overflow-x-auto flex-wrap sm:flex-nowrap no-scrollbar py-1">
            <TabsTrigger value="all" className="flex-shrink-0">
              Toutes
            </TabsTrigger>
            {categories.slice(1).map(category => (
              <TabsTrigger 
                key={category} 
                value={category.toLowerCase()}
                className="flex-shrink-0"
              >
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
