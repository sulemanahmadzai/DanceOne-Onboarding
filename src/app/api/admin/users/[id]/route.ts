import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { users, UserRole } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// DELETE - Delete a user
export async function DELETE(
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

    // Get the user to delete
    const userToDelete = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!userToDelete) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent deleting yourself
    if (userToDelete.supabaseAuthId === user.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    // Delete from Supabase Auth
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (userToDelete.supabaseAuthId) {
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(
        userToDelete.supabaseAuthId
      );

      if (authDeleteError) {
        console.error("Supabase auth delete error:", authDeleteError);
        // Continue with database deletion even if auth deletion fails
      }
    }

    // Delete from database
    await db.delete(users).where(eq(users.id, userId));

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}


