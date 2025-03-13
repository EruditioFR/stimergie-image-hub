
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { BlogPostFormData } from '@/hooks/useBlogPosts';
import { Client } from '@/hooks/useClients';

interface PostMetadataFieldsProps {
  form: UseFormReturn<BlogPostFormData>;
  clients?: Client[];
}

export function PostMetadataFields({ form, clients }: PostMetadataFieldsProps) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Titre</FormLabel>
            <FormControl>
              <Input placeholder="Titre de l'article" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="content_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Type de contenu</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Ressource">Ressource</SelectItem>
                <SelectItem value="Ensemble">Ensemble</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="client_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Client associé</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              defaultValue={field.value || ''}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client (optionnel)" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="">Aucun client</SelectItem>
                {clients?.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              Associer cet article à un client (optionnel)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
