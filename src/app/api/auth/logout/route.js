import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("xeno-session");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Logout Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
