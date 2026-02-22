
import { Header } from '@/components/ui/layout/Header';
import { Footer } from '@/components/ui/layout/Footer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, FolderKanban, ImageIcon, Shield, Download, 
  BookOpen, Settings, Mail, Share2, Calendar, Eye,
  Upload, Search, Tags, Palette, UserPlus, Lock,
  Server, Key, Globe, Code, Database, Rocket
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
  },
  {
    id: "database-structure",
    icon: Database,
    title: "Structure de la Base de Données",
    badge: "Technique",
    steps: [
      "**profiles** : stocke les informations des utilisateurs (email, prénom, nom, rôle, id_client, client_ids). Lié à l'authentification Supabase.",
      "**clients** : liste des clients (nom, email, téléphone, contact principal, logo).",
      "**projets** : projets associés à un client (nom_projet, nom_dossier, type_projet, id_client).",
      "**images** : banque d'images liées à un projet (title, url, url_miniature, tags, orientation, dimensions).",
      "**project_access_periods** : périodes d'accès définissant quand un client peut voir un projet (access_start, access_end, is_active).",
      "**user_roles** : table dédiée aux rôles (user, admin_client, admin). Source de vérité pour les permissions.",
      "**albums** : albums partagés avec lien unique (name, share_key, recipients, access_from, access_until).",
      "**album_images** : table de liaison entre albums et images.",
      "**image_shared_clients** : partage d'images spécifiques vers des clients.",
      "**download_requests** : suivi des demandes de téléchargement (status, is_hd, download_url).",
      "**blog_posts** : articles et ressources (title, content, slug, content_type, published).",
      "**legal_pages** : pages légales éditables (politique de confidentialité, CGU, licences).",
      "**ftp_files / ftp_folders / ftp_sync_state** : tables de synchronisation Dropbox/FTP.",
      "**logs_erreurs** : journal des erreurs système."
    ]
  },
  {
    id: "database-access",
    icon: Shield,
    title: "Contrôle d'Accès (RLS & Permissions)",
    badge: "Technique",
    steps: [
      "Toutes les tables utilisent le **Row Level Security (RLS)** de Supabase pour sécuriser l'accès aux données.",
      "**Administrateurs (admin)** : accès total en lecture/écriture sur toutes les tables via la politique `has_role(auth.uid(), 'admin')`.",
      "**Admin Client** : accès en lecture aux clients, projets et images de leur propre client. Peuvent créer et gérer leurs propres albums.",
      "**Utilisateurs** : accès en lecture aux images des projets avec une **période d'accès active** uniquement.",
      "La fonction **get_accessible_projects()** détermine les projets visibles selon le rôle et les périodes d'accès.",
      "La fonction **get_user_client_ids()** retourne tous les clients associés à un utilisateur (mono ou multi-client).",
      "La fonction **check_project_access()** vérifie si un utilisateur a accès à un projet spécifique à un instant donné.",
      "Les **profiles** sont lisibles par tout utilisateur authentifié, mais modifiables uniquement par le propriétaire.",
      "Les **images** sont visibles par tous les utilisateurs authentifiés, mais seuls le créateur et les admins peuvent les modifier/supprimer.",
      "Les **albums** ne sont visibles que par leur créateur, les admins, ou les destinataires (via l'email dans le champ recipients).",
      "Les **download_requests** sont isolées par utilisateur : chacun ne voit que ses propres demandes.",
      "En cas de doute sur un accès, vérifiez les politiques RLS dans le **SQL Editor** de Supabase."
    ]
  },
  {
    id: "stack-technique",
    icon: Code,
    title: "Stack Technique",
    badge: "Développeur",
    steps: [
      "**Frontend** : React 18 + TypeScript + Vite (bundler rapide avec HMR).",
      "**Styling** : Tailwind CSS + shadcn/ui (composants accessibles basés sur Radix UI).",
      "**Routing** : React Router DOM v6 avec routes protégées par rôle.",
      "**State Management** : TanStack React Query pour le cache et la synchronisation des données.",
      "**Backend** : Supabase (PostgreSQL, Auth, Storage, Edge Functions en Deno/TypeScript).",
      "**Emails** : Mailjet (API Key + Secret) pour l'envoi d'emails de contact et d'invitations d'albums.",
      "**IA** : OpenAI API pour l'analyse automatique des images (tags, descriptions).",
      "**Éditeur riche** : TipTap pour l'édition de contenu blog/ressources.",
      "**ZIP** : JSZip pour la génération de téléchargements groupés côté client.",
      "**Hébergement** : Lovable (frontend) + Supabase Cloud (backend, BDD, storage, edge functions)."
    ]
  },
  {
    id: "supabase-config",
    icon: Server,
    title: "Configuration Supabase",
    badge: "Développeur",
    steps: [
      "**Project ID** : mjhbugzaqmtfnbxaqpss",
      "**Dashboard** : https://supabase.com/dashboard/project/mjhbugzaqmtfnbxaqpss",
      "**SQL Editor** : https://supabase.com/dashboard/project/mjhbugzaqmtfnbxaqpss/sql/new",
      "**Auth Users** : https://supabase.com/dashboard/project/mjhbugzaqmtfnbxaqpss/auth/users",
      "**Storage** : https://supabase.com/dashboard/project/mjhbugzaqmtfnbxaqpss/storage/buckets",
      "**Edge Functions** : https://supabase.com/dashboard/project/mjhbugzaqmtfnbxaqpss/functions",
      "**Buckets Storage** : **Client Assets** (public, logos clients) et **ZIP Downloads** (public, fichiers ZIP).",
      "Les variables d'environnement frontend sont dans le fichier **.env** : VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY."
    ]
  },
  {
    id: "secrets",
    icon: Key,
    title: "Secrets & Clés API",
    badge: "Développeur",
    steps: [
      "Les secrets sont stockés de manière sécurisée dans Supabase et accessibles uniquement par les Edge Functions.",
      "**SUPABASE_SERVICE_ROLE_KEY** : clé admin pour les opérations privilégiées (création d'utilisateurs, mise à jour de mots de passe).",
      "**MAILJET_API_KEY / MAILJET_API_SECRET** : envoi d'emails (contact, invitations albums). Compte Mailjet à gérer sur mailjet.com.",
      "**FTP_HOST / FTP_USERNAME / FTP_PASSWORD / FTP_PORT** : connexion au serveur FTP/Dropbox pour la synchronisation des images.",
      "**OPENAI_API_KEY** : analyse IA des images (génération de tags et descriptions). Compte OpenAI à gérer sur platform.openai.com.",
      "**PUBLIC_URL** : URL publique du site, utilisée dans les emails et liens de partage.",
      "Pour modifier un secret : Supabase Dashboard → Settings → Edge Functions → Secrets.",
      "⚠️ Ne jamais exposer les secrets dans le code frontend. Ils ne sont accessibles que via les Edge Functions."
    ]
  },
  {
    id: "edge-functions",
    icon: Globe,
    title: "Edge Functions (API Backend)",
    badge: "Développeur",
    steps: [
      "**admin-create-user** : création d'un utilisateur avec rôle et association client (requiert SERVICE_ROLE_KEY).",
      "**admin-update-user** : mise à jour des informations d'un utilisateur existant.",
      "**admin-update-password** : changement de mot de passe par un administrateur.",
      "**send-contact-email** : envoi du formulaire de contact via Mailjet.",
      "**send-album-invitation** : envoi d'invitations par email pour les albums partagés.",
      "**cache-dropbox-images** : mise en cache des miniatures depuis Dropbox/FTP vers Supabase Storage.",
      "**cron-cache-dropbox** : tâche CRON automatique de synchronisation des images.",
      "**generate-zip / generate-hd-zip** : génération de fichiers ZIP pour les téléchargements groupés.",
      "**process-queue / cron-process-queue** : traitement de la file d'attente des téléchargements HD.",
      "**analyze-image / analyze-image-ai** : analyse d'images via OpenAI pour générer tags et descriptions.",
      "**check-download-url** : vérification de la validité d'une URL de téléchargement.",
      "**debug-album-share** : fonction de débogage pour les albums partagés.",
      "Les Edge Functions sont déployées automatiquement. Code source dans **supabase/functions/**."
    ]
  },
  {
    id: "deployment",
    icon: Rocket,
    title: "Déploiement & Self-Hosting",
    badge: "Développeur",
    steps: [
      "**Déploiement Lovable** : cliquez sur **Publier** en haut à droite. Les changements frontend nécessitent un clic sur 'Update', les changements backend (Edge Functions, migrations) sont déployés automatiquement.",
      "**URL de production** : https://stimergie-image-hub.lovable.app",
      "**Domaine personnalisé** : configurable dans Project → Settings → Domains (plan payant requis).",
      "**Connexion GitHub** : Settings → GitHub → Connect project pour synchroniser le code en temps réel.",
      "**Self-hosting** : 1) Cloner le repo GitHub. 2) `npm install` puis `npm run build`. 3) Déployer le dossier `dist/` sur Vercel, Netlify ou tout serveur web.",
      "**Variables d'environnement requises** : VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY (à configurer sur la plateforme d'hébergement).",
      "Les Edge Functions restent hébergées sur Supabase, indépendamment du frontend.",
      "**Transfert de projet** : inviter le nouveau développeur au workspace Lovable (Settings → People) et au projet Supabase (Organization → Members)."
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
