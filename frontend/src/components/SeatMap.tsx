import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

type SeatStatus = "available" | "occupied" | "selected" | "reserved";

interface SeatMapProps {
  rows: number;
  seatsPerRow: number;
  occupiedSeats?: string[];
  reservedSeats?: string[];
  onSelectionChange?: (seats: string[]) => void;
  maxSelection?: number;
}

function generateSeatLabel(row: number, seat: number) {
  return `${String.fromCharCode(65 + row)}${seat + 1}`;
}

export function SeatMap({
  rows,
  seatsPerRow,
  occupiedSeats = [],
  reservedSeats = [],
  onSelectionChange,
  maxSelection = 8,
}: SeatMapProps) {
  const [selected, setSelected] = useState<string[]>([]);

  // Generate random occupied seats on mount
  const [occupied] = useState<string[]>(() => {
    if (occupiedSeats.length > 0) return occupiedSeats;
    const occ: string[] = [];
    for (let r = 0; r < rows; r++) {
      for (let s = 0; s < seatsPerRow; s++) {
        if (Math.random() < 0.3) {
          occ.push(generateSeatLabel(r, s));
        }
      }
    }
    return occ;
  });

  const getSeatStatus = useCallback(
    (label: string): SeatStatus => {
      if (selected.includes(label)) return "selected";
      if (occupied.includes(label)) return "occupied";
      if (reservedSeats.includes(label)) return "reserved";
      return "available";
    },
    [selected, occupied, reservedSeats]
  );

  const toggleSeat = (label: string) => {
    const status = getSeatStatus(label);
    if (status === "occupied" || status === "reserved") return;

    setSelected((prev) => {
      const next = prev.includes(label)
        ? prev.filter((s) => s !== label)
        : prev.length < maxSelection
        ? [...prev, label]
        : prev;
      return next;
    });
  };

  useEffect(() => {
    onSelectionChange?.(selected);
  }, [selected, onSelectionChange]);

  const seatClasses: Record<SeatStatus, string> = {
    available: "seat-available",
    occupied: "seat-occupied",
    selected: "seat-selected",
    reserved: "seat-reserved",
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Screen */}
      <div className="relative w-full max-w-lg">
        <div className="mx-auto h-2 w-3/4 rounded-t-full bg-primary/40" />
        <p className="mt-1 text-center text-xs text-muted-foreground">TELA</p>
      </div>

      {/* Seats */}
      <div className="flex flex-col items-center gap-1.5">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex items-center gap-1.5">
            <span className="w-5 text-right text-xs text-muted-foreground">
              {String.fromCharCode(65 + rowIdx)}
            </span>
            {Array.from({ length: seatsPerRow }).map((_, seatIdx) => {
              const label = generateSeatLabel(rowIdx, seatIdx);
              const status = getSeatStatus(label);
              // Add corridor gap in the middle
              const hasGap = seatIdx === Math.floor(seatsPerRow / 2) - 1;

              return (
                <div key={label} className={`flex ${hasGap ? "mr-4" : ""}`}>
                  <motion.button
                    whileHover={status === "available" ? { scale: 1.2 } : {}}
                    whileTap={status === "available" || status === "selected" ? { scale: 0.9 } : {}}
                    onClick={() => toggleSeat(label)}
                    className={`h-6 w-6 rounded-t-lg text-[8px] font-medium text-foreground/70 transition-all sm:h-7 sm:w-7 ${seatClasses[status]}`}
                    title={label}
                  >
                    {status === "selected" ? label.slice(1) : ""}
                  </motion.button>
                </div>
              );
            })}
            <span className="w-5 text-left text-xs text-muted-foreground">
              {String.fromCharCode(65 + rowIdx)}
            </span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-4 rounded-t-md seat-available" />
          <span>Disponível</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-4 rounded-t-md seat-selected" />
          <span>Selecionado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-4 rounded-t-md seat-occupied" />
          <span>Ocupado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-4 rounded-t-md seat-reserved" />
          <span>Reservado</span>
        </div>
      </div>
    </div>
  );
}
