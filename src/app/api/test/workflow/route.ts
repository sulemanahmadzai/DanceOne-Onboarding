import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  onboardingRequests,
  candidateTokens,
  users,
  OnboardingStatus,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { sendEmail } from "@/lib/email/resend";
import { getCandidateInvitationEmail } from "@/lib/email/templates";
import {
  createDocumentFromTemplate,
  sendDocument,
} from "@/lib/pandadoc/client";

/**
 * Test endpoint for complete workflow testing
 * Bypasses authentication for testing purposes
 * ONLY USE IN DEVELOPMENT!
 */
export async function POST(request: Request) {
  // Only allow in development
  // Allow testing unless explicitly in production mode
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Test endpoint not available in production" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const {
      ndEmail,
      hrEmail,
      candidateEmail,
      candidateFirstName = "Test",
      candidateLastName = "User",
    } = body;

    if (!ndEmail || !hrEmail || !candidateEmail) {
      return NextResponse.json(
        {
          error:
            "ndEmail, hrEmail, and candidateEmail are required in request body",
        },
        { status: 400 }
      );
    }

    // Get ND user
    const ndUser = await db.query.users.findFirst({
      where: eq(users.email, ndEmail),
    });

    if (!ndUser) {
      return NextResponse.json(
        { error: `ND user not found: ${ndEmail}` },
        { status: 404 }
      );
    }

    // Get HR user (Maria Perez-Brau)
    const hrUser = await db.query.users.findFirst({
      where: and(eq(users.email, hrEmail), eq(users.role, "hr")),
    });

    if (!hrUser) {
      return NextResponse.json(
        { error: `HR user not found: ${hrEmail}` },
        { status: 404 }
      );
    }

    // Step 1: Create onboarding request
    const [newRequest] = await db
      .insert(onboardingRequests)
      .values({
        createdByNdId: ndUser.id,
        status: OnboardingStatus.WAITING_FOR_CANDIDATE,
        candidateFirstName,
        candidateLastName,
        candidateEmail,
        candidatePhone: body.candidatePhone || "555-1234",
        stateOfResidence: body.stateOfResidence || "CA",
        tourName: body.tourName || "Test Tour",
        positionTitle: body.positionTitle || "Show Manager",
        hireDate: body.hireDate || new Date().toISOString().split("T")[0],
        eventRate: body.eventRate || "1800.00",
        dayRate: body.dayRate || null,
        workerCategory: body.workerCategory || "W2",
        hireOrRehire: body.hireOrRehire || "new_hire",
        notes: body.notes || "Test workflow",
      })
      .returning();

    // Generate token for candidate
    const token = crypto.randomBytes(32).toString("hex");
    const verificationCode = "123456"; // Fixed for testing
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.insert(candidateTokens).values({
      onboardingRequestId: newRequest.id,
      token,
      verificationCode,
      expiresAt,
    });

    // Send email to candidate
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const candidateLink = `${baseUrl}/candidate/${token}`;

    try {
      const emailContent = getCandidateInvitationEmail({
        candidateFirstName,
        candidateLastName,
        tourName: body.tourName || "Test Tour",
        positionTitle: body.positionTitle || "Show Manager",
        candidateLink,
      });

      await sendEmail({
        to: candidateEmail,
        subject: emailContent.subject,
        html: emailContent.html,
      });
    } catch (emailError) {
      console.error("Failed to send candidate email:", emailError);
    }

    // Step 2: Candidate submits (simulate)
    await db
      .update(onboardingRequests)
      .set({
        status: OnboardingStatus.WAITING_FOR_HR,
        taxIdNumber: body.taxIdNumber || "123-45-6789",
        birthDate: body.birthDate || "1990-01-15",
        maritalStatusState: body.maritalStatusState || "single",
        addressLine1: body.addressLine1 || "123 Test St",
        addressCity: body.addressCity || "Los Angeles",
        addressState: body.addressState || "CA",
        addressZipCode: body.addressZipCode || "90001",
        candidateSubmittedAt: new Date(),
        assignedHrId: hrUser.id,
      })
      .where(eq(onboardingRequests.id, newRequest.id));

    // Step 3: HR completes (triggers PandaDoc)
    let pandadocDocumentId: string | null = null;
    let pandadocError: string | null = null;

    try {
      const doc = await createDocumentFromTemplate({
        firstName: candidateFirstName,
        lastName: candidateLastName,
        candidateEmail,
        jobTitle: body.positionTitle || "Show Manager",
        tourName: body.tourName || "Test Tour",
        startDate: body.hireDate || new Date().toISOString().split("T")[0],
        eventRate: body.eventRate || "1800.00",
        dayRate: body.dayRate || null,
        notes: body.notes || "Test workflow",
        ndEmail: ndUser.email,
        ndName: ndUser.name,
        hrEmail: hrUser.email,
        hrName: hrUser.name,
      });

      pandadocDocumentId = doc.id;

      // Send the document to start the signing process
      await sendDocument(doc.id);
    } catch (error: any) {
      pandadocError = error.message || String(error);
      console.error("PandaDoc error:", error);
    }

    // Update request with HR data and PandaDoc info
    await db
      .update(onboardingRequests)
      .set({
        changeEffectiveDate:
          body.changeEffectiveDate || new Date().toISOString().split("T")[0],
        companyCode: body.companyCode || "0AF",
        homeDepartment: body.homeDepartment || "10101",
        sui: body.sui || "06",
        willWorkerCompleteI9: body.willWorkerCompleteI9 || "YE",
        eVerifyWorkLocation: body.eVerifyWorkLocation || "Los Angeles, CA",
        hrCompletedAt: new Date(),
        status: OnboardingStatus.OFFER_LETTER_SENT,
        pandadocDocumentId: pandadocDocumentId,
        updatedAt: new Date(),
      })
      .where(eq(onboardingRequests.id, newRequest.id));

    return NextResponse.json({
      success: true,
      requestId: newRequest.id,
      candidateToken: token,
      candidateLink,
      pandadocDocumentId,
      pandadocError: pandadocError || undefined,
      message: "Complete workflow executed successfully",
      steps: {
        step1: "✅ Onboarding request created",
        step2: "✅ Candidate form submitted (simulated)",
        step3: pandadocDocumentId
          ? "✅ HR form completed - PandaDoc document created and sent"
          : `⚠️ HR form completed - PandaDoc error: ${pandadocError}`,
      },
      emails: {
        candidate: candidateEmail,
        nd: ndUser.email,
        hr: hrUser.email,
      },
    });
  } catch (error: any) {
    console.error("Test workflow error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
