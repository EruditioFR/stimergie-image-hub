import { supabase } from "@/integrations/supabase/client";

export interface ImageSharedClient {
  id: string;
  image_id: number;
  client_id: string;
  shared_at: string;
  shared_by?: string;
  client_name?: string;
}

/**
 * Share an image with a client
 */
export async function shareImageWithClient(
  imageId: number, 
  clientId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('image_shared_clients')
      .insert({
        image_id: imageId,
        client_id: clientId,
        shared_by: (await supabase.auth.getUser()).data.user?.id
      });

    if (error) {
      console.error('Error sharing image:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sharing image:', error);
    return { success: false, error: 'Failed to share image' };
  }
}

/**
 * Remove image sharing with a client
 */
export async function unshareImageFromClient(
  imageId: number, 
  clientId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('image_shared_clients')
      .delete()
      .eq('image_id', imageId)
      .eq('client_id', clientId);

    if (error) {
      console.error('Error unsharing image:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error unsharing image:', error);
    return { success: false, error: 'Failed to unshare image' };
  }
}

/**
 * Get all clients an image is shared with
 */
export async function getImageSharedClients(
  imageId: number
): Promise<{ data: ImageSharedClient[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('image_shared_clients')
      .select(`
        *,
        clients:client_id (nom)
      `)
      .eq('image_id', imageId);

    if (error) {
      console.error('Error fetching shared clients:', error);
      return { data: [], error: error.message };
    }

    const formattedData = data?.map(item => ({
      ...item,
      client_name: item.clients?.nom
    })) || [];

    return { data: formattedData };
  } catch (error) {
    console.error('Error fetching shared clients:', error);
    return { data: [], error: 'Failed to fetch shared clients' };
  }
}

/**
 * Get all images shared with a client
 */
export async function getSharedImagesForClient(
  clientId: string
): Promise<{ data: number[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('image_shared_clients')
      .select('image_id')
      .eq('client_id', clientId);

    if (error) {
      console.error('Error fetching shared images:', error);
      return { data: [], error: error.message };
    }

    const imageIds = data?.map(item => item.image_id) || [];
    return { data: imageIds };
  } catch (error) {
    console.error('Error fetching shared images:', error);
    return { data: [], error: 'Failed to fetch shared images' };
  }
}

/**
 * Check if an image is shared with a specific client
 */
export async function isImageSharedWithClient(
  imageId: number, 
  clientId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('image_shared_clients')
      .select('id')
      .eq('image_id', imageId)
      .eq('client_id', clientId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking image sharing:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking image sharing:', error);
    return false;
  }
}