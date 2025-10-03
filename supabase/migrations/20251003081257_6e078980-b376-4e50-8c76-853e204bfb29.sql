-- Add RLS policies for albums table

-- Allow authenticated users to create albums
CREATE POLICY "Users can create albums" ON public.albums
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Allow users to view their own albums or albums they're recipients of
CREATE POLICY "Users can view their albums" ON public.albums
FOR SELECT TO authenticated
USING (
  -- Admins can see all albums
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  OR
  -- Users can see albums they created
  (auth.uid() = created_by)
  OR
  -- Users can see albums where they are recipients
  (auth.email() = ANY(recipients))
);

-- Allow users to update their own albums, admins can update all
CREATE POLICY "Users can update their albums" ON public.albums
FOR UPDATE TO authenticated
USING (
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  OR
  (auth.uid() = created_by)
);

-- Allow users to delete their own albums, admins can delete all
CREATE POLICY "Users can delete their albums" ON public.albums
FOR DELETE TO authenticated
USING (
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  OR
  (auth.uid() = created_by)
);