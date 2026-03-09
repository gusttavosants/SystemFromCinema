import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Star, Calendar, User, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SessionCard } from "@/components/SessionCard";
import { movies, sessions } from "@/data/mock-data";

export default function MovieDetailPage() {
  const { id } = useParams();
  const movie = movies.find((m) => m.id === id);
  const movieSessions = sessions.filter((s) => s.movieId === id);

  if (!movie) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Filme não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Banner */}
      <div className="relative h-[50vh] overflow-hidden">
        <img src={movie.poster} alt={movie.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
      </div>

      <div className="container mx-auto px-4 -mt-40 relative z-10 pb-16">
        <Link to="/filmes" className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
        </Link>

        <div className="flex flex-col gap-8 md:flex-row">
          {/* Poster */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full md:w-64 shrink-0"
          >
            <img
              src={movie.poster}
              alt={movie.title}
              className="w-full rounded-xl shadow-2xl"
            />
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="rounded-md bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">
                {movie.rating}
              </span>
              <div className="flex items-center gap-1 text-accent">
                <Star className="h-4 w-4 fill-accent" />
                <span className="font-medium">{movie.score}</span>
              </div>
            </div>

            <h1 className="font-display text-5xl text-foreground md:text-6xl">{movie.title}</h1>

            <div className="mt-3 flex flex-wrap gap-2">
              {movie.genre.map((g) => (
                <span key={g} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                  {g}
                </span>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {movie.duration} min</span>
              <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {new Date(movie.releaseDate).toLocaleDateString("pt-BR")}</span>
              <span className="flex items-center gap-1"><User className="h-4 w-4" /> {movie.director}</span>
            </div>

            <p className="mt-6 text-muted-foreground leading-relaxed">{movie.synopsis}</p>

            <div className="mt-4">
              <h4 className="text-sm font-medium text-foreground">Elenco</h4>
              <p className="text-sm text-muted-foreground">{movie.cast.join(", ")}</p>
            </div>
          </motion.div>
        </div>

        {/* Sessions */}
        <div className="mt-12">
          <h2 className="font-display text-3xl text-foreground mb-6">SESSÕES DISPONÍVEIS</h2>
          {movieSessions.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {movieSessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          ) : (
            <div className="cinema-card rounded-xl p-8 text-center">
              <Film className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <p className="mt-3 text-muted-foreground">Nenhuma sessão disponível no momento</p>
              {movie.status === "em_breve" && (
                <p className="mt-1 text-sm text-primary">Em breve nas telonas!</p>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
