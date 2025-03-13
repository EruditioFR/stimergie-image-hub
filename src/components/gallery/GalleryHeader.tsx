
import { SearchBar } from '@/components/SearchBar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClientsFilter } from './ClientsFilter';
import { useAuth } from '@/context/AuthContext';

interface GalleryHeaderProps {
  title: string;
  activeTab: string;
  onTabChange: (value: string) => void;
  categories: string[];
  selectedClient: string | null;
  onClientChange: (clientId: string | null) => void;
}

export function GalleryHeader({ 
  title, 
  activeTab, 
  onTabChange, 
  categories,
  selectedClient,
  onClientChange
}: GalleryHeaderProps) {
  const { userRole } = useAuth();
  const isAdmin = ['admin', 'admin_client'].includes(userRole);
  
  const handleTabChange = (value: string) => {
    // Convert category name to lowercase or 'all' for consistent filtering
    const normalizedValue = value.toLowerCase() === 'toutes' ? 'all' : value.toLowerCase();
    onTabChange(normalizedValue);
  };
  
  return (
    <div className="bg-muted/30 border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-6">{title}</h1>
        
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
          <SearchBar className="md:max-w-sm" variant="minimal" />
          
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
