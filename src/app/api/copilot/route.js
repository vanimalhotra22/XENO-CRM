import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import {
  chatCopilot,
  generateSegmentRules,
  generateCampaignCopy,
} from "@/lib/ai";
import { launchCampaign } from "@/lib/queue";
import { getCustomerProfiles } from "@/lib/segments";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const runId = searchParams.get("runId");

    if (runId) {
      const run = await prisma.agentRun.findUnique({
        where: { id: runId },
      });
      if (!run) {
        return NextResponse.json(
          { error: "Agent run not found" },
          { status: 404 },
        );
      }
      return NextResponse.json({
        success: true,
        run: { ...run, steps: JSON.parse(run.steps) },
      });
    }

    const runs = await prisma.agentRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    const parsedRuns = runs.map((r) => ({ ...r, steps: JSON.parse(r.steps) }));
    return NextResponse.json({ success: true, runs: parsedRuns });
  } catch (error) {
    console.error("Error fetching copilot runs:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, message, history, goal } = body;

    if (action === "chat") {
      if (!message) {
        return NextResponse.json(
          { error: "Message is required" },
          { status: 400 },
        );
      }

      const normalizedMsg = message.toLowerCase();
      // Check if message asks about campaign revenue or performance
      const isCampaignQuery =
        normalizedMsg.includes("campaign") ||
        normalizedMsg.includes("revenue") ||
        normalizedMsg.includes("most revenue") ||
        normalizedMsg.includes("best campaign") ||
        normalizedMsg.includes("highest revenue") ||
        normalizedMsg.includes("performance") ||
        normalizedMsg.includes("sales");

      if (isCampaignQuery) {
        const campaigns = await prisma.campaign.findMany({
          orderBy: { revenueGenerated: "desc" },
        });

        if (campaigns.length === 0) {
          return NextResponse.json({
            success: true,
            reply:
              "It looks like there are no campaigns launched yet in the database. Go to the Campaign Studio to create and launch your first AI-optimized campaign!",
          });
        }

        // Check if looking for highest revenue
        const isHighest =
          normalizedMsg.includes("most") ||
          normalizedMsg.includes("best") ||
          normalizedMsg.includes("highest") ||
          normalizedMsg.includes("top");
        if (isHighest) {
          const topCampaign = campaigns[0];
          const totalSent = topCampaign.sentCount + topCampaign.sentCountB;
          const openRate =
            totalSent > 0
              ? Math.round(
                  ((topCampaign.openedCount + topCampaign.openedCountB) /
                    totalSent) *
                    100,
                )
              : 0;
          const clickRate =
            totalSent > 0
              ? Math.round(
                  ((topCampaign.clickedCount + topCampaign.clickedCountB) /
                    totalSent) *
                    100,
                )
              : 0;

          return NextResponse.json({
            success: true,
            reply: `🏆 The top-performing campaign by revenue is **${topCampaign.name}**! Here is its performance summary:`,
            queryResult: [
              {
                name: topCampaign.name,
                channel: topCampaign.channel,
                revenue: topCampaign.revenueGenerated,
                openRate: `${openRate}%`,
                clickRate: `${clickRate}%`,
                status: topCampaign.status,
              },
            ],
          });
        }

        // General list of campaigns
        const truncatedCampaigns = campaigns.slice(0, 5);
        return NextResponse.json({
          success: true,
          reply: `Here are the top campaigns by revenue generated in the CRM:`,
          queryResult: truncatedCampaigns.map((c) => {
            const totalSent = c.sentCount + c.sentCountB;
            const openRate =
              totalSent > 0
                ? Math.round(
                    ((c.openedCount + c.openedCountB) / totalSent) * 100,
                  )
                : 0;
            return {
              name: c.name,
              channel: c.channel,
              revenue: c.revenueGenerated,
              openRate: `${openRate}%`,
              status: c.status,
            };
          }),
        });
      }

      // Check if message is a natural language CRM database query
      const isCrmQuery =
        normalizedMsg.includes("show") ||
        normalizedMsg.includes("find") ||
        normalizedMsg.includes("filter") ||
        normalizedMsg.includes("list") ||
        normalizedMsg.includes("who spent") ||
        normalizedMsg.includes("who live");

      if (isCrmQuery) {
        const profiles = await getCustomerProfiles();
        let queryResult = [];
        let filterReason = "";

        if (
          normalizedMsg.includes("vip") ||
          normalizedMsg.includes("10000") ||
          normalizedMsg.includes("10k")
        ) {
          queryResult = profiles.filter((p) => p.totalSpent > 10000);
          filterReason = "VIP shoppers (Spent > ₹10,000)";
        } else if (
          normalizedMsg.includes("high spender") ||
          normalizedMsg.includes("5000") ||
          normalizedMsg.includes("5k")
        ) {
          queryResult = profiles.filter((p) => p.totalSpent > 5000);
          filterReason = "High Spenders (Spent > ₹5,000)";
        } else if (normalizedMsg.includes("mumbai")) {
          queryResult = profiles.filter(
            (p) => p.city?.toLowerCase() === "mumbai",
          );
          filterReason = "shoppers in Mumbai";
        } else if (normalizedMsg.includes("delhi")) {
          queryResult = profiles.filter(
            (p) => p.city?.toLowerCase() === "delhi",
          );
          filterReason = "shoppers in Delhi";
        } else if (normalizedMsg.includes("bangalore")) {
          queryResult = profiles.filter(
            (p) => p.city?.toLowerCase() === "bangalore",
          );
          filterReason = "shoppers in Bangalore";
        } else if (
          normalizedMsg.includes("inactive") ||
          normalizedMsg.includes("churn") ||
          normalizedMsg.includes("30 days")
        ) {
          queryResult = profiles.filter(
            (p) => p.lastOrderDaysAgo > 30 && p.lastOrderDaysAgo !== 9999,
          );
          filterReason = "inactive shoppers (> 30 days since purchase)";
        } else if (
          normalizedMsg.includes("new") ||
          normalizedMsg.includes("zero") ||
          normalizedMsg.includes("0 orders")
        ) {
          queryResult = profiles.filter((p) => p.orderCount === 0);
          filterReason = "leads with 0 purchases";
        } else {
          queryResult = profiles.slice(0, 10);
          filterReason = "shoppers list (recent profile logs)";
        }

        // Limit query result count to keep chat compact
        const truncatedResult = queryResult.slice(0, 6);

        return NextResponse.json({
          success: true,
          reply: `I searched the CRM database and found **${queryResult.length}** ${filterReason}. Here are the top results:`,
          queryResult: truncatedResult.map((p) => ({
            name: p.name,
            email: p.email,
            city: p.city || "N/A",
            totalSpent: p.totalSpent,
            orderCount: p.orderCount,
          })),
        });
      }

      // Standard Copilot conversational reply
      const chatHistory = history || [];
      const result = await chatCopilot(chatHistory, message);
      return NextResponse.json({ success: true, ...result });
    }

    if (action === "agent") {
      if (!goal) {
        return NextResponse.json(
          { error: "Goal description is required for the agent" },
          { status: 400 },
        );
      }

      // 1. Create the AgentRun record
      const initialSteps = [
        {
          time: new Date().toISOString(),
          message: "🤖 Initializing Autonomous Marketing Agent...",
          status: "info",
        },
      ];

      const agentRun = await prisma.agentRun.create({
        data: {
          goal,
          status: "RUNNING",
          steps: JSON.stringify(initialSteps),
        },
      });

      // 2. Trigger background execution of the agent workflow (non-blocking)
      executeAgentWorkflowBackground(agentRun.id, goal);

      return NextResponse.json({ success: true, runId: agentRun.id });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Copilot API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Background Agent execution simulation
async function executeAgentWorkflowBackground(runId, goal) {
  const logStep = async (runId, message, status) => {
    console.log(`[Agent Workflow] RunID: ${runId} - ${message}`);
    const run = await prisma.agentRun.findUnique({ where: { id: runId } });
    if (!run) return;

    const steps = JSON.parse(run.steps);
    steps.push({ time: new Date().toISOString(), message, status });

    await prisma.agentRun.update({
      where: { id: runId },
      data: { steps: JSON.stringify(steps) },
    });
  };

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  try {
    // === Step 1: Research Audience ===
    await delay(1500);
    await logStep(
      runId,
      "🔍 Scanning customer purchase histories, spent totals, and inactivity profiles...",
      "info",
    );
    // Call AI to generate segment rules based on the goal
    const rules = await generateSegmentRules(goal);
    // Evaluate rules locally to count matches
    const allCustomers = await prisma.customer.findMany({
      include: { orders: true },
    });
    const profiles = allCustomers.map((c) => {
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

    // Count matches
    let matchCount = 0;
    for (const p of profiles) {
      if (!rules.conditions || rules.conditions.length === 0) {
        matchCount++;
        continue;
      }
      const match = rules.conditions.every((cond) => {
        const val = p[cond.field];
        if (cond.operator === "gt") return Number(val) > Number(cond.value);
        if (cond.operator === "lt") return Number(val) < Number(cond.value);
        if (cond.operator === "eq")
          return String(val).toLowerCase() === String(cond.value).toLowerCase();
        if (cond.operator === "contains")
          return String(val)
            .toLowerCase()
            .includes(String(cond.value).toLowerCase());
        return false;
      });
      if (match) matchCount++;
    }

    await delay(1200);
    await logStep(
      runId,
      `🎯 Research Complete: Identified ${matchCount} customers matching goal criteria.`,
      "success",
    );

    // === Step 2: Build Segment ===
    await delay(1500);
    const segmentName = `AI Agent: ${rules.name}`;
    await logStep(runId, `🛠️ Creating CRM Segment "${segmentName}"...`, "info");
    const segment = await prisma.segment.create({
      data: {
        name: segmentName,
        description: rules.description,
        query: JSON.stringify({
          conditions: rules.conditions,
          logicalOperator: rules.logicalOperator,
        }),
        customerCount: matchCount,
      },
    });
    await delay(1200);
    await logStep(
      runId,
      `✅ Segment registered in database with ID: ${segment.id}`,
      "success",
    );

    // === Step 3: Generate Campaign Copy ===
    await delay(1500);
    await logStep(
      runId,
      "✍️ Copywriting personalization engine drafting campaign template...",
      "info",
    );
    const copy = await generateCampaignCopy(goal, segmentName);
    await delay(1200);
    await logStep(
      runId,
      `📻 Optimal channel selected: ${copy.channel}. Generated subject: "${copy.subject}"`,
      "success",
    );

    // === Step 4: Create and Launch Campaign ===
    await delay(1500);
    const campaignName = `AI Campaign: ${rules.name}`;
    await logStep(
      runId,
      `🚀 Creating and launching Campaign "${campaignName}"...`,
      "info",
    );
    const campaign = await prisma.campaign.create({
      data: {
        name: campaignName,
        segmentId: segment.id,
        channel: copy.channel,
        message: copy.message,
        status: "DRAFT",
      },
    });

    // Launch dispatch queue
    await launchCampaign(campaign.id);
    await delay(1200);
    await logStep(
      runId,
      `📡 Dispatching campaign ${campaign.id} to Channel Service queue...`,
      "success",
    );

    // === Step 5: Completed & Monitoring ===
    await delay(1500);
    await logStep(
      runId,
      "📈 Campaign successfully dispatched. Channel callbacks are monitoring outcomes.",
      "success",
    );
    await prisma.agentRun.update({
      where: { id: runId },
      data: { status: "COMPLETED" },
    });
    await logStep(
      runId,
      "🏁 Autonomous marketing run completed successfully.",
      "success",
    );
  } catch (error) {
    console.error("[Agent Background Error]:", error);
    await logStep(runId, `❌ Execution failed: ${error.message}`, "error");
    await prisma.agentRun.update({
      where: { id: runId },
      data: { status: "FAILED" },
    });
  }
}
