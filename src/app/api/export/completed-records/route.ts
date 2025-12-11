import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { onboardingRequests, users, OnboardingStatus } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

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

    // Check if user is HR, Admin, or ND
    if (dbUser.role !== "hr" && dbUser.role !== "admin" && dbUser.role !== "nd") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Fetch completed onboarding requests
    // ND users can only see their own records, HR and Admin can see all
    let requests;
    if (dbUser.role === "nd") {
      requests = await db.query.onboardingRequests.findMany({
        where: and(
          eq(onboardingRequests.status, OnboardingStatus.COMPLETED),
          eq(onboardingRequests.createdByNdId, dbUser.id)
        ),
        orderBy: [desc(onboardingRequests.hrCompletedAt)],
      });
    } else {
      requests = await db.query.onboardingRequests.findMany({
        where: eq(onboardingRequests.status, OnboardingStatus.COMPLETED),
        orderBy: [desc(onboardingRequests.hrCompletedAt)],
      });
    }

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Error fetching completed records:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

