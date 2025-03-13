
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
import { Input } from "@/components/ui/input";
import { X, Search, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';

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
  
  // Multiple tags support
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchTag, setSearchTag] = useState('');
  const [filteredTags, setFilteredTags] = useState<string[]>([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  
  // Initialize selected tags from URL
  useEffect(() => {
    const tagsParam = searchParams.get('tags');
    if (tagsParam) {
      setSelectedTags(tagsParam.split(','));
    } else {
      setSelectedTags([]);
    }
  }, [searchParams]);
  
  // Filter available tags based on search input
  useEffect(() => {
    if (searchTag) {
      const filtered = availableTags.filter(
        tag => tag.toLowerCase().includes(searchTag.toLowerCase()) && 
        !selectedTags.includes(tag)
      );
      setFilteredTags(filtered);
      setShowTagDropdown(true);
    } else {
      setFilteredTags([]);
      setShowTagDropdown(false);
    }
  }, [searchTag, availableTags, selectedTags]);
  
  const handleTabChange = (value: string) => {
    // Convert category name to lowercase or 'all' for consistent filtering
    const normalizedValue = value.toLowerCase() === 'toutes' ? 'all' : value.toLowerCase();
    onTabChange(normalizedValue);
  };
  
  // Add a tag to the selection
  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      const newTags = [...selectedTags, tag];
      setSelectedTags(newTags);
      
      // Update URL
      searchParams.set('tags', newTags.join(','));
      setSearchParams(searchParams);
      
      // Clear search input
      setSearchTag('');
      setShowTagDropdown(false);
    }
  };
  
  // Remove a tag from the selection
  const removeTag = (tag: string) => {
    const newTags = selectedTags.filter(t => t !== tag);
    setSelectedTags(newTags);
    
    // Update URL
    if (newTags.length > 0) {
      searchParams.set('tags', newTags.join(','));
    } else {
      searchParams.delete('tags');
    }
    setSearchParams(searchParams);
  };
  
  // Clear all selected tags
  const clearTags = () => {
    setSelectedTags([]);
    searchParams.delete('tags');
    setSearchParams(searchParams);
  };
  
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
            <div className="w-full md:w-auto relative">
              <div className="flex items-center relative w-full md:w-[280px]">
                <Tag className="absolute left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTag}
                  onChange={(e) => setSearchTag(e.target.value)}
                  placeholder="Rechercher des mots-clés"
                  className="pl-10 pr-4"
                  onFocus={() => {
                    if (searchTag) setShowTagDropdown(true);
                  }}
                  onBlur={() => {
                    // Delay hiding to allow for click on dropdown items
                    setTimeout(() => setShowTagDropdown(false), 200);
                  }}
                />
                {searchTag && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 h-5 w-5 p-0"
                    onClick={() => setSearchTag('')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              
              {/* Dropdown for autocomplete */}
              {showTagDropdown && filteredTags.length > 0 && (
                <div className="absolute z-50 w-full mt-1 py-1 bg-popover rounded-md border shadow-md max-h-[200px] overflow-y-auto">
                  {filteredTags.map(tag => (
                    <div
                      key={tag}
                      className="px-3 py-2 text-sm hover:bg-accent cursor-pointer"
                      onMouseDown={() => addTag(tag)}
                    >
                      {tag}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Selected tags */}
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedTags.map(tag => (
                    <div 
                      key={tag}
                      className="flex items-center gap-1 bg-primary/10 text-primary text-xs rounded-full px-3 py-1"
                    >
                      <span>{tag}</span>
                      <X 
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeTag(tag)}
                      />
                    </div>
                  ))}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-6 px-2"
                    onClick={clearTags}
                  >
                    Effacer tout
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {isAdmin && (
            <ClientsFilter 
              selectedClient={selectedClient}
              onClientChange={onClientChange}
              className={cn(
                "w-full md:w-auto",
                selectedTags.length === 0 ? "md:ml-auto" : ""
              )}
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
