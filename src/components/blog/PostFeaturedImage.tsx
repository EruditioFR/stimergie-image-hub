
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { UseFormReturn } from 'react-hook-form';
import { BlogPostFormData } from '@/hooks/useBlogPosts';
import { ImageSelector } from './ImageSelector';
import { useState, useEffect } from 'react';

interface PostFeaturedImageProps {
  form: UseFormReturn<BlogPostFormData>;
  initialImage: string | null;
}

export function PostFeaturedImage({ form, initialImage }: PostFeaturedImageProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(initialImage);

  useEffect(() => {
    // Update the form value when the image changes
    form.setValue('featured_image_url', selectedImage);
  }, [selectedImage, form]);

  return (
    <FormField
      control={form.control}
      name="featured_image_url"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Image d'illustration</FormLabel>
          <ImageSelector 
            selectedImage={selectedImage}
            onSelectImage={setSelectedImage}
          />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
