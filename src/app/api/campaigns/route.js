import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeFailures = searchParams.get("includeFailures") === "true";

    const campaigns = await prisma.campaign.findMany({
      include: {
        segment: {
          select: {
            name: true,
            customerCount: true,
          },
        },
        ...(includeFailures
          ? {
              communications: {
                where: {
                  OR: [
                    { retryCount: { gt: 0 } },
                    { status: { in: ["DLQ", "RETRYING", "FAILED"] } },
                  ],
                },
                include: {
                  customer: {
                    select: {
                      name: true,
                      email: true,
                      phone: true,
                    },
                  },
                },
              },
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, campaigns });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name,
      segmentId,
      channel,
      message,
      isAbTest,
      messageB,
      channelRecommend,
    } = body;

    if (!name || !segmentId || !channel || !message) {
      return NextResponse.json(
        {
          error: "All fields (name, segmentId, channel, message) are required",
        },
        { status: 400 },
      );
    }

    const campaign = await prisma.campaign.create({
      data: {
        name,
        segmentId,
        channel,
        message,
        status: "DRAFT",
        isAbTest: isAbTest || false,
        messageB: messageB || null,
        channelRecommend: channelRecommend || null,
      },
    });

    return NextResponse.json({ success: true, campaign });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
