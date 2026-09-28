import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPrice } from "@/lib/utils";
import { EventSeatSelector } from "./EventSeatSelector";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EventPage({ params }: Props) {
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      categories: {
        orderBy: { price: "asc" },
      },
      seats: {
        include: {
          category: true,
        },
        orderBy: [{ row: "asc" }, { number: "asc" }],
      },
    },
  });

  if (!event || !event.isPublished) {
    notFound();
  }

  const seatsData = event.seats.map((s) => ({
    id: s.id,
    row: s.row,
    number: s.number,
    status: s.status,
    category: {
      id: s.category.id,
      name: s.category.name,
      color: s.category.color,
      price: s.category.price,
    },
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            🎫 TicketShow
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl border overflow-hidden mb-8">
          <div className="aspect-[21/9] bg-gradient-to-r from-indigo-600 to-purple-600 relative">
            {event.imageUrl && (
              <img
                src={event.imageUrl}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="p-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {event.title}
            </h1>
            <p className="text-gray-600 mt-2">{formatDate(event.date)}</p>
            <p className="text-gray-600">
              {event.venue}
              {event.address ? ` — ${event.address}` : ""}
            </p>
            {event.description && (
              <p className="mt-4 text-gray-700 whitespace-pre-line">
                {event.description}
              </p>
            )}

            {/* Catégories */}
            <div className="mt-6 flex flex-wrap gap-3">
              {event.categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm"
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: cat.color || "#10b981" }}
                  />
                  <span className="font-medium">{cat.name}</span>
                  <span className="text-gray-500">{formatPrice(cat.price)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-4">Choisissez vos places</h2>
        <EventSeatSelector eventId={event.id} seats={seatsData} />
      </main>
    </div>
  );
}
