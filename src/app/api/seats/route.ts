import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Réserver temporairement des places (15 min)
export async function POST(req: NextRequest) {
  try {
  const session = await getServerSession(authOptions);
// Mode invité autorisé temporairement
const userId = session?.user?.id || null;
    

    const { seatIds, eventId } = await req.json();

    if (!Array.isArray(seatIds) || seatIds.length === 0) {
      return NextResponse.json({ error: "Aucune place sélectionnée" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const seats = await tx.seat.findMany({
        where: {
          id: { in: seatIds },
          eventId,
          status: "AVAILABLE",
        },
        include: { category: true },
      });

      if (seats.length !== seatIds.length) {
        throw new Error("Certaines places ne sont plus disponibles");
      }

      await tx.seat.updateMany({
        where: { id: { in: seatIds } },
        data: { status: "RESERVED" },
      });

      // Créer la commande PENDING
      const totalAmount = seats.reduce((sum, s) => sum + s.category.price, 0);

      const order = await tx.order.create({
        data: {
          userId: userId,
          eventId,
          status: "PENDING",
          totalAmount,
          items: {
            create: seats.map((seat) => ({
              categoryId: seat.categoryId,
              seatId: seat.id,
              quantity: 1,
              unitPrice: seat.category.price,
            })),
          },
        },
        include: {
          items: {
            include: { category: true, seat: true },
          },
          event: true,
        },
      });

      return order;
    });

    // En production : programmer une libération auto des places après 15 min (cron / queue)

    return NextResponse.json({ order: result });
  } catch (error: any) {
    console.error("Reserve seats error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur réservation" },
      { status: 400 }
    );
  }
}
