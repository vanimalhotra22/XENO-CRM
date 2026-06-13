import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { syncCampaignRevenue } from "@/lib/attribution";
import { generateAISummary } from "@/lib/ai";
import { personalizeMessage } from "@/lib/personalization";

const CHANNEL_SERVICE_URL =
  process.env.CHANNEL_SERVICE_URL ||
  (process.env.NEXT_PUBLIC_CHANNEL_SERVICE_URL
    ? `${process.env.NEXT_PUBLIC_CHANNEL_SERVICE_URL}/send`
    : "http://localhost:3001/send");

export async function POST(request) {
  try {
    const { communicationId, status } = await request.json();

    if (!communicationId || !status) {
      return NextResponse.json(
        { error: "Missing communicationId or status" },
        { status: 400 },
      );
    }

    const upperStatus = status.toUpperCase();

    // 1. Fetch communication, campaign, and customer details
    const comm = await prisma.communication.findUnique({
      where: { id: communicationId },
      include: { campaign: true, customer: true },
    });

    if (!comm) {
      return NextResponse.json(
        { error: "Communication record not found" },
        { status: 404 },
      );
    }

    const campaignId = comm.campaignId;
    let nextStatus = upperStatus;
    let updatedRetryCount = comm.retryCount;
    // Parse existing logs
    let logs = [];
    try {
      logs = comm.retryLogs ? JSON.parse(comm.retryLogs) : [];
    } catch (e) {
      logs = [];
    }
    const time = new Date().toLocaleTimeString();

    const failureStatuses = [
      "EMAIL_BOUNCED",
      "INVALID_NUMBER",
      "RATE_LIMITED",
      "FAILED",
    ];

    if (failureStatuses.includes(upperStatus)) {
      if (comm.retryCount < 3) {
        updatedRetryCount = comm.retryCount + 1;
        nextStatus = "RETRYING";
        logs.push({
          time,
          event: `Delivery failed with ${upperStatus}. Attempting Retry ${updatedRetryCount}/3 in 2 seconds...`,
          status: "RETRYING",
        });

        // Trigger deferred retry dispatch
        triggerRetryAsync(comm, updatedRetryCount);
      } else {
        nextStatus = "DLQ";
        logs.push({
          time,
          event: `Retry limit exceeded (3 attempts). Assigned to Dead Letter Queue (DLQ).`,
          status: "DLQ",
        });
      }
    } else {
      // It's a success callback (sent, delivered, opened, clicked)
      if (comm.retryCount > 0) {
        logs.push({
          time,
          event: `Retry successful! Reached status: ${upperStatus}.`,
          status: upperStatus,
        });
      }
    }

    // 2. Update the specific communication
    await prisma.communication.update({
      where: { id: communicationId },
      data: {
        status: nextStatus,
        retryCount: updatedRetryCount,
        failureReason: failureStatuses.includes(upperStatus)
          ? upperStatus
          : comm.failureReason,
        retryLogs: JSON.stringify(logs),
      },
    });

    // 3. Recalculate campaign statistics
    const allComms = await prisma.communication.findMany({
      where: { campaignId },
      select: { status: true, variant: true },
    });

    let sent = 0;
    let delivered = 0;
    let opened = 0;
    let clicked = 0;
    let failed = 0;

    let sentCountB = 0;
    let openedCountB = 0;
    let clickedCountB = 0;

    for (const c of allComms) {
      const s = c.status;
      const isVarB = c.variant === "B";

      if (s === "SENT") {
        sent++;
        if (isVarB) sentCountB++;
      } else if (s === "DELIVERED") {
        sent++;
        delivered++;
        if (isVarB) sentCountB++;
      } else if (s === "OPENED") {
        sent++;
        delivered++;
        opened++;
        if (isVarB) {
          sentCountB++;
          openedCountB++;
        }
      } else if (s === "CLICKED") {
        sent++;
        delivered++;
        opened++;
        clicked++;
        if (isVarB) {
          sentCountB++;
          openedCountB++;
          clickedCountB++;
        }
      } else if (s === "FAILED" || s === "DLQ") {
        failed++;
      }
      // Note: 'RETRYING' and 'PENDING' states are ignored in metrics
    }

    // Determine completion and A/B winner
    const isCompleted = allComms.every(
      (c) => c.status !== "PENDING" && c.status !== "RETRYING",
    );
    let winner = null;
    let aiSummary = null;

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { segment: true },
    });

    if (campaign && campaign.isAbTest) {
      const sentA = sent - sentCountB;
      const clickedA = clicked - clickedCountB;
      const ctrA = sentA > 0 ? clickedA / sentA : 0;
      const ctrB = sentCountB > 0 ? clickedCountB / sentCountB : 0;
      winner = ctrB > ctrA ? "B" : "A";
    }

    if (isCompleted && campaign) {
      const tempCampaignObj = {
        ...campaign,
        sentCount: sent,
        deliveredCount: delivered,
        openedCount: opened,
        clickedCount: clicked,
        sentCountB,
        openedCountB,
        clickedCountB,
      };
      aiSummary = await generateAISummary(tempCampaignObj);
    }

    // 4. Sync stats in the campaign record
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        sentCount: sent,
        deliveredCount: delivered,
        openedCount: opened,
        clickedCount: clicked,
        failedCount: failed,
        sentCountB,
        openedCountB,
        clickedCountB,
        status: isCompleted ? "SENT" : "SENDING",
        winner,
        aiSummary: isCompleted ? aiSummary : undefined,
      },
    });

    // 5. Recalculate attributed revenue
    await syncCampaignRevenue(campaignId);

    return NextResponse.json({ success: true, status: nextStatus, campaignId });
  } catch (error) {
    console.error("[API Callback Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Background retry logic
function triggerRetryAsync(comm, retryAttempt) {
  setTimeout(async () => {
    try {
      const activeTemplate =
        comm.variant === "B" && comm.campaign.messageB
          ? comm.campaign.messageB
          : comm.campaign.message;
      const personalized = personalizeMessage(activeTemplate, comm.customer);
      const recipient =
        comm.campaign.channel.toLowerCase() === "email"
          ? comm.customer.email
          : comm.customer.phone || comm.customer.email;

      const payload = {
        channel: comm.campaign.channel.toLowerCase(),
        user: comm.id,
        message: personalized,
        recipient: recipient,
      };

      console.log(
        `[Retry Engine] Dispatching retry attempt ${retryAttempt} for Communication: ${comm.id}`,
      );
      const res = await fetch(CHANNEL_SERVICE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error(
          `[Retry Engine] Channel service rejected retry dispatch: HTTP ${res.status}`,
        );
      }
    } catch (e) {
      console.error(
        `[Retry Engine] Network error during retry dispatch:`,
        e.message,
      );
    }
  }, 2000);
}
