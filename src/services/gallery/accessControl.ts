
import { supabase } from '@/integrations/supabase/client';

/**
 * Vérifie si un utilisateur a accès à un projet à un moment donné
 */
export async function checkProjectAccess(
  userId: string,
  projectId: string,
  checkTime: Date = new Date()
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_project_access', {
      user_id: userId,
      project_id: projectId,
      check_time: checkTime.toISOString()
    });

    if (error) {
      console.error('Error checking project access:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error in checkProjectAccess:', error);
    return false;
  }
}

/**
 * Récupère tous les projets accessibles par un utilisateur
 */
export async function getAccessibleProjects(
  userId: string,
  checkTime: Date = new Date()
): Promise<string[]> {
  try {
    const { data, error } = await supabase.rpc('get_accessible_projects', {
      user_id: userId,
      check_time: checkTime.toISOString()
    });

    if (error) {
      console.error('Error getting accessible projects:', error);
      return [];
    }

    return data?.map((item: any) => item.project_id) || [];
  } catch (error) {
    console.error('Error in getAccessibleProjects:', error);
    return [];
  }
}

/**
 * Filtre les projets selon les droits d'accès de l'utilisateur
 */
export async function filterProjectsByAccess(
  projectIds: string[],
  userId: string,
  userRole: string
): Promise<string[]> {
  // Les admins ont accès à tous les projets
  if (userRole === 'admin') {
    return projectIds;
  }

  // Pour les autres rôles, vérifier les droits d'accès
  const accessibleProjects = await getAccessibleProjects(userId);
  
  // Retourner seulement les projets auxquels l'utilisateur a accès
  return projectIds.filter(projectId => accessibleProjects.includes(projectId));
}
