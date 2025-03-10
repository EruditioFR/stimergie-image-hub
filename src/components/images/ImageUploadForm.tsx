
import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Loader2, ImagePlus, Tag } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  nom_projet: string;
}

interface ImageUploadFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userRole?: string;
}

export function ImageUploadForm({ isOpen, onClose, onSuccess, userRole = 'user' }: ImageUploadFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [tagError, setTagError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get Supabase URL and key from environment variables
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://mjhbugzaqmtfnbxaqpss.supabase.co";
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qaGJ1Z3phcW10Zm5ieGFxcHNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzODU2MDQsImV4cCI6MjA1Njk2MTYwNH0.JLcLHyBk3G0wO6MuhJ4WMqv8ImbGxmcExEzGG2xWIsk";

  useEffect(() => {
    if (isOpen && user) {
      fetchProjects();
    }
  }, [isOpen, user]);

  const fetchProjects = async () => {
    if (!user) return;
    
    setIsLoadingProjects(true);
    try {
      let query = supabase
        .from('projets')
        .select('id, nom_projet');
      
      // If user is admin_client, only show projects from their client
      if (userRole === 'admin_client') {
        // Get the user's client ID
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id_client')
          .eq('id', user.id)
          .single();
          
        if (profileError) throw profileError;
        
        if (profileData?.id_client) {
          query = query.eq('id_client', profileData.id_client);
        }
      }
      
      const { data, error } = await query.order('nom_projet');
      
      if (error) throw error;
      
      setProjects(data || []);
      // Auto-select the first project if there's only one
      if (data && data.length === 1) {
        setSelectedProject(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setFile(null);
    setPreview(null);
    setDimensions(null);
    setOrientation('landscape');
    setTags([]);
    setSuggestedTags([]);
    setSelectedProject('');
    setTagError(null);
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
      analyzeImage(selectedFile);
    };
    
    img.src = previewUrl;
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Extract the base64 part from the data URL
          const base64String = reader.result.split(',')[1];
          resolve(base64String);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  const analyzeImage = async (imageFile: File) => {
    setAnalyzing(true);
    setTagError(null);
    setSuggestedTags([]);
    
    try {
      console.log("Converting image to base64...");
      const base64Data = await fileToBase64(imageFile);
      console.log("Image converted to base64");
      
      // Call the Supabase Edge Function for image analysis with OpenAI
      const response = await fetch(`${SUPABASE_URL}/functions/v1/analyze-image-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ imageBase64: base64Data })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error from analyze-image-ai function:", errorData);
        throw new Error(errorData.error || 'Failed to analyze image');
      }
      
      const data = await response.json();
      console.log("Tags received from AI:", data.tags);
      
      if (data.tags && Array.isArray(data.tags) && data.tags.length > 0) {
        setSuggestedTags(data.tags);
        // Auto-select the tags
        setTags(data.tags);
      } else {
        console.warn("No tags returned from AI function");
        setTagError("Aucun tag n'a pu être généré. Essayez d'ajouter des tags manuellement.");
        setSuggestedTags(["image", "photo", "média", "visuel", "contenu"]);
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      setTagError("Erreur lors de l'analyse de l'image. Essayez d'ajouter des tags manuellement.");
      setSuggestedTags(["image", "photo", "média", "visuel", "contenu"]);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'analyser l'image avec l'IA. Des tags par défaut ont été ajoutés."
      });
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
    if (!file || !dimensions || !user || !selectedProject) return;
    
    try {
      setUploading(true);
      
      // Create the storage bucket if it doesn't exist
      const { error: bucketError } = await supabase.storage.createBucket('images', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (bucketError && bucketError.message !== 'Bucket already exists') {
        throw bucketError;
      }
      
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
          id_projet: selectedProject,
        });
      
      if (insertError) {
        throw insertError;
      }
      
      // Clean up the preview URL to prevent memory leaks
      if (preview) {
        URL.revokeObjectURL(preview);
      }
      
      toast({
        title: "Succès",
        description: "L'image a été téléchargée avec succès"
      });
      
      resetForm();
      onSuccess();
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de télécharger l'image. Veuillez réessayer."
      });
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
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Ajouter une nouvelle image</DialogTitle>
          <DialogDescription>
            Téléchargez une image et ajoutez des informations pour la référencer facilement.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow pr-4 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 200px)' }}>
          <form id="upload-form" onSubmit={handleSubmit} className="space-y-5 py-2">
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
                <Label htmlFor="project">Projet</Label>
                <Select
                  value={selectedProject}
                  onValueChange={setSelectedProject}
                  disabled={isLoadingProjects}
                >
                  <SelectTrigger id="project" className="w-full">
                    <SelectValue placeholder={isLoadingProjects ? "Chargement des projets..." : "Sélectionner un projet"} />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.length > 0 ? (
                      projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.nom_projet}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-projects" disabled>
                        Aucun projet disponible
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
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
                <div className="flex items-center justify-between">
                  <Label className="flex items-center">
                    <Tag className="h-4 w-4 mr-2" />
                    Tags sélectionnés
                  </Label>
                </div>
                
                <div className="mt-2 flex flex-wrap gap-2 min-h-10">
                  {tags.length > 0 ? (
                    tags.map((tag, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="cursor-pointer"
                        onClick={() => toggleTag(tag)}
                      >
                        {tag} <X className="ml-1 h-3 w-3" />
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucun tag sélectionné</p>
                  )}
                </div>
              </div>
              
              {analyzing ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  <span>Analyse de l'image en cours...</span>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center">
                      <Tag className="h-4 w-4 mr-2" /> 
                      Tags suggérés par IA
                    </Label>
                    {tagError && <p className="text-xs text-destructive">{tagError}</p>}
                  </div>
                  
                  <div className="mt-2 p-3 border rounded-lg">
                    <div className="flex flex-wrap gap-2 min-h-16">
                      {suggestedTags.length > 0 ? (
                        suggestedTags.map((tag, index) => (
                          <Badge 
                            key={index} 
                            variant={tags.includes(tag) ? "default" : "outline"} 
                            className="cursor-pointer hover:shadow-sm transition-all"
                            onClick={() => toggleTag(tag)}
                          >
                            {tag}
                          </Badge>
                        ))
                      ) : preview ? (
                        <p className="text-sm text-muted-foreground">
                          Aucun tag suggéré disponible
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Téléchargez une image pour obtenir des suggestions de tags
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </form>
        </ScrollArea>
        
        <DialogFooter className="mt-6 pt-4 border-t">
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
            form="upload-form"
            disabled={!file || !selectedProject || uploading}
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
      </DialogContent>
    </Dialog>
  );
}
