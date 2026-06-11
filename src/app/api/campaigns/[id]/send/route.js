import { NextResponse } from "next/server";
import { launchCampaign } from "@/lib/queue";

export async function POST(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Missing campaign ID" },
        { status: 400 },
      );
    }

    const result = await launchCampaign(id);
    return NextResponse.json({ success: result.success, count: result.count });
  } catch (error) {
    console.error(`Error launching campaign ${error.message}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
