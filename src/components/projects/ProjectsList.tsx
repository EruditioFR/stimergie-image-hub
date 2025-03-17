
import { Project } from "@/types/project";
import { ViewMode } from "@/components/ui/ViewToggle";
import { ProjectsLoadingState } from "./ProjectsLoadingState";
import { ProjectsEmptyState } from "./ProjectsEmptyState";
import { ProjectCard } from "./ProjectCard";
import { ProjectsTable } from "./ProjectsTable";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { preloadImages } from "@/components/LazyImage";

interface ProjectsListProps {
  projects: Project[];
  loading?: boolean;
  onEdit?: (project: Project) => void;
  onDelete?: (projectId: string) => void;
  viewMode?: ViewMode;
}

export function ProjectsList({ 
  projects, 
  loading = false, 
  onEdit, 
  onDelete,
  viewMode = "card"
}: ProjectsListProps) {
  useEffect(() => {
    // Preload project preview images when the component mounts
    const preloadProjectImages = async () => {
      if (loading || projects.length === 0) return;
      
      try {
        console.log("Preloading project preview images");
        
        // Fetch all project preview images in a single batch
        const projectIds = projects.map(project => project.id).filter(Boolean);
        
        if (projectIds.length === 0) return;
        
        const { data, error } = await supabase
          .from('images')
          .select('url_miniature, url')
          .in('id_projet', projectIds)
          .order('created_at', { ascending: false })
          .limit(1, { foreignTable: 'id_projet' });
        
        if (error) {
          console.error("Error fetching preview images for preloading:", error);
          return;
        }
        
        if (data && data.length > 0) {
          // Extract image URLs, preferring miniature versions
          const imageUrls = data
            .map(img => img.url_miniature || img.url)
            .filter(Boolean);
          
          // Preload all images
          if (imageUrls.length > 0) {
            console.log(`Preloading ${imageUrls.length} project preview images`);
            preloadImages(imageUrls);
          }
        }
      } catch (error) {
        console.error("Error during image preloading:", error);
      }
    };
    
    preloadProjectImages();
  }, [projects, loading]);

  if (loading) {
    return <ProjectsLoadingState viewMode={viewMode} />;
  }

  if (projects.length === 0) {
    return <ProjectsEmptyState isEmpty={true} />;
  }

  // Sort projects by client_name first, then by nom_projet
  const sortedProjects = [...projects].sort((a, b) => {
    // First sort by client name
    const clientNameA = a.client_name || '';
    const clientNameB = b.client_name || '';
    
    if (clientNameA < clientNameB) return -1;
    if (clientNameA > clientNameB) return 1;
    
    // If client names are equal, sort by project name
    const projectNameA = a.nom_projet || '';
    const projectNameB = b.nom_projet || '';
    
    if (projectNameA < projectNameB) return -1;
    if (projectNameA > projectNameB) return 1;
    
    return 0;
  });

  // Card view
  if (viewMode === "card") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedProjects.map((project) => (
          <ProjectCard 
            key={project.id} 
            project={project} 
            onEdit={onEdit} 
            onDelete={onDelete} 
          />
        ))}
      </div>
    );
  }

  // List view (already sorted in ProjectsTable component)
  return <ProjectsTable projects={sortedProjects} onEdit={onEdit} onDelete={onDelete} />;
}
