
import { useState, useEffect } from 'react';
import { Header } from '@/components/ui/layout/Header';
import { Footer } from '@/components/ui/layout/Footer';
import { Button } from '@/components/ui/button';
import { Edit, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/rich-text-editor/RichTextEditor';

interface LegalPage {
  id: string;
  title: string;
  content: string;
  updated_at: string;
}

const TermsOfService = () => {
  const [page, setPage] = useState<LegalPage | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    fetchPage();
  }, []);

  const fetchPage = async () => {
    try {
      const { data, error } = await supabase
        .from('legal_pages')
        .select('*')
        .eq('page_type', 'terms_of_service')
        .single();

      if (error) {
        console.error('Error fetching terms of service:', error);
        toast.error('Erreur lors du chargement de la page');
        return;
      }

      setPage(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur lors du chargement de la page');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    if (page) {
      setEditTitle(page.title);
      setEditContent(page.content);
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditTitle('');
    setEditContent('');
  };

  const handleSave = async () => {
    if (!page) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('legal_pages')
        .update({
          title: editTitle,
          content: editContent,
          updated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', page.id);

      if (error) {
        console.error('Error updating page:', error);
        toast.error('Erreur lors de la sauvegarde');
        return;
      }

      toast.success('Page mise à jour avec succès');
      setIsEditing(false);
      fetchPage(); // Refresh the page content
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-6 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
              <div className="h-4 bg-muted rounded w-4/6"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Page non trouvée</h1>
            <p className="text-muted-foreground">Les conditions d'utilisation n'ont pas pu être chargées.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-6 py-8">
        <div className="w-full">
          {/* Header with edit button */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex-1">
              {isEditing ? (
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-3xl font-bold border-none p-0 focus-visible:ring-0 bg-transparent"
                  placeholder="Titre de la page"
                />
              ) : (
                <h1 className="text-3xl font-bold">{page.title}</h1>
              )}
            </div>
            
            {isAdmin && (
              <div className="flex gap-2 ml-4">
                {isEditing ? (
                  <>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Annuler
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleEdit}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Éditer
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="w-full">
            {isEditing ? (
              <RichTextEditor
                value={editContent}
                onChange={setEditContent}
                placeholder="Contenu de la page..."
                className="w-full"
              />
            ) : (
              <div 
                className="prose prose-lg max-w-none w-full
                  prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground
                  prose-h1:text-3xl prose-h1:font-bold prose-h1:mb-6 prose-h1:mt-8
                  prose-h2:text-2xl prose-h2:font-bold prose-h2:mb-4 prose-h2:mt-6
                  prose-h3:text-xl prose-h3:font-bold prose-h3:mb-3 prose-h3:mt-5
                  prose-h4:text-lg prose-h4:font-semibold prose-h4:mb-2 prose-h4:mt-4
                  prose-p:mb-4 prose-p:leading-relaxed
                  prose-ul:mb-4 prose-ol:mb-4 prose-li:mb-1
                  prose-table:w-full prose-table:border-collapse prose-th:border prose-th:p-2 prose-td:border prose-td:p-2
                  prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic
                  prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                  prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-md prose-pre:overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: page.content }} 
              />
            )}
          </div>

          {/* Last updated info */}
          {!isEditing && (
            <div className="mt-8 pt-4 border-t border-border text-sm text-muted-foreground">
              Dernière mise à jour : {new Date(page.updated_at).toLocaleDateString('fr-FR')}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default TermsOfService;
