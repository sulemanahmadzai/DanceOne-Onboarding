import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { role, name, userId } = await request.json();

    if (!role || !userId) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const response = NextResponse.json({ success: true });

    // Set cookies for 7 days
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    };

    response.cookies.set("user_role", role, cookieOptions);
    response.cookies.set("user_role_id", userId, cookieOptions);
    if (name) {
      response.cookies.set("user_name", name, cookieOptions);
    }

    return response;
  } catch (error) {
    return NextResponse.json({ error: "Failed to set cache" }, { status: 500 });
  }
}
