import prisma from "./db";
import { getCustomersInSegment } from "./segments";
import { personalizeMessage } from "./personalization";

const CHANNEL_SERVICE_URL =
  process.env.CHANNEL_SERVICE_URL || "http://localhost:3001/send";

export async function launchCampaign(campaignId) {
  try {
    // 1. Fetch Campaign and Segment
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { segment: true },
    });

    if (!campaign) {
      throw new Error(`Campaign with ID ${campaignId} not found`);
    }

    // 2. Update Campaign status to SENDING
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "SENDING" },
    });

    // 3. Find target customers
    const targetCustomers = await getCustomersInSegment(campaign.segment.query);
    console.log(
      `[Queue] Campaign ${campaign.name} targeting ${targetCustomers.length} customers.`,
    );

    if (targetCustomers.length === 0) {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: "SENT", sentCount: 0 },
      });
      return { success: true, count: 0 };
    }

    // 4. Create communication records for all targets in PENDING status
    const commsToCreate = targetCustomers.map((customer, idx) => {
      const variant = campaign.isAbTest ? (idx % 2 === 0 ? "A" : "B") : "A";
      return {
        campaignId: campaign.id,
        customerId: customer.id,
        status: "PENDING",
        variant,
      };
    });

    const createdComms = [];
    for (const comm of commsToCreate) {
      const created = await prisma.communication.create({
        data: comm,
      });
      createdComms.push(created);
    }

    // 5. Asynchronously dispatch messages to the Channel Service
    // We run this in the background (no await) to return immediately to the client
    dispatchCommunicationsBackground(
      campaignId,
      createdComms,
      targetCustomers,
      campaign.channel,
      campaign.message,
      campaign.messageB,
    );

    return { success: true, count: targetCustomers.length };
  } catch (error) {
    console.error(
      `[Queue Error] Failed to launch campaign ${campaignId}:`,
      error,
    );
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "FAILED" },
    });
    throw error;
  }
}

async function dispatchCommunicationsBackground(
  campaignId,
  communications,
  customers,
  channel,
  messageTemplate,
  messageTemplateB,
) {
  console.log(
    `[Queue Worker] Starting background dispatch for Campaign ${campaignId}...`,
  );

  for (let i = 0; i < communications.length; i++) {
    const comm = communications[i];
    const customer = customers.find((c) => c.id === comm.customerId);
    if (!customer) continue;

    const variant = comm.variant || "A";
    const activeTemplate =
      variant === "B" && messageTemplateB ? messageTemplateB : messageTemplate;
    const personalized = personalizeMessage(activeTemplate, customer);
    const recipient =
      channel.toLowerCase() === "email"
        ? customer.email
        : customer.phone || customer.email;

    // Payload exactly matching what Channel Service expects
    const payload = {
      channel: channel.toLowerCase(),
      user: comm.id, // representation of communication ID
      message: personalized,
      recipient: recipient,
    };

    try {
      // POST to the external channel service
      const res = await fetch(CHANNEL_SERVICE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error(
          `[Queue Worker] Failed to send communication ${comm.id} to Channel Service. HTTP ${res.status}`,
        );
        // Update to failed in DB
        await prisma.communication.update({
          where: { id: comm.id },
          data: { status: "FAILED" },
        });
      } else {
        console.log(
          `[Queue Worker] Successfully dispatched communication ${comm.id} to Channel Service`,
        );
      }
    } catch (err) {
      console.error(
        `[Queue Worker] Fetch error for communication ${comm.id}:`,
        err.message,
      );
      await prisma.communication.update({
        where: { id: comm.id },
        data: { status: "FAILED" },
      });
    }

    // Small delay between dispatches to simulate volume throttling
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  console.log(
    `[Queue Worker] Completed background dispatch for Campaign ${campaignId}`,
  );
}
