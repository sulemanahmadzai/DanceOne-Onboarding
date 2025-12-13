import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";

/**
 * GET /api/bulk-import/nds
 * Get list of NDs for bulk import dropdown
 * Available for Admin and HR only
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user from database
    const dbUser = await db.query.users.findFirst({
      where: eq(users.email, user.email!),
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is Admin or HR
    if (dbUser.role !== "admin" && dbUser.role !== "hr") {
      return NextResponse.json(
        { error: "Access denied. Only Admin and HR can access this." },
        { status: 403 }
      );
    }

    // Get all ND users (and admins who can also act as NDs)
    const ndUsers = await db.query.users.findMany({
      where: or(eq(users.role, "nd"), eq(users.role, "admin")),
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    // Sort by name
    ndUsers.sort((a, b) => {
      const nameA = a.name || a.email;
      const nameB = b.name || b.email;
      return nameA.localeCompare(nameB);
    });

    return NextResponse.json({
      nds: ndUsers.map((nd) => ({
        id: nd.id,
        name: nd.name || nd.email,
        email: nd.email,
        role: nd.role,
      })),
    });
  } catch (error) {
    console.error("Error fetching NDs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

