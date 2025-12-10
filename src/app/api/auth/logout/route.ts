import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();

    // Create response and clear role cookies
    const response = NextResponse.json({ success: true });

    // Clear the cached role cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 0, // Expire immediately
      path: "/",
    };

    response.cookies.set("user_role", "", cookieOptions);
    response.cookies.set("user_role_id", "", cookieOptions);
    response.cookies.set("user_name", "", cookieOptions);

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
