import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MovieCard } from "@/components/MovieCard";
import { movies } from "@/data/mock-data";

const allGenres = [...new Set(movies.flatMap((m) => m.genre))];
const allRatings = [...new Set(movies.map((m) => m.rating))];

export default function MoviesPage() {
  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return movies.filter((m) => {
      if (search && !m.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (selectedGenre && !m.genre.includes(selectedGenre)) return false;
      if (selectedRating && m.rating !== selectedRating) return false;
      return true;
    });
  }, [search, selectedGenre, selectedRating]);

  const hasFilters = selectedGenre || selectedRating;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-5xl text-foreground">FILMES</h1>
          <p className="mt-2 text-muted-foreground">Encontre o filme perfeito para hoje</p>
        </motion.div>

        {/* Search & Filters */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar filmes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 border-border bg-card pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {allGenres.map((g) => (
              <Button
                key={g}
                size="sm"
                variant={selectedGenre === g ? "default" : "outline"}
                className={selectedGenre === g
                  ? "bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary hover:text-primary"}
                onClick={() => setSelectedGenre(selectedGenre === g ? null : g)}
              >
                {g}
              </Button>
            ))}
          </div>
        </div>

        {/* Rating filter */}
        <div className="mt-3 flex gap-2">
          <span className="text-xs text-muted-foreground mr-2 self-center">Classificação:</span>
          {allRatings.map((r) => (
            <Button
              key={r}
              size="sm"
              variant={selectedRating === r ? "default" : "outline"}
              className={`h-7 text-xs ${selectedRating === r
                ? "bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`}
              onClick={() => setSelectedRating(selectedRating === r ? null : r)}
            >
              {r}
            </Button>
          ))}
          {hasFilters && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-muted-foreground"
              onClick={() => { setSelectedGenre(null); setSelectedRating(null); }}
            >
              <X className="mr-1 h-3 w-3" /> Limpar
            </Button>
          )}
        </div>

        {/* Results */}
        <div className="mt-8 grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((movie, i) => (
            <MovieCard key={movie.id} movie={movie} index={i} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="mt-16 text-center text-muted-foreground">
            <p className="text-lg">Nenhum filme encontrado</p>
            <p className="text-sm">Tente ajustar seus filtros</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
