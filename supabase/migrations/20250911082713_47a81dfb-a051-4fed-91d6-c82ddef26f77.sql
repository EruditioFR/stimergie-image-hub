-- Fix client access policies - users need to view their own client data

-- Add policy for users to view their own client
CREATE POLICY "Users can view their own client" 
ON public.clients 
FOR SELECT 
USING (
  id IN (
    SELECT id_client FROM public.profiles 
    WHERE id = auth.uid() AND id_client IS NOT NULL
  )
);

-- Add policy for admin clients to view their own client
CREATE POLICY "Admin clients can view their own client" 
ON public.clients 
FOR SELECT 
USING (
  public.get_current_user_role() = 'admin_client' 
  AND id = public.get_current_user_client_id()
);