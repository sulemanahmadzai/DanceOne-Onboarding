import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { candidateTokens, onboardingRequests, OnboardingStatus } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;

    // Find the token and check if it's valid
    const tokenRecord = await db.query.candidateTokens.findFirst({
      where: and(
        eq(candidateTokens.token, token),
        gt(candidateTokens.expiresAt, new Date())
      ),
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { error: "Invalid or expired link" },
        { status: 404 }
      );
    }

    // Check if already submitted
    if (tokenRecord.usedAt) {
      return NextResponse.json(
        { error: "Form already submitted", alreadySubmitted: true },
        { status: 400 }
      );
    }

    // Get the onboarding request
    const onboardingRequest = await db.query.onboardingRequests.findFirst({
      where: eq(onboardingRequests.id, tokenRecord.onboardingRequestId),
    });

    if (!onboardingRequest) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    // Check if candidate already submitted
    if (onboardingRequest.status !== OnboardingStatus.WAITING_FOR_CANDIDATE) {
      return NextResponse.json(
        { error: "Form already submitted", alreadySubmitted: true },
        { status: 400 }
      );
    }

    // Return prefilled data
    return NextResponse.json({
      candidateFirstName: onboardingRequest.candidateFirstName,
      candidateLastName: onboardingRequest.candidateLastName,
      candidateEmail: onboardingRequest.candidateEmail,
      candidatePhone: onboardingRequest.candidatePhone,
      stateOfResidence: onboardingRequest.stateOfResidence,
      tourName: onboardingRequest.tourName,
      positionTitle: onboardingRequest.positionTitle,
    });
  } catch (error) {
    console.error("Error fetching candidate data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

