import { motion } from "framer-motion";
import { Clock, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Session } from "@/data/mock-data";
import { Link } from "react-router-dom";

interface SessionCardProps {
  session: Session;
  movieTitle?: string;
}

export function SessionCard({ session, movieTitle }: SessionCardProps) {
  const occupancy = Math.round(((session.totalSeats - session.availableSeats) / session.totalSeats) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="cinema-card rounded-xl p-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="font-display text-2xl text-foreground">{session.time}</span>
            <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
              {session.roomType}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {session.roomName}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" /> {session.availableSeats} disponíveis
            </span>
          </div>
          <div className="mt-2 h-1.5 w-32 rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${occupancy}%` }}
            />
          </div>
        </div>

        <div className="text-right">
          <p className="font-display text-2xl text-accent">
            R$ {session.price.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">
            Meia: R$ {session.halfPrice.toFixed(2)}
          </p>
          <Link to={`/assentos/${session.id}`}>
            <Button size="sm" className="mt-2 bg-primary text-primary-foreground hover:bg-primary/90">
              Selecionar
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
