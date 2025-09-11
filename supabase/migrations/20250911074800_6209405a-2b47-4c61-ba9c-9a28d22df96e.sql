-- Create table for image sharing with multiple clients
CREATE TABLE public.image_shared_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id integer NOT NULL REFERENCES public.images(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  shared_at timestamp with time zone DEFAULT now(),
  shared_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(image_id, client_id)
);

-- Enable RLS on the new table
ALTER TABLE public.image_shared_clients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for image_shared_clients
CREATE POLICY "Admins can manage all image shares" 
ON public.image_shared_clients 
FOR ALL 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admin clients can view their shared images" 
ON public.image_shared_clients 
FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin_client' AND id_client = client_id)
);

CREATE POLICY "Users can view images shared with their client" 
ON public.image_shared_clients 
FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'user' AND id_client = client_id)
);

-- Create index for performance
CREATE INDEX idx_image_shared_clients_image_id ON public.image_shared_clients(image_id);
CREATE INDEX idx_image_shared_clients_client_id ON public.image_shared_clients(client_id);