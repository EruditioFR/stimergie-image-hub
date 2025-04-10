
-- Create the download_requests table to track ZIP file generation
CREATE TABLE IF NOT EXISTS public.download_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  image_id VARCHAR NOT NULL,
  image_title TEXT NOT NULL,
  image_src TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days') NOT NULL,
  download_url TEXT NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'expired')),
  is_hd BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS for download_requests
ALTER TABLE public.download_requests ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see only their own download requests
CREATE POLICY "Users can view their own download requests" 
  ON public.download_requests 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy for users to insert their own download requests
CREATE POLICY "Users can create their own download requests" 
  ON public.download_requests 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy for the system (via Edge Functions) to update download requests
CREATE POLICY "System can update download requests" 
  ON public.download_requests 
  FOR UPDATE 
  USING (true);

-- Create storage bucket for ZIP downloads
INSERT INTO storage.buckets (id, name, public)
VALUES ('zip-downloads', 'ZIP Downloads', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to read from the bucket
CREATE POLICY "Authenticated users can download their ZIPs"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'zip-downloads' AND auth.role() = 'authenticated');

-- Allow system (via Edge Functions) to write to the bucket
CREATE POLICY "System can upload ZIPs"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'zip-downloads');
