import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, Star, Badge } from "lucide-react";
import type { Movie } from "@/data/mock-data";

interface MovieCardProps {
  movie: Movie;
  index?: number;
}

export function MovieCard({ movie, index = 0 }: MovieCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link to={`/filme/${movie.id}`} className="group block">
        <div className="cinema-card overflow-hidden rounded-xl">
          <div className="relative aspect-[2/3] overflow-hidden">
            <img
              src={movie.poster}
              alt={movie.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            <div className="cinema-overlay absolute inset-0" />

            <div className="absolute top-3 left-3 flex gap-2">
              <span className="rounded-md bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
                {movie.rating}
              </span>
              {movie.status === "em_breve" && (
                <span className="rounded-md bg-accent px-2 py-1 text-xs font-semibold text-accent-foreground">
                  Em Breve
                </span>
              )}
            </div>

            <div className="absolute bottom-3 left-3 right-3">
              <div className="flex items-center gap-2 text-xs text-foreground/80">
                <Star className="h-3 w-3 fill-accent text-accent" />
                <span>{movie.score}</span>
                <span className="text-muted-foreground">•</span>
                <Clock className="h-3 w-3" />
                <span>{movie.duration}min</span>
              </div>
            </div>
          </div>

          <div className="p-4">
            <h3 className="font-display text-lg text-foreground group-hover:text-primary transition-colors">
              {movie.title}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {movie.genre.join(" • ")}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
