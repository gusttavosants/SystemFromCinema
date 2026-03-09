import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import {
  BarChart3, Film, CalendarDays, Armchair, Ticket, Users, DollarSign, Settings,
  TrendingUp, Eye, CreditCard, Clock, ChevronRight, LayoutDashboard, Menu, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminStats, movies, sessions } from "@/data/mock-data";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from "recharts";

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

const CHART_COLORS = ["hsl(0, 85%, 55%)", "hsl(42, 90%, 55%)", "hsl(217, 91%, 60%)", "hsl(142, 71%, 45%)"];

function KPICard({ title, value, icon: Icon, trend }: { title: string; value: string; icon: any; trend?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="cinema-card rounded-xl p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="mt-1 font-display text-3xl text-foreground">{value}</p>
          {trend && <p className="mt-1 text-xs text-cinema-success">{trend}</p>}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </motion.div>
  );
}

export default function AdminDashboard() {
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
            <h1 className="font-display text-2xl text-foreground">DASHBOARD</h1>
          </div>
          <Link to="/">
            <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:text-foreground">
              Ver Site
            </Button>
          </Link>
        </header>

        <div className="p-6">
          {/* KPIs */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            <KPICard title="Vendas Hoje" value={`R$ ${adminStats.todaySales.toLocaleString("pt-BR")}`} icon={DollarSign} trend="+12% vs ontem" />
            <KPICard title="Vendas Semana" value={`R$ ${adminStats.weekSales.toLocaleString("pt-BR")}`} icon={TrendingUp} trend="+8% vs semana anterior" />
            <KPICard title="Vendas Mês" value={`R$ ${adminStats.monthSales.toLocaleString("pt-BR")}`} icon={CreditCard} />
            <KPICard title="Taxa Ocupação" value={`${adminStats.occupancyRate}%`} icon={Eye} />
            <KPICard title="Ingressos Vendidos" value={adminStats.ticketsSold.toLocaleString("pt-BR")} icon={Ticket} />
            <KPICard title="Sessões Ativas" value={String(adminStats.activeSessions)} icon={Clock} />
          </div>

          {/* Charts */}
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {/* Sales by Hour */}
            <div className="cinema-card rounded-xl p-6">
              <h3 className="font-display text-xl text-foreground mb-4">VENDAS POR HORÁRIO</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={adminStats.salesByHour}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 6%, 18%)" />
                  <XAxis dataKey="hour" stroke="hsl(240, 5%, 55%)" fontSize={12} />
                  <YAxis stroke="hsl(240, 5%, 55%)" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: "hsl(240, 8%, 8%)", border: "1px solid hsl(240, 6%, 18%)", borderRadius: "8px", color: "hsl(0, 0%, 95%)" }}
                    formatter={(value: number) => [`R$ ${value}`, "Vendas"]}
                  />
                  <Bar dataKey="value" fill="hsl(0, 85%, 55%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Movies */}
            <div className="cinema-card rounded-xl p-6">
              <h3 className="font-display text-xl text-foreground mb-4">FILMES MAIS VENDIDOS</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={adminStats.topMovies}
                    dataKey="tickets"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                    fontSize={11}
                  >
                    {adminStats.topMovies.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "hsl(240, 8%, 8%)", border: "1px solid hsl(240, 6%, 18%)", borderRadius: "8px", color: "hsl(0, 0%, 95%)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Occupancy & Recent */}
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {/* Room Occupancy */}
            <div className="cinema-card rounded-xl p-6">
              <h3 className="font-display text-xl text-foreground mb-4">OCUPAÇÃO POR SALA</h3>
              <div className="space-y-4">
                {adminStats.occupancyByRoom.map((room, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{room.name}</span>
                      <span className="text-foreground font-medium">{room.rate}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${room.rate}%` }}
                        transition={{ duration: 1, delay: i * 0.2 }}
                        className="h-full rounded-full bg-primary"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="cinema-card rounded-xl p-6">
              <h3 className="font-display text-xl text-foreground mb-4">AÇÕES RÁPIDAS</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Novo Filme", icon: Film },
                  { label: "Nova Sessão", icon: CalendarDays },
                  { label: "Venda Balcão", icon: Ticket },
                  { label: "Relatório", icon: BarChart3 },
                ].map((action, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    className="h-auto flex-col gap-2 border-border py-4 text-muted-foreground hover:border-primary hover:text-primary"
                  >
                    <action.icon className="h-5 w-5" />
                    <span className="text-xs">{action.label}</span>
                  </Button>
                ))}
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-medium text-foreground mb-3">Sessões Ativas</h4>
                <div className="space-y-2">
                  {sessions.slice(0, 3).map((s) => {
                    const movie = movies.find((m) => m.id === s.movieId);
                    return (
                      <div key={s.id} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 text-xs">
                        <span className="text-foreground">{movie?.title}</span>
                        <span className="text-muted-foreground">{s.time} - {s.roomName}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
