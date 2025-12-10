import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { onboardingRequests, candidateTokens, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const requestId = parseInt(params.id);

    if (isNaN(requestId)) {
      return NextResponse.json(
        { error: "Invalid request ID" },
        { status: 400 }
      );
    }

    // Get user from database
    const dbUser = await db.query.users.findFirst({
      where: eq(users.email, user.email!),
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch the onboarding request with relations
    const onboardingRequest = await db.query.onboardingRequests.findFirst({
      where: eq(onboardingRequests.id, requestId),
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

    if (!onboardingRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Check if user has access (ND who created it or HR/Admin)
    const isCreator = onboardingRequest.createdByNdId === dbUser.id;
    const isHROrAdmin = dbUser.role === "hr" || dbUser.role === "admin";

    if (!isCreator && !isHROrAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get the candidate token for the link
    const token = await db.query.candidateTokens.findFirst({
      where: eq(candidateTokens.onboardingRequestId, requestId),
    });

    const candidateLink = token
      ? `${process.env.NEXT_PUBLIC_APP_URL}/candidate/${token.token}`
      : null;

    return NextResponse.json({
      ...onboardingRequest,
      candidateLink,
    });
  } catch (error) {
    console.error("Error fetching onboarding request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
