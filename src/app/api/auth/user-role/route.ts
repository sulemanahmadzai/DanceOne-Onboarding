import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user role from database - try supabaseAuthId first, then email
    let dbUser = await db.query.users.findFirst({
      where: eq(users.supabaseAuthId, user.id),
    });

    // Fallback to email lookup if supabaseAuthId not found
    if (!dbUser && user.email) {
      dbUser = await db.query.users.findFirst({
        where: eq(users.email, user.email),
      });

      // If found by email but missing supabaseAuthId, update it
      if (dbUser && !dbUser.supabaseAuthId) {
        await db
          .update(users)
          .set({ supabaseAuthId: user.id })
          .where(eq(users.id, dbUser.id));
      }
    }

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Set role cache cookies so middleware can redirect correctly
    const response = NextResponse.json({ role: dbUser.role, user: dbUser });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    };

    response.cookies.set("user_role", dbUser.role, cookieOptions);
    response.cookies.set("user_role_id", user.id, cookieOptions);
    if (dbUser.name) {
      response.cookies.set("user_name", dbUser.name, cookieOptions);
    }

    return response;
  } catch (error) {
    console.error("Error fetching user role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
