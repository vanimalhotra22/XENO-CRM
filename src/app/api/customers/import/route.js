import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { syncAllSegmentsCount } from "@/lib/segments";

export async function POST(request) {
  try {
    const { csvText } = await request.json();

    if (!csvText || typeof csvText !== "string") {
      return NextResponse.json(
        { error: "Missing CSV content" },
        { status: 400 },
      );
    }

    const lines = csvText
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0);
    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV must contain a header and at least one data row" },
        { status: 400 },
      );
    }

    // Parse headers
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const nameIndex = headers.indexOf("name");
    const emailIndex = headers.indexOf("email");
    const spentIndex =
      headers.indexOf("total_spent") !== -1
        ? headers.indexOf("total_spent")
        : headers.indexOf("spent");
    const phoneIndex = headers.indexOf("phone");
    const cityIndex = headers.indexOf("city");
    const genderIndex = headers.indexOf("gender");

    if (nameIndex === -1 || emailIndex === -1) {
      return NextResponse.json(
        { error: 'CSV must contain at least "name" and "email" columns' },
        { status: 400 },
      );
    }

    let importedCount = 0;
    let errorsCount = 0;

    for (let i = 1; i < lines.length; i++) {
      // Basic CSV splitter that respects double quotes (optional but helpful)
      const row = parseCSVRow(lines[i]);
      if (row.length < Math.max(nameIndex, emailIndex) + 1) continue;

      const name = row[nameIndex]?.trim();
      const email = row[emailIndex]?.trim();

      if (!name || !email) {
        errorsCount++;
        continue;
      }

      const phone = phoneIndex !== -1 ? row[phoneIndex]?.trim() || null : null;
      const city = cityIndex !== -1 ? row[cityIndex]?.trim() || null : null;
      const gender =
        genderIndex !== -1 ? row[genderIndex]?.trim() || null : null;
      const totalSpent =
        spentIndex !== -1 ? parseFloat(row[spentIndex]) || 0 : 0;

      try {
        // Upsert customer by email
        const customer = await prisma.customer.upsert({
          where: { email },
          update: { name, phone, city, gender },
          create: { name, email, phone, city, gender },
        });

        // If totalSpent > 0, insert a mock order to reflect their spent amount in the CRM
        if (totalSpent > 0) {
          // Check if they already have orders to avoid duplicating spent
          const existingOrdersCount = await prisma.order.count({
            where: { customerId: customer.id },
          });
          if (existingOrdersCount === 0) {
            await prisma.order.create({
              data: {
                customerId: customer.id,
                amount: totalSpent,
                items: JSON.stringify([
                  {
                    name: "Imported Purchase History",
                    quantity: 1,
                    price: totalSpent,
                  },
                ]),
                status: "DELIVERED",
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
              },
            });
          }
        }

        importedCount++;
      } catch (err) {
        console.error(`Error importing row ${i}:`, err);
        errorsCount++;
      }
    }

    // After importing, recalculate segment counts
    await syncAllSegmentsCount();

    return NextResponse.json({ success: true, importedCount, errorsCount });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Simple CSV row parser dealing with quotes and commas
function parseCSVRow(text) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

