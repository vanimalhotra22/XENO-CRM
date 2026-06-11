import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCustomersInSegment } from "@/lib/segments";

export async function GET() {
  try {
    const segments = await prisma.segment.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, segments });
  } catch (error) {
    console.error("Error fetching segments:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, description, query } = body; // query is expected to be a JSON string or object

    if (!name || !query) {
      return NextResponse.json(
        { error: "Name and query criteria are required" },
        { status: 400 },
      );
    }

    const queryStr = typeof query === "string" ? query : JSON.stringify(query);

    // Calculate customer count in segment
    const matches = await getCustomersInSegment(queryStr);

    const segment = await prisma.segment.create({
      data: {
        name,
        description,
        query: queryStr,
        customerCount: matches.length,
      },
    });

    return NextResponse.json({ success: true, segment });
  } catch (error) {
    console.error("Error creating segment:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
