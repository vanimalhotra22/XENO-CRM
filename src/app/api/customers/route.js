import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { syncAllSegmentsCount } from "@/lib/segments";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "50");
    const includeOrders = searchParams.get("includeOrders") === "true";

    // Fetch customers
    const customers = await prisma.customer.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { city: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
      include: includeOrders
        ? {
            orders: true,
          }
        : undefined,
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    // Format profiles
    const profiles = customers.map((c) => {
      const orders = c.orders || [];
      const deliveredOrders = orders.filter((o) => o.status === "DELIVERED");
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
        phone: c.phone || "N/A",
        city: c.city || "N/A",
        gender: c.gender || "N/A",
        createdAt: c.createdAt,
        totalSpent,
        orderCount,
        lastOrderDaysAgo,
      };
    });

    return NextResponse.json({ success: true, customers: profiles });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phone, city, gender } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 },
      );
    }

    // Check if customer with the same email already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { email },
    });

    if (existingCustomer) {
      return NextResponse.json(
        { error: "A shopper with this email address already exists." },
        { status: 400 },
      );
    }

    const customer = await prisma.customer.create({
      data: { name, email, phone, city, gender },
    });

    // Recalculate segment counts after customer is added manually
    await syncAllSegmentsCount();

    return NextResponse.json({ success: true, customer });
  } catch (error) {
    console.error("Error creating customer:", error);
    if (
      error.code === "P2002" ||
      (error.message && error.message.includes("Unique constraint failed"))
    ) {
      return NextResponse.json(
        { error: "A shopper with this email address already exists." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

