
import { buildGalleryQuery, applyPaginationToQuery } from './queryBuilder';

export async function fetchGalleryImages(
  search: string,
  tag: string,
  tab: string,
  client: string | null,
  project: string | null,
  pageNum: number,
  shouldFetchRandom: boolean,
  userRole: string,
  userClientId: string | null,
  orientation: string | null = null,
  userId: string | null = null
) {
  console.log(`fetchGalleryImages called with params:`, {
    search, tag, tab, client, project, pageNum, shouldFetchRandom, userRole, userClientId, orientation, userId
  });

  try {
    // Build the base query with access control
    const { query: baseQuery, hasEmptyResult } = await buildGalleryQuery(
      search, 
      tag, 
      tab, 
      client, 
      project, 
      userRole, 
      userClientId,
      userId
    );

    if (hasEmptyResult) {
      console.log('Query would return empty results due to access restrictions');
      return [];
    }

    let query = baseQuery;

    // Apply orientation filter if provided
    if (orientation && orientation !== 'all') {
      console.log(`Filtering by orientation: ${orientation}`);
      query = query.eq('orientation', orientation);
    }

    // Apply pagination or random selection (now returns { data, error } directly)
    const { data, error } = await applyPaginationToQuery(
      query,
      pageNum,
      shouldFetchRandom,
      client,
      project,
      search,
      tag,
      tab,
      userRole,
      userId,
      userClientId
    );

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    console.log(`Successfully fetched ${data?.length || 0} images`);
    return data || [];
  } catch (error) {
    console.error('Error in fetchGalleryImages:', error);
    throw error;
  }
}
