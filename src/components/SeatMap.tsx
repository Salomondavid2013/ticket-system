"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export type SeatData = {
  id: string;
  row: string;
  number: number;
  status: "AVAILABLE" | "RESERVED" | "SOLD";
  category: {
    id: string;
    name: string;
    color: string | null;
    price: number;
  };
};

type Props = {
  seats: SeatData[];
  onConfirm: (selectedIds: string[]) => void;
  isLoading?: boolean;
};

export function SeatMap({ seats, onConfirm, isLoading }: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string, status: string) => {
    if (status !== "AVAILABLE") return;
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const rows = Array.from(new Set(seats.map((s) => s.row))).sort();

  const selectedSeats = seats.filter((s) => selected.includes(s.id));
  const total = selectedSeats.reduce((sum, s) => sum + s.category.price, 0);

  return (
    <div className="space-y-6">
      {/* Légende */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-emerald-500" />
          <span>Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-blue-600 ring-2 ring-blue-300" />
          <span>Sélectionné</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-amber-400" />
          <span>Réservé</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-gray-400" />
          <span>Vendu</span>
        </div>
      </div>

      {/* Scène */}
      <div className="bg-gradient-to-b from-gray-800 to-gray-700 text-white text-center py-3 rounded-lg font-medium tracking-widest">
        SCÈNE
      </div>

      {/* Plan */}
      <div className="overflow-x-auto pb-4">
        <div className="inline-block min-w-full space-y-2">
          {rows.map((row) => (
            <div key={row} className="flex items-center gap-1.5">
              <span className="w-7 text-sm font-bold text-gray-600 shrink-0">
                {row}
              </span>
              <div className="flex gap-1">
                {seats
                  .filter((s) => s.row === row)
                  .sort((a, b) => a.number - b.number)
                  .map((seat) => {
                    const isSelected = selected.includes(seat.id);
                    const isAvailable = seat.status === "AVAILABLE";

                    return (
                      <button
                        key={seat.id}
                        disabled={!isAvailable || isLoading}
                        onClick={() => toggle(seat.id, seat.status)}
                        title={`${seat.row}${seat.number} — ${seat.category.name} — ${(seat.category.price / 100).toFixed(2)} €`}
                        className={cn(
                          "w-8 h-8 rounded text-[10px] font-medium transition-all",
                          !isAvailable && "cursor-not-allowed opacity-70",
                          seat.status === "SOLD" && "bg-gray-400 text-white",
                          seat.status === "RESERVED" && "bg-amber-400 text-black",
                          isAvailable && !isSelected && "hover:scale-110",
                          isAvailable &&
                            !isSelected &&
                            (seat.category.color
                              ? ""
                              : "bg-emerald-500 text-white"),
                          isSelected && "bg-blue-600 text-white ring-2 ring-blue-300 scale-110"
                        )}
                        style={
                          isAvailable && !isSelected && seat.category.color
                            ? { backgroundColor: seat.category.color }
                            : undefined
                        }
                      >
                        {seat.number}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Récapitulatif */}
      {selected.length > 0 && (
        <div className="sticky bottom-4 bg-white border border-gray-200 rounded-xl shadow-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="font-medium">
              {selected.length} place{selected.length > 1 ? "s" : ""} sélectionnée
              {selected.length > 1 ? "s" : ""}
            </p>
            <p className="text-sm text-gray-500">
              {selectedSeats
                .map((s) => `${s.row}${s.number}`)
                .join(", ")}
            </p>
            <p className="text-lg font-bold text-blue-600 mt-1">
              {(total / 100).toFixed(2)} €
            </p>
          </div>
          <button
            onClick={() => onConfirm(selected)}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-6 py-3 rounded-lg transition"
          >
            {isLoading ? "Réservation..." : "Continuer vers le paiement"}
          </button>
        </div>
      )}
    </div>
  );
}
