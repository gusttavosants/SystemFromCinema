import { useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SeatMap } from "@/components/SeatMap";
import { ReservationTimer } from "@/components/ReservationTimer";
import { sessions, movies, rooms } from "@/data/mock-data";
import { toast } from "@/hooks/use-toast";

export default function SeatSelectPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const session = sessions.find((s) => s.id === sessionId);
  const movie = session ? movies.find((m) => m.id === session.movieId) : null;
  const room = session ? rooms.find((r) => r.id === session.roomId) : null;
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  const handleSelectionChange = useCallback((seats: string[]) => {
    setSelectedSeats(seats);
  }, []);

  const handleExpire = useCallback(() => {
    toast({ title: "Tempo esgotado!", description: "Sua reserva expirou. Selecione novamente.", variant: "destructive" });
    setSelectedSeats([]);
  }, []);

  if (!session || !movie || !room) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Sessão não encontrada</p>
      </div>
    );
  }

  const total = selectedSeats.length * session.price;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <Link to={`/filme/${movie.id}`} className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
        </Link>

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Seat Map */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1"
          >
            <div className="cinema-card rounded-xl p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="font-display text-3xl text-foreground">{movie.title}</h1>
                  <p className="text-sm text-muted-foreground">
                    {session.date} • {session.time} • {session.roomName} ({session.roomType})
                  </p>
                </div>
                {selectedSeats.length > 0 && (
                  <ReservationTimer seconds={300} onExpire={handleExpire} />
                )}
              </div>

              <SeatMap
                rows={room.rows}
                seatsPerRow={room.seatsPerRow}
                onSelectionChange={handleSelectionChange}
              />
            </div>
          </motion.div>

          {/* Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full lg:w-80 shrink-0"
          >
            <div className="cinema-card sticky top-24 rounded-xl p-6">
              <h3 className="font-display text-xl text-foreground">RESUMO</h3>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Filme</span>
                  <span className="text-foreground font-medium">{movie.title}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Sessão</span>
                  <span className="text-foreground">{session.time} - {session.roomType}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Sala</span>
                  <span className="text-foreground">{session.roomName}</span>
                </div>

                <div className="border-t border-border pt-3">
                  <p className="text-muted-foreground">Assentos selecionados</p>
                  {selectedSeats.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {selectedSeats.sort().map((s) => (
                        <span key={s} className="rounded-md bg-cinema-info/20 px-2 py-1 text-xs font-medium text-foreground border border-cinema-info/30">
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground/60">Nenhum assento selecionado</p>
                  )}
                </div>

                <div className="border-t border-border pt-3">
                  <div className="flex justify-between text-muted-foreground">
                    <span>{selectedSeats.length}x Ingresso</span>
                    <span className="text-foreground">R$ {session.price.toFixed(2)}</span>
                  </div>
                </div>

                <div className="border-t border-border pt-3">
                  <div className="flex justify-between">
                    <span className="font-display text-lg text-foreground">TOTAL</span>
                    <span className="font-display text-2xl text-accent">
                      R$ {total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                className="mt-6 w-full bg-primary text-primary-foreground hover:bg-primary/90 cinema-glow"
                size="lg"
                disabled={selectedSeats.length === 0}
                onClick={() => {
                  toast({
                    title: "Compra simulada!",
                    description: `${selectedSeats.length} ingresso(s) para ${movie.title} - Total: R$ ${total.toFixed(2)}`,
                  });
                }}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Finalizar Compra
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
