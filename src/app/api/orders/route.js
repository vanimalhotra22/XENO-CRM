import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { syncCampaignRevenue } from "@/lib/attribution";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const orders = await prisma.order.findMany({
      include: {
        customer: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    // Compute top customers spending list using database GroupBy aggregation (extremely fast)
    const topSpent = await prisma.order.groupBy({
      by: ["customerId"],
      where: { status: "DELIVERED" },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          amount: "desc",
        },
      },
      take: 10,
    });

    const customerIds = topSpent.map((ts) => ts.customerId);
    const topCustDetails = await prisma.customer.findMany({
      where: {
        id: { in: customerIds },
      },
      select: {
        id: true,
        name: true,
        email: true,
        city: true,
      },
    });

    const topCustomers = topSpent.map((ts) => {
      const details = topCustDetails.find((c) => c.id === ts.customerId);
      return {
        id: ts.customerId,
        name: details?.name || "Unknown",
        email: details?.email || "",
        city: details?.city || "N/A",
        totalSpent: ts._sum.amount || 0,
        orderCount: ts._count.id || 0,
      };
    });

    return NextResponse.json({ success: true, orders, topCustomers });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { customerId, amount, items } = await request.json();

    if (!customerId || !amount) {
      return NextResponse.json(
        { error: "Missing customerId or amount" },
        { status: 400 },
      );
    }

    const itemsStr =
      typeof items === "string"
        ? items
        : JSON.stringify(
            items || [
              { name: "Simulated Purchase", quantity: 1, price: amount },
            ],
          );

    // 1. Create the delivered order
    const order = await prisma.order.create({
      data: {
        customerId,
        amount: parseFloat(amount),
        items: itemsStr,
        status: "DELIVERED",
      },
    });

    // 2. Find campaigns targeting this customer and sync their revenue
    const customerComms = await prisma.communication.findMany({
      where: { customerId },
      select: { campaignId: true },
    });

    const uniqueCampaignIds = Array.from(
      new Set(customerComms.map((c) => c.campaignId)),
    );
    // Sync revenue metrics for impacted campaigns
    for (const campaignId of uniqueCampaignIds) {
      await syncCampaignRevenue(campaignId);
      console.log(
        `[Attribution Sync] Recalculated revenue for campaign ${campaignId} after customer purchase`,
      );
    }

    return NextResponse.json({
      success: true,
      order,
      syncedCampaigns: uniqueCampaignIds.length,
    });
  } catch (error) {
    console.error("Error placing mock order:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
