import { Film, MapPin, Phone, Mail, Instagram, Facebook, Twitter } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <Link to="/" className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Film className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-display text-xl tracking-wider text-foreground">
                CINE<span className="text-primary">STAR</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              A melhor experiência cinematográfica da cidade. Tecnologia de ponta e conforto incomparável.
            </p>
          </div>

          <div>
            <h4 className="mb-3 font-display text-lg text-foreground">NAVEGAÇÃO</h4>
            <div className="flex flex-col gap-2">
              <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">Início</Link>
              <Link to="/filmes" className="text-sm text-muted-foreground hover:text-primary transition-colors">Filmes</Link>
              <Link to="/admin" className="text-sm text-muted-foreground hover:text-primary transition-colors">Admin</Link>
            </div>
          </div>

          <div>
            <h4 className="mb-3 font-display text-lg text-foreground">CONTATO</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Av. Cinema, 1234 - Centro</span>
              <span className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> (11) 9999-8888</span>
              <span className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> contato@cinestar.com</span>
            </div>
          </div>

          <div>
            <h4 className="mb-3 font-display text-lg text-foreground">REDES SOCIAIS</h4>
            <div className="flex gap-3">
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          © 2026 CineStar. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
