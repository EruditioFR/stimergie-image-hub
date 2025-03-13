
import { SearchBar } from '@/components/SearchBar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface GalleryHeaderProps {
  title: string;
  activeTab: string;
  onTabChange: (value: string) => void;
  categories: string[];
}

export function GalleryHeader({ 
  title, 
  activeTab, 
  onTabChange, 
  categories 
}: GalleryHeaderProps) {
  const handleTabChange = (value: string) => {
    // Convert category name to lowercase or 'all' for consistent filtering
    const normalizedValue = value.toLowerCase() === 'toutes' ? 'all' : value.toLowerCase();
    onTabChange(normalizedValue);
  };
  
  return (
    <div className="bg-muted/30 border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-6">{title}</h1>
        
        <SearchBar className="mb-8" />
        
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
