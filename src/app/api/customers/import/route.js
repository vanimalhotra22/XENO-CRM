import { NextResponse } from "next/server";
import prisma from "@/lib/db";

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

// Helper to recalculate segment counts after customer data changes
async function syncAllSegmentsCount() {
  const segments = await prisma.segment.findMany();
  const customers = await prisma.customer.findMany({
    include: { orders: true },
  });

  const profiles = customers.map((c) => {
    const deliveredOrders = c.orders.filter((o) => o.status === "DELIVERED");
    const totalSpent = deliveredOrders.reduce((sum, o) => sum + o.amount, 0);
    const orderCount = deliveredOrders.length;
    let lastOrderDaysAgo = 9999;
    if (deliveredOrders.length > 0) {
      const orderDates = deliveredOrders.map((o) =>
        new Date(o.createdAt).getTime(),
      );
      const lastOrderTime = Math.max(...orderDates);
      lastOrderDaysAgo = Math.floor(
        (Date.now() - lastOrderTime) / (1000 * 60 * 60 * 24),
      );
    }

    return {
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      city: c.city,
      gender: c.gender,
      createdAt: c.createdAt,
      totalSpent,
      orderCount,
      lastOrderDaysAgo,
    };
  });

  for (const seg of segments) {
    try {
      const query = JSON.parse(seg.query);
      let count = 0;
      for (const p of profiles) {
        if (!query.conditions || query.conditions.length === 0) {
          count++;
          continue;
        }
        const match = query.conditions.every((cond) => {
          const val = p[cond.field];
          if (cond.operator === "gt") return Number(val) > Number(cond.value);
          if (cond.operator === "lt") return Number(val) < Number(cond.value);
          if (cond.operator === "eq")
            return (
              String(val).toLowerCase() === String(cond.value).toLowerCase()
            );
          if (cond.operator === "contains")
            return String(val)
              .toLowerCase()
              .includes(String(cond.value).toLowerCase());
          return false;
        });
        if (match) count++;
      }

      await prisma.segment.update({
        where: { id: seg.id },
        data: { customerCount: count },
      });
    } catch (e) {
      console.error("Error syncing segment:", seg.name, e);
    }
  }
}
