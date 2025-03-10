
import { useState, useRef, ChangeEvent } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Loader2, ImagePlus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ImageUploadFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImageUploadForm({ isOpen, onClose, onSuccess }: ImageUploadFormProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [orientation, setOrientation] = useState<string>('landscape');
  const [tags, setTags] = useState<string[]>([]);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get Supabase URL from the client configuration
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://mjhbugzaqmtfnbxaqpss.supabase.co";
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qaGJ1Z3phcW10Zm5ieGFxcHNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzODU2MDQsImV4cCI6MjA1Njk2MTYwNH0.JLcLHyBk3G0wO6MuhJ4WMqv8ImbGxmcExEzGG2xWIsk";

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setFile(null);
    setPreview(null);
    setDimensions(null);
    setOrientation('landscape');
    setTags([]);
    setSuggestedTags([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setFile(null);
      setPreview(null);
      setDimensions(null);
      return;
    }

    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    
    // Extract title from filename (removing extension)
    const fileName = selectedFile.name.split('.').slice(0, -1).join('.');
    setTitle(fileName);
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(selectedFile);
    setPreview(previewUrl);
    
    // Load image to get dimensions
    const img = new Image();
    img.onload = () => {
      setDimensions({
        width: img.width,
        height: img.height
      });
      
      // Determine orientation
      if (img.width > img.height) {
        setOrientation('landscape');
      } else if (img.height > img.width) {
        setOrientation('portrait');
      } else {
        setOrientation('square');
      }
      
      // After getting dimensions, analyze the image to suggest tags
      analyzeImage(previewUrl);
    };
    
    img.src = previewUrl;
  };

  const analyzeImage = async (imageUrl: string) => {
    try {
      setAnalyzing(true);
      // Call the Supabase Edge Function for image analysis
      const response = await fetch(`${SUPABASE_URL}/functions/v1/analyze-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ imageUrl })
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }
      
      const data = await response.json();
      setSuggestedTags(data.tags);
    } catch (error) {
      console.error('Error analyzing image:', error);
      setSuggestedTags([]);
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const uploadImage = async () => {
    if (!file || !dimensions || !user) return;
    
    try {
      setUploading(true);
      
      // Get a unique filename for the upload
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      // Upload the file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Get the public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);
      
      const publicUrl = urlData.publicUrl;
      
      // Save the image metadata to the database
      const { error: insertError } = await supabase
        .from('images')
        .insert({
          title: title,
          description: description,
          url: publicUrl,
          width: dimensions.width,
          height: dimensions.height,
          orientation: orientation,
          tags: tags.length > 0 ? tags : null,
          created_by: user.id,
          id_projet: '11111111-1111-1111-1111-111111111111', // Default project ID
        });
      
      if (insertError) {
        throw insertError;
      }
      
      // Clean up the preview URL to prevent memory leaks
      if (preview) {
        URL.revokeObjectURL(preview);
      }
      
      resetForm();
      onSuccess();
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await uploadImage();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        // Don't reset form immediately to prevent UI flicker
      }
    }}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Ajouter une nouvelle image</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          {!preview ? (
            <div 
              className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Cliquez ou glissez-déposez une image
              </p>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          ) : (
            <div className="relative">
              <img 
                src={preview} 
                alt="Aperçu" 
                className="w-full rounded-lg max-h-[300px] object-contain bg-muted/30"
              />
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2"
                onClick={() => {
                  if (preview) URL.revokeObjectURL(preview);
                  setPreview(null);
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
              >
                <X className="h-4 w-4" />
              </Button>
              
              {dimensions && (
                <div className="mt-2 text-sm text-muted-foreground flex items-center gap-4">
                  <span>Dimensions: {dimensions.width} × {dimensions.height}</span>
                  <span>Orientation: {orientation}</span>
                </div>
              )}
            </div>
          )}
          
          <div className="grid gap-4">
            <div>
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description (optionnelle)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            
            <div>
              <Label>Tags</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag} <X className="ml-1 h-3 w-3" />
                  </Badge>
                ))}
              </div>
            </div>
            
            {analyzing ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                <span>Analyse de l'image en cours...</span>
              </div>
            ) : suggestedTags.length > 0 ? (
              <div>
                <Label>Tags suggérés</Label>
                <ScrollArea className="h-24 mt-2 p-2 border rounded-lg">
                  <div className="flex flex-wrap gap-2">
                    {suggestedTags.map((tag, index) => (
                      <Badge 
                        key={index} 
                        variant={tags.includes(tag) ? "default" : "outline"} 
                        className="cursor-pointer"
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ) : null}
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={uploading}
            >
              Annuler
            </Button>
            <Button 
              type="submit"
              disabled={!file || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Télécharger
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
