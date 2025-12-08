import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { onboardingRequests, users, OnboardingStatus } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

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

    // Check if user is HR or Admin
    if (dbUser.role !== "hr" && dbUser.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Fetch all onboarding requests with creator info
    const requests = await db.query.onboardingRequests.findMany({
      orderBy: [desc(onboardingRequests.updatedAt)],
      with: {
        createdByNd: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Calculate stats
    const stats = {
      total: requests.length,
      waitingForCandidate: requests.filter(
        (r) => r.status === OnboardingStatus.WAITING_FOR_CANDIDATE
      ).length,
      waitingForHR: requests.filter(
        (r) => r.status === OnboardingStatus.WAITING_FOR_HR
      ).length,
      completed: requests.filter(
        (r) => r.status === OnboardingStatus.COMPLETED
      ).length,
    };

    return NextResponse.json({ requests, stats });
  } catch (error) {
    console.error("Error fetching HR requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

