import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import {
  onboardingRequests,
  candidateTokens,
  users,
  hrAssignments,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Helper function to get base URL from request
function getBaseUrl(request: Request | NextRequest): string {
  // Try to get from environment variable first
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // Try to get from NextRequest's nextUrl
  if (request instanceof NextRequest && request.nextUrl) {
    return request.nextUrl.origin;
  }
  
  // Fallback: extract from headers
  const host = request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") || "https";
  
  if (host) {
    return `${protocol}://${host}`;
  }
  
  // Last resort fallback
  return process.env.APP_URL || "http://localhost:3000";
}

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

    const baseUrl = getBaseUrl(request);
    const candidateLink = token
      ? `${baseUrl}/candidate/${token.token}`
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

export async function PUT(
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

    const dbUser = await db.query.users.findFirst({
      where: eq(users.email, user.email!),
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const onboardingRequest = await db.query.onboardingRequests.findFirst({
      where: eq(onboardingRequests.id, requestId),
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

    const body = await request.json();

    // Update the request with the provided fields
    const [updated] = await db
      .update(onboardingRequests)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(onboardingRequests.id, requestId))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating onboarding request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const dbUser = await db.query.users.findFirst({
      where: eq(users.email, user.email!),
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only HR and Admin can delete
    if (dbUser.role !== "hr" && dbUser.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const onboardingRequest = await db.query.onboardingRequests.findFirst({
      where: eq(onboardingRequests.id, requestId),
    });

    if (!onboardingRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Delete related candidate tokens first
    await db
      .delete(candidateTokens)
      .where(eq(candidateTokens.onboardingRequestId, requestId));

    // Delete related HR assignments
    await db
      .delete(hrAssignments)
      .where(eq(hrAssignments.onboardingRequestId, requestId));

    // Delete the onboarding request
    await db
      .delete(onboardingRequests)
      .where(eq(onboardingRequests.id, requestId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting onboarding request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
