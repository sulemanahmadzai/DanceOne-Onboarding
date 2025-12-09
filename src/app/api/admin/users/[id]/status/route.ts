import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { users, UserRole } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// PATCH - Update user status (activate/deactivate)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const adminUser = await db.query.users.findFirst({
      where: eq(users.supabaseAuthId, user.id),
    });

    if (!adminUser || adminUser.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
    }

    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "isActive must be a boolean" },
        { status: 400 }
      );
    }

    // Get the user to update
    const userToUpdate = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!userToUpdate) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent deactivating yourself
    if (userToUpdate.supabaseAuthId === user.id && !isActive) {
      return NextResponse.json(
        { error: "You cannot deactivate your own account" },
        { status: 400 }
      );
    }

    // Update Supabase Auth user (ban/unban)
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (userToUpdate.supabaseAuthId) {
      const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
        userToUpdate.supabaseAuthId,
        {
          ban_duration: isActive ? "none" : "876600h", // ~100 years if deactivating
        }
      );

      if (authUpdateError) {
        console.error("Supabase auth update error:", authUpdateError);
        // Continue with database update even if auth update fails
      }
    }

    // Update database
    await db
      .update(users)
      .set({
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    return NextResponse.json(
      { error: "Failed to update user status" },
      { status: 500 }
    );
  }
}


