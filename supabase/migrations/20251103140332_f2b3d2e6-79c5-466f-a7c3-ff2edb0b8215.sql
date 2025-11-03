-- Add RLS policies for users to manage images in their own albums

-- Allow users to insert images into albums they own
CREATE POLICY "Users can insert images into their own albums"
ON public.album_images
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.albums 
    WHERE albums.id = album_images.album_id 
      AND albums.created_by = auth.uid()
  )
);

-- Allow users to update images in albums they own
CREATE POLICY "Users can update images in their own albums"
ON public.album_images
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.albums 
    WHERE albums.id = album_images.album_id 
      AND albums.created_by = auth.uid()
  )
);

-- Allow users to delete images from albums they own
CREATE POLICY "Users can delete images from their own albums"
ON public.album_images
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.albums 
    WHERE albums.id = album_images.album_id 
      AND albums.created_by = auth.uid()
  )
);