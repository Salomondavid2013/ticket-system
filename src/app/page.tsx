import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const events = await prisma.event.findMany({
    where: { isPublished: true, date: { gte: new Date() } },
    include: {
      categories: {
        orderBy: { price: "asc" },
        take: 1,
      },
      _count: {
        select: { seats: { where: { status: "AVAILABLE" } } },
      },
    },
    orderBy: { date: "asc" },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            🎫 TicketShow
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/admin" className="text-gray-600 hover:text-gray-900">
              Admin
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Prochains spectacles
        </h1>
        <p className="text-gray-600 mb-8">
          Réservez vos places en quelques clics
        </p>

        {events.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            Aucun spectacle publié pour le moment.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition"
              >
                <div className="aspect-[16/9] bg-gradient-to-br from-indigo-500 to-purple-600 relative">
                  {event.imageUrl ? (
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white text-4xl opacity-50">
                      🎭
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h2 className="font-semibold text-lg text-gray-900 group-hover:text-indigo-600 transition">
                    {event.title}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDate(event.date)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{event.venue}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-indigo-600">
                      Dès{" "}
                      {event.categories[0]
                        ? formatPrice(event.categories[0].price)
                        : "—"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {event._count.seats} places restantes
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
