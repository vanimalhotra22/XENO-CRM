import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { cookies } from "next/headers";

export async function POST(request) {
  try {
    const { credential } = await request.json();

    if (!credential) {
      return NextResponse.json(
        { error: "Missing credential token" },
        { status: 400 },
      );
    }

    // Decode JWT payload locally (independent of third-party libraries)
    const base64Url = credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      Buffer.from(base64, 'base64')
        .toString('utf8')
        .split('')
        .map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    const payload = JSON.parse(jsonPayload);

    const email = payload.email;
    const name = payload.name || payload.given_name || "Google User";

    if (!email) {
      return NextResponse.json(
        { error: "Could not retrieve email from Google token" },
        { status: 400 },
      );
    }

    // Find or automatically register user
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name,
          email,
          password: `GOOGLE_AUTH_${Math.random().toString(36).substring(2)}`,
          role: "MARKETER",
        },
      });
    }

    // Set cookie session
    const cookieStore = await cookies();
    cookieStore.set("xeno-session", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("[Google Auth Backend Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
