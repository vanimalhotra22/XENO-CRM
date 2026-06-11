import { NextResponse } from "next/server";
import { getCustomersInSegment } from "@/lib/segments";

export async function POST(request) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json(
        { error: "Query criteria are required" },
        { status: 400 },
      );
    }

    const queryStr = typeof query === "string" ? query : JSON.stringify(query);

    // Calculate customer profiles in segment
    const matches = await getCustomersInSegment(queryStr);
    const potentialRevenue = matches.reduce((sum, p) => sum + p.totalSpent, 0);

    return NextResponse.json({
      success: true,
      count: matches.length,
      potentialRevenue,
    });
  } catch (error) {
    console.error("Error calculating segment preview:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
