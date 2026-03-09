import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Film, Menu, X, User, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Início", to: "/" },
  { label: "Filmes", to: "/filmes" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Film className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-2xl tracking-wider text-foreground">
            CINE<span className="text-primary">STAR</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === link.to ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Search className="h-4 w-4" />
          </Button>
          <Link to="/admin">
            <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:border-primary hover:text-primary">
              <User className="mr-2 h-4 w-4" />
              Admin
            </Button>
          </Link>
          <Link to="/filmes">
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Comprar Ingressos
            </Button>
          </Link>
        </div>

        <button
          className="text-foreground md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border bg-background md:hidden"
          >
            <div className="flex flex-col gap-2 p-4">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary ${
                    location.pathname === link.to ? "text-primary bg-secondary" : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link to="/admin" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full border-border text-muted-foreground">
                  <User className="mr-2 h-4 w-4" /> Painel Admin
                </Button>
              </Link>
              <Link to="/filmes" onClick={() => setMobileOpen(false)}>
                <Button className="w-full bg-primary text-primary-foreground">Comprar Ingressos</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
