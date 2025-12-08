import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { onboardingRequests, users, OnboardingStatus } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
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

    // Check if user is HR or Admin
    if (dbUser.role !== "hr" && dbUser.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get the onboarding request
    const onboardingRequest = await db.query.onboardingRequests.findFirst({
      where: eq(onboardingRequests.id, requestId),
    });

    if (!onboardingRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Check if request is waiting for HR
    if (onboardingRequest.status !== OnboardingStatus.WAITING_FOR_HR) {
      return NextResponse.json(
        { error: "Request is not waiting for HR completion" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      "changeEffectiveDate",
      "companyCode",
      "homeDepartment",
      "sui",
      "willWorkerCompleteI9",
      "eVerifyWorkLocation",
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Update the onboarding request with HR data
    await db
      .update(onboardingRequests)
      .set({
        changeEffectiveDate: body.changeEffectiveDate,
        companyCode: body.companyCode,
        homeDepartment: body.homeDepartment,
        sui: body.sui,
        willWorkerCompleteI9: body.willWorkerCompleteI9,
        eVerifyWorkLocation: body.eVerifyWorkLocation,
        assignedHrId: dbUser.id,
        hrCompletedAt: new Date(),
        status: OnboardingStatus.COMPLETED,
        updatedAt: new Date(),
      })
      .where(eq(onboardingRequests.id, requestId));

    // TODO: Send completion email to ND and optionally to HR

    return NextResponse.json({
      message: "Onboarding completed successfully",
    });
  } catch (error) {
    console.error("Error completing HR form:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

