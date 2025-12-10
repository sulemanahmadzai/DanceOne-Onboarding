import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { onboardingRequests, users, OnboardingStatus, UserRole } from "@/lib/db/schema";
import { eq, count, and } from "drizzle-orm";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const dbUser = await db.query.users.findFirst({
      where: eq(users.supabaseAuthId, user.id),
    });

    if (!dbUser || dbUser.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
    }

    // Fetch all onboarding requests with relations
    const requests = await db.query.onboardingRequests.findMany({
      orderBy: (onboardingRequests, { desc }) => [desc(onboardingRequests.updatedAt)],
      with: {
        createdByNd: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedHr: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Get stats
    const [
      totalResult,
      waitingForCandidateResult,
      waitingForHRResult,
      completedResult,
      totalUsersResult,
      totalNDResult,
      totalHRResult,
    ] = await Promise.all([
      db.select({ count: count() }).from(onboardingRequests),
      db.select({ count: count() }).from(onboardingRequests).where(eq(onboardingRequests.status, OnboardingStatus.WAITING_FOR_CANDIDATE)),
      db.select({ count: count() }).from(onboardingRequests).where(eq(onboardingRequests.status, OnboardingStatus.WAITING_FOR_HR)),
      db.select({ count: count() }).from(onboardingRequests).where(eq(onboardingRequests.status, OnboardingStatus.COMPLETED)),
      db.select({ count: count() }).from(users).where(eq(users.isActive, true)),
      db.select({ count: count() }).from(users).where(and(eq(users.role, UserRole.ND), eq(users.isActive, true))),
      db.select({ count: count() }).from(users).where(and(eq(users.role, UserRole.HR), eq(users.isActive, true))),
    ]);

    const stats = {
      total: totalResult[0]?.count || 0,
      waitingForCandidate: waitingForCandidateResult[0]?.count || 0,
      waitingForHR: waitingForHRResult[0]?.count || 0,
      completed: completedResult[0]?.count || 0,
      totalUsers: totalUsersResult[0]?.count || 0,
      totalND: totalNDResult[0]?.count || 0,
      totalHR: totalHRResult[0]?.count || 0,
    };

    return NextResponse.json({ requests, stats });
  } catch (error) {
    console.error("Error fetching admin dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}



