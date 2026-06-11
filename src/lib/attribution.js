import prisma from "./db";

export async function calculateCampaignRevenue(campaignId) {
  const communications = await prisma.communication.findMany({
    where: { campaignId },
    include: {
      customer: {
        include: {
          orders: {
            where: { status: "DELIVERED" },
          },
        },
      },
    },
  });

  let totalRevenue = 0;

  for (const comm of communications) {
    const commTime = new Date(comm.timestamp).getTime();
    // Sum orders placed after this communication sent time
    const ordersAfterCampaign = comm.customer.orders.filter((order) => {
      const orderTime = new Date(order.createdAt).getTime();
      return orderTime >= commTime;
    });

    const customerAttributed = ordersAfterCampaign.reduce(
      (sum, order) => sum + order.amount,
      0,
    );
    totalRevenue += customerAttributed;
  }

  return totalRevenue;
}

export async function syncCampaignRevenue(campaignId) {
  const revenue = await calculateCampaignRevenue(campaignId);
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { revenueGenerated: revenue },
  });
  return revenue;
}
