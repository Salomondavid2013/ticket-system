import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
   const session = await getServerSession(authOptions);
const userId = session?.user?.id || "guest-user";

    const { orderId } = await req.json();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            category: true,
            seat: true,
          },
        },
        event: true,
      },
    });

   if (!order || order.userId !== userId) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    if (order.status !== "PENDING") {
      return NextResponse.json({ error: "Commande déjà traitée" }, { status: 400 });
    }

    const lineItems = order.items.map((item) => ({
      price_data: {
        currency: "eur",
        product_data: {
          name: `${order.event.title} — ${item.category.name}`,
          description: item.seat
            ? `Place ${item.seat.row}${item.seat.number}`
            : undefined,
        },
        unit_amount: item.unitPrice,
      },
      quantity: item.quantity,
    }));

    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/events/${order.eventId}`,
      metadata: {
        orderId: order.id,
      },
      customer_email: session.user.email || undefined,
    });

    await prisma.order.update({
      where: { id: orderId },
      data: { stripeSessionId: stripeSession.id },
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur paiement" },
      { status: 500 }
    );
  }
}
