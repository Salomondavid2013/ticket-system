import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Nettoyer (optionnel)
  await prisma.ticket.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.ticketCategory.deleteMany();
  await prisma.event.deleteMany();

  const event = await prisma.event.create({
    data: {
      title: "Concert Jazz Night",
      description:
        "Une soirée exceptionnelle avec les meilleurs jazzmen de la scène française et internationale.\n\nProgramme : standards, improvisations et surprises.",
      venue: "Salle Olympia",
      address: "28 Boulevard des Capucines, 75009 Paris",
      date: new Date("2026-11-15T20:00:00"),
      isPublished: true,
      categories: {
        create: [
          { name: "Orchestre", price: 4500, color: "#10b981" },
          { name: "Balcon", price: 3500, color: "#3b82f6" },
          { name: "VIP", price: 7500, color: "#f59e0b" },
        ],
      },
    },
    include: { categories: true },
  });

  const categories = event.categories;
  const rows = ["A", "B", "C", "D", "E", "F"];

  for (const row of rows) {
    for (let num = 1; num <= 12; num++) {
      let category = categories.find((c) => c.name === "Orchestre")!;
      if (row === "A" || row === "B") {
        category = categories.find((c) => c.name === "VIP")!;
      } else if (row === "E" || row === "F") {
        category = categories.find((c) => c.name === "Balcon")!;
      }

      await prisma.seat.create({
        data: {
          row,
          number: num,
          eventId: event.id,
          categoryId: category.id,
          status: "AVAILABLE",
        },
      });
    }
  }

  console.log("✅ Seed terminé !");
  console.log(`Événement créé : ${event.title} (${event.id})`);
  console.log(`Places générées : ${rows.length * 12}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
