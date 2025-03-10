
import { Link } from 'react-router-dom';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-background border-t border-border mt-20">
      <div className="max-w-7xl mx-auto py-12 px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Logo and Description */}
          <div className="md:col-span-2">
            <Link to="/" className="text-xl font-semibold tracking-tight mb-4 inline-block">
              Stimergie
            </Link>
            <p className="text-muted-foreground mt-4 max-w-md">
              Une banque d'images de haute qualité pour tous vos projets créatifs. Découvrez, téléchargez et utilisez des images exceptionnelles.
            </p>
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="font-medium text-sm text-foreground/70 uppercase tracking-wider mb-5">
              Navigation
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-foreground/80 hover:text-primary transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="text-foreground/80 hover:text-primary transition-colors">
                  Galerie
                </Link>
              </li>
              <li>
                <Link to="/categories" className="text-foreground/80 hover:text-primary transition-colors">
                  Catégories
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-foreground/80 hover:text-primary transition-colors">
                  À propos
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-medium text-sm text-foreground/70 uppercase tracking-wider mb-5">
              Légal
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/terms" className="text-foreground/80 hover:text-primary transition-colors">
                  Conditions d'utilisation
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-foreground/80 hover:text-primary transition-colors">
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link to="/licenses" className="text-foreground/80 hover:text-primary transition-colors">
                  Licences
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-foreground/80 hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Stimergie. Tous droits réservés.
          </p>
          <div className="mt-4 md:mt-0 flex space-x-6">
            <a href="#" className="text-foreground/60 hover:text-primary transition-colors">
              <span className="sr-only">Facebook</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
              </svg>
            </a>
            <a href="#" className="text-foreground/60 hover:text-primary transition-colors">
              <span className="sr-only">Instagram</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465.66.254 1.216.598 1.772 1.153.555.556.9 1.112 1.154 1.771.247.636.416 1.363.465 2.428.047 1.023.06 1.379.06 3.808v.03c0 2.43-.013 2.784-.06 3.808-.049 1.064-.218 1.791-.465 2.427-.254.66-.599 1.216-1.154 1.772-.556.555-1.112.9-1.771 1.154-.636.247-1.364.416-2.428.465-1.023.047-1.378.06-3.808.06s-2.784-.013-3.808-.06c-1.064-.049-1.791-.218-2.428-.465-.659-.254-1.215-.599-1.771-1.154-.555-.556-.9-1.112-1.153-1.772-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808s.013-2.784.06-3.808c.049-1.064.218-1.791.465-2.428.254-.659.598-1.215 1.153-1.771.556-.555 1.112-.9 1.772-1.154.636-.247 1.363-.416 2.428-.465 1.023-.047 1.378-.06 3.808-.06zm0 1.666c-2.387 0-2.72.01-3.686.054-.89.04-1.373.188-1.695.313-.427.165-.731.36-1.051.68-.32.32-.515.624-.68 1.05-.125.323-.274.805-.315 1.695-.043.965-.053 1.298-.053 3.686s.01 2.72.053 3.686c.04.89.19 1.373.316 1.695.163.427.359.731.679 1.05.32.32.624.516 1.05.68.322.125.805.274 1.695.315.966.044 1.299.054 3.686.054s2.72-.01 3.686-.054c.89-.04 1.373-.19 1.695-.315.426-.164.73-.36 1.05-.68.32-.32.516-.623.68-1.05.125-.322.275-.805.315-1.695.044-.965.054-1.298.054-3.686s-.01-2.72-.054-3.686c-.04-.89-.19-1.373-.315-1.695-.164-.427-.36-.73-.68-1.05-.32-.32-.624-.516-1.05-.68-.322-.125-.805-.275-1.695-.315-.966-.043-1.299-.054-3.686-.054z" clipRule="evenodd" />
                <path d="M12.315 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9zm0 7.5a3 3 0 110-6 3 3 0 010 6z" />
                <path d="M18.806 7.035a1.05 1.05 0 11-2.1 0 1.05 1.05 0 012.1 0z" />
              </svg>
            </a>
            <a href="#" className="text-foreground/60 hover:text-primary transition-colors">
              <span className="sr-only">Twitter</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
