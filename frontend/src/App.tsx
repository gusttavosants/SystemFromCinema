import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import MoviesPage from "./pages/MoviesPage";
import MovieDetailPage from "./pages/MovieDetailPage";
import SeatSelectPage from "./pages/SeatSelectPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminFilmes from "./pages/admin/AdminFilmes";
import AdminSessoes from "./pages/admin/AdminSessoes";
import AdminSalas from "./pages/admin/AdminSalas";
import AdminVendas from "./pages/admin/AdminVendas";
import AdminClientes from "./pages/admin/AdminClientes";
import AdminFinanceiro from "./pages/admin/AdminFinanceiro";
import AdminConfig from "./pages/admin/AdminConfig";
import Login from "./pages/Login";
import Sessions from "./pages/Sessions";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/filmes" element={<MoviesPage />} />
          <Route path="/filme/:id" element={<MovieDetailPage />} />
          <Route path="/assentos/:sessionId" element={<SeatSelectPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/sessions" element={<Sessions />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/filmes" element={<AdminFilmes />} />
          <Route path="/admin/sessoes" element={<AdminSessoes />} />
          <Route path="/admin/salas" element={<AdminSalas />} />
          <Route path="/admin/vendas" element={<AdminVendas />} />
          <Route path="/admin/clientes" element={<AdminClientes />} />
          <Route path="/admin/financeiro" element={<AdminFinanceiro />} />
          <Route path="/admin/config" element={<AdminConfig />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
