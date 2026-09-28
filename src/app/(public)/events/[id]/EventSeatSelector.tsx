"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SeatMap, SeatData } from "@/components/SeatMap";

type Props = {
  eventId: string;
  seats: SeatData[];
};

export function EventSeatSelector({ eventId, seats }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async (selectedIds: string[]) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Réserver les places + créer la commande
      const res = await fetch("/api/seats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seatIds: selectedIds, eventId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la réservation");
      }

      // 2. Lancer le checkout Stripe
      const checkoutRes = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: data.order.id }),
      });

      const checkoutData = await checkoutRes.json();

      if (!checkoutRes.ok) {
        throw new Error(checkoutData.error || "Erreur paiement");
      }

      // Redirection vers Stripe
      window.location.href = checkoutData.url;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      <SeatMap seats={seats} onConfirm={handleConfirm} isLoading={loading} />
    </div>
  );
}
