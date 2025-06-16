
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Edit2, Save, X, Plus } from 'lucide-react';
import { parseTagsString } from '@/utils/imageUtils';
import { useImageTags } from '@/hooks/useImageTags';

interface TagsEditorProps {
  imageId: string;
  initialTags: string[] | null;
  onTagsUpdated?: (newTags: string[]) => void;
}

export const TagsEditor = ({ imageId, initialTags, onTagsUpdated }: TagsEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const { updateImageTags, isUpdating } = useImageTags();

  useEffect(() => {
    if (initialTags) {
      const processedTags = typeof initialTags === 'string' ? parseTagsString(initialTags) : initialTags;
      setTags(processedTags || []);
    } else {
      setTags([]);
    }
  }, [initialTags]);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = async () => {
    const success = await updateImageTags(imageId, tags);
    if (success) {
      setIsEditing(false);
      onTagsUpdated?.(tags);
    }
  };

  const handleCancel = () => {
    // Remettre les tags initiaux
    if (initialTags) {
      const processedTags = typeof initialTags === 'string' ? parseTagsString(initialTags) : initialTags;
      setTags(processedTags || []);
    } else {
      setTags([]);
    }
    setIsEditing(false);
    setNewTag('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  if (!isEditing) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="block text-foreground font-medium">Mots-clés</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-6 w-6 p-0"
          >
            <Edit2 className="h-3 w-3" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.length > 0 ? (
            tags.map((tag: string, index: number) => (
              <Badge key={index} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground text-sm">Aucun mot-clé</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="block text-foreground font-medium">Modifier les mots-clés</span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={isUpdating}
            className="h-6 w-6 p-0"
          >
            <Save className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isUpdating}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ajouter un mot-clé..."
          className="text-sm"
          disabled={isUpdating}
        />
        <Button
          onClick={handleAddTag}
          disabled={!newTag.trim() || isUpdating}
          size="sm"
          variant="outline"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag: string, index: number) => (
          <Badge
            key={index}
            variant="secondary"
            className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => handleRemoveTag(tag)}
          >
            #{tag} <X className="h-2 w-2 ml-1" />
          </Badge>
        ))}
      </div>
    </div>
  );
};
