import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BarChart3, Film, CalendarDays, Armchair, Ticket, Users, DollarSign, Settings,
  LayoutDashboard, Menu, X
} from "lucide-react";
import { Button } from "@/components/ui/button";

const sidebarLinks = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/admin" },
  { label: "Filmes", icon: Film, to: "/admin/filmes" },
  { label: "Sessões", icon: CalendarDays, to: "/admin/sessoes" },
  { label: "Salas", icon: Armchair, to: "/admin/salas" },
  { label: "Vendas", icon: Ticket, to: "/admin/vendas" },
  { label: "Clientes", icon: Users, to: "/admin/clientes" },
  { label: "Financeiro", icon: DollarSign, to: "/admin/financeiro" },
  { label: "Configurações", icon: Settings, to: "/admin/config" },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AdminLayout({ children, title = "DASHBOARD" }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-0 md:w-16"} shrink-0 border-r border-border bg-card transition-all duration-300 overflow-hidden`}>
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          {sidebarOpen && (
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Film className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-display text-lg tracking-wider text-foreground">
                CINE<span className="text-primary">STAR</span>
              </span>
            </Link>
          )}
        </div>

        <nav className="mt-4 flex flex-col gap-1 px-2">
          {sidebarLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <link.icon className="h-4 w-4 shrink-0" />
                {sidebarOpen && <span>{link.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <header className="flex h-16 items-center justify-between border-b border-border px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-muted-foreground hover:text-foreground">
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <h1 className="font-display text-2xl text-foreground">{title}</h1>
          </div>
          <Link to="/">
            <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:text-foreground">
              Ver Site
            </Button>
          </Link>
        </header>

        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
