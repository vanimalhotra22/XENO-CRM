import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    // 1. Core KPIs
    const totalCustomers = await prisma.customer.count();
    const orderStats = await prisma.order.aggregate({
      where: { status: "DELIVERED" },
      _count: true,
      _sum: {
        amount: true,
      },
    });
    const totalOrders = orderStats._count || 0;
    const totalRevenue = orderStats._sum.amount || 0;
    const totalCampaigns = await prisma.campaign.count();

    // Funnel rates across all sent campaigns
    const campaignsStats = await prisma.campaign.findMany({
      select: {
        sentCount: true,
        deliveredCount: true,
        openedCount: true,
        clickedCount: true,
        revenueGenerated: true,
      },
    });

    const totalSent = campaignsStats.reduce((sum, c) => sum + c.sentCount, 0);
    const totalDelivered = campaignsStats.reduce(
      (sum, c) => sum + c.deliveredCount,
      0,
    );
    const totalOpened = campaignsStats.reduce(
      (sum, c) => sum + c.openedCount,
      0,
    );
    const totalClicked = campaignsStats.reduce(
      (sum, c) => sum + c.clickedCount,
      0,
    );
    const totalCampaignRevenue = campaignsStats.reduce(
      (sum, c) => sum + c.revenueGenerated,
      0,
    );

    const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
    const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;
    // Conversions: Count of CLICKED communications that resulted in a purchase (i.e. we have attributed revenue)
    // We can estimate the conversion rate: total clicked that converted
    const conversionRate =
      totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;

    // 2. Revenue Trend Chart (Last 15 days)
    const cutoffDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
    const orders = await prisma.order.findMany({
      where: {
        status: "DELIVERED",
        createdAt: { gte: cutoffDate },
      },
      orderBy: { createdAt: "asc" },
    });

    // Group orders by date (YYYY-MM-DD)
    const revenueByDate = {};
    // Fill last 15 days with zeroes first to ensure a continuous line chart
    for (let i = 14; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateString = d.toISOString().split("T")[0];
      revenueByDate[dateString] = { revenue: 0, ordersCount: 0 };
    }

    orders.forEach((o) => {
      const dateString = new Date(o.createdAt).toISOString().split("T")[0];
      if (revenueByDate[dateString] !== undefined) {
        revenueByDate[dateString].revenue += o.amount;
        revenueByDate[dateString].ordersCount += 1;
      }
    });

    const revenueTrend = Object.entries(revenueByDate).map(([date, data]) => {
      // Format date label as "MMM DD" (e.g. "Jun 10")
      const parts = date.split("-");
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const month = monthNames[parseInt(parts[1]) - 1];
      const day = parseInt(parts[2]);
      return {
        date: `${month} ${day}`,
        revenue: data.revenue,
        orders: data.ordersCount,
      };
    });

    // 3. Campaign Performance Chart
    const campaignList = await prisma.campaign.findMany({
      select: {
        id: true,
        name: true,
        sentCount: true,
        openedCount: true,
        clickedCount: true,
        revenueGenerated: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const campaignPerformance = campaignList.map((c) => ({
      name: c.name.length > 15 ? c.name.substring(0, 15) + "..." : c.name,
      sent: c.sentCount,
      opened: c.openedCount,
      clicked: c.clickedCount,
      revenue: c.revenueGenerated,
    }));

    // 4. Customer Growth (Cumulative over last 15 days)
    const cutoffDateForGrowth = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const countBeforeCutoff = await prisma.customer.count({
      where: {
        createdAt: { lt: cutoffDateForGrowth },
      },
    });

    const recentCustomers = await prisma.customer.findMany({
      where: {
        createdAt: { gte: cutoffDateForGrowth },
      },
      orderBy: { createdAt: "asc" },
    });

    const growthByDate = {};
    for (let i = 14; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateString = d.toISOString().split("T")[0];
      growthByDate[dateString] = 0;
    }

    recentCustomers.forEach((c) => {
      const dateString = new Date(c.createdAt).toISOString().split("T")[0];
      if (growthByDate[dateString] !== undefined) {
        growthByDate[dateString] += 1;
      }
    });

    // Build cumulative numbers
    // Start with customer count prior to 15 days ago
    let runningTotal = countBeforeCutoff;

    const customerGrowth = Object.entries(growthByDate).map(([date, count]) => {
      runningTotal += count;
      const parts = date.split("-");
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const month = monthNames[parseInt(parts[1]) - 1];
      const day = parseInt(parts[2]);
      return {
        date: `${month} ${day}`,
        totalCustomers: runningTotal,
      };
    });

    return NextResponse.json({
      success: true,
      kpis: {
        totalCustomers,
        totalOrders,
        totalRevenue,
        totalCampaigns,
        openRate,
        clickRate,
        conversionRate,
        campaignGeneratedRevenue: totalCampaignRevenue,
      },
      charts: {
        revenueTrend,
        campaignPerformance,
        customerGrowth,
      },
    });
  } catch (error) {
    console.error("Error compiling dashboard metrics:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
