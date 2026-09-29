import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { generateTickets } from "@/lib/tickets";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;

    if (!orderId) {
      return NextResponse.json({ error: "No orderId" }, { status: 400 });
    }

    try {
      await prisma.$transaction(async (tx) => {
        const order = await tx.order.update({
          where: { id: orderId },
          data: { status: "PAID" },
          include: {
            items: true,
          },
        });

        // Marquer les places comme vendues
        for (const item of order.items) {
          if (item.seatId) {
            await tx.seat.update({
              where: { id: item.seatId },
              data: { status: "SOLD" },
            });
          }
        }
      });

      // Générer les billets (hors transaction pour éviter timeout)
      await generateTickets(orderId);

      // Ici tu peux envoyer un email avec Resend / Nodemailer
      console.log(`✅ Billets générés pour la commande ${orderId}`);
    } catch (error) {
      console.error("Erreur traitement webhook:", error);
      return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
