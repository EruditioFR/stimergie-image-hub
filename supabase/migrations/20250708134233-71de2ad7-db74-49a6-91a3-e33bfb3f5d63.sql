-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a table to store legal page contents
CREATE TABLE public.legal_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_type TEXT NOT NULL UNIQUE CHECK (page_type IN ('privacy_policy', 'terms_of_service')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable Row Level Security
ALTER TABLE public.legal_pages ENABLE ROW LEVEL SECURITY;

-- Create policies for legal pages
CREATE POLICY "Legal pages are viewable by everyone" 
ON public.legal_pages 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can update legal pages" 
ON public.legal_pages 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only admins can insert legal pages" 
ON public.legal_pages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_legal_pages_updated_at
BEFORE UPDATE ON public.legal_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default content for both pages
INSERT INTO public.legal_pages (page_type, title, content) VALUES 
(
  'privacy_policy',
  'Politique de confidentialité',
  '<h2>Politique de confidentialité</h2>
<p>Cette politique de confidentialité décrit comment nous collectons, utilisons et protégeons vos informations personnelles.</p>

<h3>Collecte d''informations</h3>
<p>Nous collectons les informations que vous nous fournissez directement, telles que :</p>
<ul>
<li>Informations de compte (nom, adresse e-mail)</li>
<li>Données d''utilisation du service</li>
</ul>

<h3>Utilisation des informations</h3>
<p>Nous utilisons vos informations pour :</p>
<ul>
<li>Fournir et améliorer notre service</li>
<li>Communiquer avec vous</li>
<li>Assurer la sécurité de notre plateforme</li>
</ul>

<h3>Protection des données</h3>
<p>Nous mettons en place des mesures de sécurité appropriées pour protéger vos informations personnelles.</p>

<h3>Contact</h3>
<p>Pour toute question concernant cette politique, contactez-nous à l''adresse : contact@votre-entreprise.com</p>'
),
(
  'terms_of_service',
  'Conditions d''utilisation',
  '<h2>Conditions d''utilisation</h2>
<p>En utilisant ce service, vous acceptez les conditions suivantes :</p>

<h3>Utilisation du service</h3>
<p>Vous vous engagez à utiliser notre service de manière légale et appropriée.</p>

<h3>Compte utilisateur</h3>
<p>Vous êtes responsable de :</p>
<ul>
<li>La confidentialité de vos identifiants</li>
<li>Toutes les activités sur votre compte</li>
<li>La véracité des informations fournies</li>
</ul>

<h3>Contenu</h3>
<p>Vous conservez vos droits sur le contenu que vous publiez, mais nous accordez une licence d''utilisation nécessaire au fonctionnement du service.</p>

<h3>Limitation de responsabilité</h3>
<p>Le service est fourni "tel quel" sans garantie explicite ou implicite.</p>

<h3>Modifications</h3>
<p>Nous nous réservons le droit de modifier ces conditions à tout moment.</p>

<h3>Contact</h3>
<p>Pour toute question, contactez-nous à : contact@votre-entreprise.com</p>'
);