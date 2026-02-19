
import { Header } from '@/components/ui/layout/Header';
import { Footer } from '@/components/ui/layout/Footer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, FolderKanban, ImageIcon, Shield, Download, 
  BookOpen, Settings, Mail, Share2, Calendar, Eye,
  Upload, Search, Tags, Palette, UserPlus, Lock
} from 'lucide-react';

const sections = [
  {
    id: "clients",
    icon: Users,
    title: "Gestion des Clients",
    badge: "Admin uniquement",
    steps: [
      "Accédez à la page **Clients** depuis le menu de navigation ou le tableau de bord.",
      "Cliquez sur **Ajouter un client** pour créer un nouveau client.",
      "Renseignez les informations : nom, email, téléphone, contact principal et logo.",
      "Pour modifier un client, cliquez sur l'icône de modification dans la liste.",
      "Pour supprimer un client, cliquez sur l'icône de suppression (attention : cette action est irréversible).",
      "Chaque client peut avoir plusieurs projets et utilisateurs associés."
    ]
  },
  {
    id: "projects",
    icon: FolderKanban,
    title: "Gestion des Projets",
    badge: "Admin",
    steps: [
      "Accédez à la page **Projets** depuis le menu.",
      "Cliquez sur **Nouveau projet** pour en créer un.",
      "Associez le projet à un client existant.",
      "Renseignez le nom du projet, le nom du dossier (correspondant au dossier Dropbox) et le type de projet.",
      "Les projets sont la structure de base pour organiser les images.",
      "Vous pouvez filtrer les projets par client ou par type.",
      "La vue peut être basculée entre liste et grille via le sélecteur de vue."
    ]
  },
  {
    id: "users",
    icon: UserPlus,
    title: "Gestion des Utilisateurs",
    badge: "Admin / Admin Client",
    steps: [
      "Accédez à la page **Utilisateurs** depuis le menu.",
      "Cliquez sur **Ajouter un utilisateur** pour créer un compte.",
      "Renseignez l'email, le prénom, le nom et le mot de passe.",
      "Attribuez un rôle : **Administrateur**, **Admin Client** ou **Utilisateur**.",
      "Associez l'utilisateur à un ou plusieurs clients.",
      "Les Admin Client ne peuvent voir et gérer que les utilisateurs de leur propre client.",
      "Pour modifier le mot de passe d'un utilisateur, utilisez le formulaire dédié.",
      "Filtrez les utilisateurs par rôle ou par client."
    ]
  },
  {
    id: "roles",
    icon: Lock,
    title: "Rôles et Permissions",
    badge: "Important",
    steps: [
      "**Administrateur (admin)** : accès total à toutes les fonctionnalités, tous les clients et tous les projets.",
      "**Admin Client (admin_client)** : gestion des utilisateurs et projets de son client. Peut partager des albums.",
      "**Utilisateur (user)** : accès à la banque d'images des projets auxquels il a accès. Peut télécharger des images.",
      "Les rôles sont stockés de manière sécurisée dans une table dédiée en base de données.",
      "Seuls les administrateurs peuvent attribuer le rôle admin."
    ]
  },
  {
    id: "images",
    icon: ImageIcon,
    title: "Gestion des Images",
    badge: "Admin Client / Utilisateur",
    steps: [
      "Accédez à **Gestion des images** depuis le menu.",
      "Les images sont organisées par projet.",
      "Chaque image possède un titre, une description, des tags et une orientation (paysage/portrait).",
      "Les images sont synchronisées automatiquement depuis Dropbox via le dossier du projet.",
      "Les miniatures sont générées automatiquement pour un affichage optimal.",
      "Utilisez la recherche et les filtres pour retrouver rapidement des images."
    ]
  },
  {
    id: "gallery",
    icon: Eye,
    title: "Banque d'Images (Galerie)",
    badge: "Tous les rôles",
    steps: [
      "Accédez à la **Banque d'images** depuis le menu principal.",
      "La galerie affiche les images en mode mosaïque (masonry).",
      "Utilisez les filtres : par client, par projet, par orientation, par tags.",
      "Cliquez sur une image pour voir le détail (titre, description, tags, dimensions).",
      "Sélectionnez plusieurs images via les cases à cocher pour des actions groupées.",
      "Le mode défilement infini charge automatiquement les images suivantes.",
      "Les administrateurs voient toutes les images ; les autres utilisateurs voient uniquement celles de leurs projets accessibles."
    ]
  },
  {
    id: "downloads",
    icon: Download,
    title: "Téléchargements",
    badge: "Tous les rôles",
    steps: [
      "Sélectionnez une ou plusieurs images dans la galerie.",
      "Cliquez sur le bouton **Télécharger** dans la barre d'outils.",
      "Pour un téléchargement unique, l'image est téléchargée directement.",
      "Pour un téléchargement multiple, un fichier ZIP est généré automatiquement.",
      "L'option **HD** permet de télécharger les images en haute définition (depuis Dropbox).",
      "L'historique des téléchargements est accessible depuis la page **Téléchargements**.",
      "Les demandes de téléchargement HD sont traitées en file d'attente."
    ]
  },
  {
    id: "access-periods",
    icon: Calendar,
    title: "Droits d'Accès (Périodes)",
    badge: "Admin uniquement",
    steps: [
      "Accédez à **Droits d'accès** depuis le menu administration.",
      "Les périodes d'accès définissent quand un client peut accéder à un projet.",
      "Cliquez sur **Ajouter une période** pour créer un nouvel accès.",
      "Sélectionnez le client, le projet, et définissez les dates de début et de fin.",
      "Une période peut être activée ou désactivée sans être supprimée.",
      "Les utilisateurs d'un client ne verront les images d'un projet que pendant la période active.",
      "Filtrez les périodes par client ou par projet pour une gestion simplifiée."
    ]
  },
  {
    id: "albums",
    icon: Share2,
    title: "Albums Partagés",
    badge: "Admin / Admin Client",
    steps: [
      "Sélectionnez des images dans la galerie, puis cliquez sur **Créer un album**.",
      "Renseignez le nom de l'album, une description et les dates d'accès.",
      "Ajoutez les adresses email des destinataires.",
      "Un lien de partage unique est généré automatiquement.",
      "Les destinataires reçoivent un email avec le lien vers l'album.",
      "L'album est accessible sans connexion, uniquement pendant la période définie.",
      "Les albums expirent automatiquement à la date de fin d'accès."
    ]
  },
  {
    id: "tags",
    icon: Tags,
    title: "Gestion des Tags",
    badge: "Admin / Admin Client",
    steps: [
      "Les tags permettent de catégoriser et retrouver facilement les images.",
      "Pour ajouter un tag, ouvrez le détail d'une image et utilisez l'éditeur de tags.",
      "Tapez le nom du tag et appuyez sur Entrée pour l'ajouter.",
      "Les tags existants sont suggérés automatiquement (auto-complétion).",
      "Les tags sont utilisés comme filtres dans la galerie.",
      "Supprimez un tag en cliquant sur la croix à côté de celui-ci."
    ]
  },
  {
    id: "blog",
    icon: BookOpen,
    title: "Blog et Ressources",
    badge: "Admin / Admin Client",
    steps: [
      "Accédez à l'éditeur de blog depuis le tableau de bord ou le menu.",
      "Cliquez sur **Nouvel article** pour créer un article.",
      "Utilisez l'éditeur riche pour formater le contenu (titres, listes, liens, images).",
      "Ajoutez une image à la une pour illustrer l'article.",
      "Choisissez le type de contenu : **Article** ou **Ressource**.",
      "Les articles peuvent être enregistrés en brouillon ou publiés directement.",
      "Les ressources apparaissent dans la section dédiée du site."
    ]
  },
  {
    id: "contact",
    icon: Mail,
    title: "Formulaire de Contact",
    badge: "Tous les rôles",
    steps: [
      "Le formulaire de contact est accessible depuis le menu principal.",
      "Les utilisateurs connectés ont leurs informations pré-remplies.",
      "Le message est envoyé par email à l'équipe Stimergie.",
      "Une confirmation est affichée après l'envoi réussi."
    ]
  },
  {
    id: "cache",
    icon: Settings,
    title: "Cache et Synchronisation Dropbox",
    badge: "Admin uniquement",
    steps: [
      "Le système de cache optimise le chargement des images depuis Dropbox.",
      "Le bouton **Synchroniser les images** lance la mise en cache des miniatures.",
      "La synchronisation est automatique via un CRON job régulier.",
      "Le panneau de débogage du cache permet de vérifier l'état du cache.",
      "En cas de problème d'affichage, lancez manuellement une synchronisation.",
      "Les images sont mises en cache dans le stockage Supabase pour un accès rapide."
    ]
  }
];

export default function AdminGuide() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 mt-16 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Mode d'emploi</h1>
          <p className="text-muted-foreground">
            Guide complet de toutes les fonctionnalités du back-office Stimergie.
          </p>
        </div>

        <Accordion type="multiple" className="space-y-3">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <AccordionItem key={section.id} value={section.id} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-primary shrink-0" />
                    <span className="font-semibold text-left">{section.title}</span>
                    <Badge variant="secondary" className="text-xs">{section.badge}</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <ol className="space-y-2 ml-8 list-decimal">
                    {section.steps.map((step, i) => (
                      <li 
                        key={i} 
                        className="text-sm text-muted-foreground leading-relaxed"
                        dangerouslySetInnerHTML={{ 
                          __html: step.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>') 
                        }}
                      />
                    ))}
                  </ol>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </main>
      <Footer />
    </div>
  );
}
