import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  candidateTokens,
  onboardingRequests,
  users,
  OnboardingStatus,
} from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { sendEmail } from "@/lib/email/resend";
import { getHRNotificationEmail } from "@/lib/email/templates";

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;
    const body = await request.json();

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

    // Check if already used
    if (tokenRecord.usedAt) {
      return NextResponse.json(
        { error: "Form already submitted" },
        { status: 400 }
      );
    }

    // Get the onboarding request
    const onboardingRequest = await db.query.onboardingRequests.findFirst({
      where: eq(onboardingRequests.id, tokenRecord.onboardingRequestId),
    });

    if (!onboardingRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Check if already submitted
    if (onboardingRequest.status !== OnboardingStatus.WAITING_FOR_CANDIDATE) {
      return NextResponse.json(
        { error: "Form already submitted" },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = [
      "taxIdNumber",
      "birthDate",
      "maritalStatusState",
      "addressLine1",
      "addressCity",
      "addressState",
      "addressZipCode",
      "candidatePhone",
      "candidateEmail",
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Update the onboarding request with candidate data
    await db
      .update(onboardingRequests)
      .set({
        taxIdNumber: body.taxIdNumber,
        birthDate: body.birthDate,
        maritalStatusState: body.maritalStatusState,
        addressLine1: body.addressLine1,
        addressLine2: body.addressLine2 || null,
        addressCity: body.addressCity,
        addressState: body.addressState,
        addressZipCode: body.addressZipCode,
        candidatePhone: body.candidatePhone,
        candidateEmail: body.candidateEmail,
        candidateSubmittedAt: new Date(),
        status: OnboardingStatus.WAITING_FOR_HR,
        updatedAt: new Date(),
      })
      .where(eq(onboardingRequests.id, tokenRecord.onboardingRequestId));

    // Mark token as used
    await db
      .update(candidateTokens)
      .set({
        usedAt: new Date(),
      })
      .where(eq(candidateTokens.id, tokenRecord.id));

    // Get ND info for the email
    const ndUser = await db.query.users.findFirst({
      where: eq(users.id, onboardingRequest.createdByNdId),
    });

    // Get all HR users to notify
    const hrUsers = await db.query.users.findMany({
      where: eq(users.role, "hr"),
    });

    // Send email notification to HR
    const hrLink = `${process.env.NEXT_PUBLIC_APP_URL}/hr/request/${onboardingRequest.id}`;
    
    for (const hrUser of hrUsers) {
      try {
        const emailContent = getHRNotificationEmail({
          candidateFirstName: onboardingRequest.candidateFirstName,
          candidateLastName: onboardingRequest.candidateLastName,
          ndName: ndUser?.name || ndUser?.email || "Unknown",
          tourName: onboardingRequest.tourName || "Not specified",
          requestId: onboardingRequest.id,
          hrLink,
        });

        await sendEmail({
          to: hrUser.email,
          subject: emailContent.subject,
          html: emailContent.html,
        });
      } catch (emailError) {
        console.error(`Failed to send HR notification to ${hrUser.email}:`, emailError);
      }
    }

    return NextResponse.json({
      message: "Form submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting candidate form:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

