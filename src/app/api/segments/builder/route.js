import { NextResponse } from "next/server";
import { generateSegmentRules } from "@/lib/ai";

export async function POST(request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 },
      );
    }

    const rules = await generateSegmentRules(prompt);
    return NextResponse.json({ success: true, rules });
  } catch (error) {
    console.error("[API Segment Builder Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
