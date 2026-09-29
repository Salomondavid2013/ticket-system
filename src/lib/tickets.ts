import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";
import { prisma } from "./prisma";

export async function generateTickets(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      event: true,
      items: {
        include: {
          seat: true,
          category: true,
        },
      },
    },
  });

  if (!order) throw new Error("Order not found");

  const tickets = [];

  for (const item of order.items) {
    const code = `TKT-${orderId.slice(-8).toUpperCase()}-${item.id.slice(-4).toUpperCase()}`;

    // Génération QR Code
    const qrDataUrl = await QRCode.toDataURL(
      JSON.stringify({
        code,
        event: order.event.title,
        date: order.event.date.toISOString(),
        seat: item.seat ? `${item.seat.row}${item.seat.number}` : null,
      }),
      { width: 180, margin: 1 }
    );

    // Création PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([420, 595]); // A5
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Header
    page.drawRectangle({
      x: 0,
      y: 520,
      width: 420,
      height: 75,
      color: rgb(0.15, 0.15, 0.25),
    });

    page.drawText("BILLET ÉLECTRONIQUE", {
      x: 30,
      y: 560,
      size: 14,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    page.drawText(order.event.title, {
      x: 30,
      y: 535,
      size: 18,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    // Infos
    let y = 480;
    const line = (label: string, value: string) => {
      page.drawText(label, { x: 30, y, size: 10, font, color: rgb(0.4, 0.4, 0.4) });
      page.drawText(value, { x: 140, y, size: 11, font: fontBold });
      y -= 22;
    };

    line("Date", new Date(order.event.date).toLocaleString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }));
    line("Lieu", order.event.venue);
    if (order.event.address) line("Adresse", order.event.address);
    line("Catégorie", item.category.name);
    if (item.seat) {
      line("Place", `${item.seat.row}${item.seat.number}`);
    }
    line("Nom", order.user.name || order.user.email);
    line("Code", code);

    // QR Code (bas de page)
    // Note: pour un vrai QR dans le PDF il faut convertir le dataURL en image
    // Ici on laisse le code texte + indication
    page.drawText("Présentez ce code à l'entrée :", {
      x: 30,
      y: 180,
      size: 10,
      font,
    });
    page.drawText(code, {
      x: 30,
      y: 155,
      size: 16,
      font: fontBold,
    });

    page.drawText("Scan QR code (dans l'email / app)", {
      x: 30,
      y: 120,
      size: 9,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await pdfDoc.save();

    // En production : upload vers Vercel Blob / S3 / Cloudinary
    // Pour l'instant on stocke juste le code
    const ticket = await prisma.ticket.create({
      data: {
        orderId,
        code,
        // pdfUrl: await uploadPdf(pdfBytes),
      },
    });

    tickets.push({ ticket, pdfBytes, qrDataUrl });
  }

  return tickets;
}
