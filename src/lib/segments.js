import prisma from "./db";

export async function getCustomerProfiles() {
  const customers = await prisma.customer.findMany({
    include: {
      orders: true,
    },
  });

  return customers.map((c) => {
    const deliveredOrders = c.orders.filter((o) => o.status === "DELIVERED");
    const totalSpent = deliveredOrders.reduce((sum, o) => sum + o.amount, 0);
    const orderCount = deliveredOrders.length;
    let lastOrderDaysAgo = 9999; // Represents never ordered
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
}

export function evaluateCustomer(profile, queryStr) {
  try {
    const query = JSON.parse(queryStr);
    if (!query.conditions || query.conditions.length === 0) return true;

    const results = query.conditions.map((cond) => {
      const fieldVal = profile[cond.field];
      // Handle numeric comparisons
      if (cond.operator === "gt") {
        return Number(fieldVal) > Number(cond.value);
      }
      if (cond.operator === "lt") {
        return Number(fieldVal) < Number(cond.value);
      }
      if (cond.operator === "eq") {
        if (typeof fieldVal === "string") {
          return fieldVal.toLowerCase() === String(cond.value).toLowerCase();
        }
        return fieldVal === cond.value;
      }
      if (cond.operator === "contains") {
        return String(fieldVal)
          .toLowerCase()
          .includes(String(cond.value).toLowerCase());
      }
      return false;
    });

    if (query.logicalOperator === "OR") {
      return results.some((r) => r === true);
    }
    return results.every((r) => r === true);
  } catch (e) {
    console.error("Error evaluating segment query:", e);
    return false;
  }
}

export async function getCustomersInSegment(queryStr) {
  const profiles = await getCustomerProfiles();
  return profiles.filter((p) => evaluateCustomer(p, queryStr));
}

export async function syncAllSegmentsCount() {
  const segments = await prisma.segment.findMany();
  const profiles = await getCustomerProfiles();

  for (const seg of segments) {
    try {
      const count = profiles.filter((p) => evaluateCustomer(p, seg.query)).length;
      await prisma.segment.update({
        where: { id: seg.id },
        data: { customerCount: count },
      });
    } catch (e) {
      console.error("Error syncing segment:", seg.name, e);
    }
  }
}

