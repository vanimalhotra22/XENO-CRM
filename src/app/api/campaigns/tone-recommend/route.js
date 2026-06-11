import { NextResponse } from "next/server";
import { suggestBetterCopy } from "@/lib/ai";

export async function POST(request) {
  try {
    const { message, channel } = await request.json();

    if (!message || !channel) {
      return NextResponse.json(
        { error: "Message and channel are required" },
        { status: 400 },
      );
    }

    const suggestion = await suggestBetterCopy(message, channel);
    return NextResponse.json({ success: true, ...suggestion });
  } catch (error) {
    console.error("[API Tone Recommend Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
