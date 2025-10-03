-- Fix get_album_by_share_key function to return share_key
DROP FUNCTION IF EXISTS public.get_album_by_share_key(text);

CREATE OR REPLACE FUNCTION public.get_album_by_share_key(share_key_param text)
 RETURNS TABLE(
   id uuid, 
   name text, 
   description text, 
   access_from timestamp with time zone, 
   access_until timestamp with time zone, 
   share_key text,
   images json
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    a.id, 
    a.name, 
    a.description, 
    a.access_from, 
    a.access_until,
    a.share_key,
    COALESCE(
      (SELECT json_agg(json_build_object(
        'id', i.id,
        'title', i.title,
        'description', i.description,
        'url', i.url,
        'width', i.width,
        'height', i.height,
        'orientation', i.orientation,
        'id_projet', i.id_projet
      ))
      FROM public.album_images ai
      JOIN public.images i ON ai.image_id = i.id
      WHERE ai.album_id = a.id), 
      '[]'::json
    ) AS images
  FROM public.albums a
  WHERE 
    a.share_key = share_key_param
    AND a.access_from <= now()
    AND a.access_until >= now();
END;
$function$;