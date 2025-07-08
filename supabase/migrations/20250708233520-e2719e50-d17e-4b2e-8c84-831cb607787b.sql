
-- Corriger la contrainte pour permettre le type 'licenses'
ALTER TABLE public.legal_pages DROP CONSTRAINT IF EXISTS legal_pages_page_type_check;
ALTER TABLE public.legal_pages ADD CONSTRAINT legal_pages_page_type_check 
  CHECK (page_type IN ('privacy_policy', 'terms_of_service', 'licenses'));

-- Insérer le contenu par défaut pour la page des licences si elle n'existe pas déjà
INSERT INTO public.legal_pages (page_type, title, content) 
SELECT 'licenses', 'Licences', '<h2>Licences</h2>
<p>Cette page présente les différentes licences utilisées dans notre application et service.</p>

<h3>Licences des images</h3>
<p>Les images disponibles sur notre plateforme sont soumises aux licences suivantes :</p>
<ul>
<li>Images libres de droits : Utilisation commerciale et non commerciale autorisée</li>
<li>Images sous licence Creative Commons : Voir les conditions spécifiques de chaque licence</li>
<li>Images sous licence propriétaire : Utilisation selon les termes du contrat client</li>
</ul>

<h3>Licences des logiciels</h3>
<p>Notre application utilise des composants logiciels sous différentes licences :</p>
<ul>
<li>React : Licence MIT</li>
<li>Tailwind CSS : Licence MIT</li>
<li>Supabase : Licence Apache 2.0</li>
<li>Autres dépendances : Voir le fichier package.json pour les détails</li>
</ul>

<h3>Attribution</h3>
<p>Nous remercions les créateurs et contributeurs des projets open source que nous utilisons.</p>

<h3>Contact</h3>
<p>Pour toute question concernant les licences, contactez-nous à : legal@votre-entreprise.com</p>'
WHERE NOT EXISTS (
  SELECT 1 FROM public.legal_pages WHERE page_type = 'licenses'
);
