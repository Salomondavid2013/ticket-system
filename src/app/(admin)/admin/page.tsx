import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [eventsCount, ordersCount, revenue, recentOrders] = await Promise.all([
    prisma.event.count(),
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.order.aggregate({
      where: { status: "PAID" },
      _sum: { totalAmount: true },
    }),
    prisma.order.findMany({
      where: { status: "PAID" },
      include: {
        user: true,
        event: true,
        _count: { select: { tickets: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            🎫 TicketShow Admin
          </Link>
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            Voir le site
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Tableau de bord</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-white rounded-xl border p-6">
            <p className="text-sm text-gray-500">Spectacles</p>
            <p className="text-3xl font-bold mt-1">{eventsCount}</p>
          </div>
          <div className="bg-white rounded-xl border p-6">
            <p className="text-sm text-gray-500">Commandes payées</p>
            <p className="text-3xl font-bold mt-1">{ordersCount}</p>
          </div>
          <div className="bg-white rounded-xl border p-6">
            <p className="text-sm text-gray-500">Chiffre d&apos;affaires</p>
            <p className="text-3xl font-bold mt-1 text-indigo-600">
              {formatPrice(revenue._sum.totalAmount || 0)}
            </p>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="mb-10 flex gap-3">
          <Link
            href="/admin/events/new"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Nouvel événement
          </Link>
        </div>

        {/* Commandes récentes */}
        <h2 className="text-lg font-semibold mb-4">Commandes récentes</h2>
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Client
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Spectacle
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Billets
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">
                  Montant
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    {order.user.name || order.user.email}
                  </td>
                  <td className="px-4 py-3">{order.event.title}</td>
                  <td className="px-4 py-3">{order._count.tickets}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatPrice(order.totalAmount)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Aucune commande pour le moment
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
