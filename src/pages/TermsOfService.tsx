
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { RichTextEditor } from "@/components/ui/rich-text-editor/RichTextEditor";
import { toast } from "sonner";
import { Pencil, Save, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from "@/components/ui/layout/Header";
import Footer from "@/components/ui/layout/Footer";

interface LegalPage {
  id: string;
  title: string;
  content: string;
  updated_at: string;
}

export default function TermsOfService() {
  const [page, setPage] = useState<LegalPage | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user, userRole } = useAuth();
  
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    fetchPage();
  }, []);

  const fetchPage = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("legal_pages")
        .select("*")
        .eq("page_type", "terms_of_service")
        .single();

      if (error) {
        console.error("Error fetching terms of service:", error);
        toast.error("Erreur lors du chargement de la page");
        return;
      }

      setPage(data);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erreur lors du chargement de la page");
    } finally {
      setLoading(false);
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
    setEditTitle("");
    setEditContent("");
  };

  const handleSave = async () => {
    if (!page) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from("legal_pages")
        .update({
          title: editTitle,
          content: editContent,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq("id", page.id);

      if (error) throw error;

      setPage({
        ...page,
        title: editTitle,
        content: editContent,
        updated_at: new Date().toISOString()
      });
      setIsEditing(false);
      toast.success("Page mise à jour avec succès");
    } catch (error) {
      console.error("Error updating page:", error);
      toast.error("Erreur lors de la mise à jour de la page");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Chargement...</p>
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
        <main className="flex-1 container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Page en construction...
              </p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              {isEditing ? (
                <div className="flex-1 space-y-2">
                  <Label htmlFor="title">Titre de la page</Label>
                  <Input
                    id="title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Titre de la page"
                  />
                </div>
              ) : (
                <CardTitle className="text-3xl">{page.title}</CardTitle>
              )}
              
              {isAdmin && !isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  className="ml-4"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label>Contenu</Label>
                  <RichTextEditor
                    value={editContent}
                    onChange={setEditContent}
                    placeholder="Contenu de la page..."
                  />
                </div>
                
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Annuler
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                </div>
              </>
            ) : (
              <div
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: page.content }}
              />
            )}
            
            {!isEditing && (
              <div className="text-sm text-muted-foreground pt-4 border-t">
                Dernière mise à jour : {new Date(page.updated_at).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
