import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import {
  onboardingRequests,
  candidateTokens,
  users,
  OnboardingStatus,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { sendEmail } from "@/lib/email/resend";
import { getCandidateInvitationEmail } from "@/lib/email/templates";

export async function POST(request: Request) {
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

    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      "candidateFirstName",
      "candidateLastName",
      "candidateEmail",
      "stateOfResidence",
      "tourName",
      "hireDate",
      "workerCategory",
      "hireOrRehire",
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Create the onboarding request
    const [newRequest] = await db
      .insert(onboardingRequests)
      .values({
        createdByNdId: dbUser.id,
        status: OnboardingStatus.WAITING_FOR_CANDIDATE,
        candidateFirstName: body.candidateFirstName,
        candidateLastName: body.candidateLastName,
        candidateEmail: body.candidateEmail,
        candidatePhone: body.candidatePhone || null,
        stateOfResidence: body.stateOfResidence,
        tourName: body.tourName,
        positionTitle: body.positionTitle || null,
        hireDate: body.hireDate,
        eventRate: body.eventRate || null,
        dayRate: body.dayRate || null,
        workerCategory: body.workerCategory,
        hireOrRehire: body.hireOrRehire,
        notes: body.notes || null,
      })
      .returning();

    // Generate a secure token for the candidate
    const token = crypto.randomBytes(32).toString("hex");
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 7 days

    await db.insert(candidateTokens).values({
      onboardingRequestId: newRequest.id,
      token,
      verificationCode,
      expiresAt,
    });

    // Send email to candidate
    const candidateLink = `${process.env.NEXT_PUBLIC_APP_URL}/candidate/${token}`;

    try {
      const emailContent = getCandidateInvitationEmail({
        candidateFirstName: body.candidateFirstName,
        candidateLastName: body.candidateLastName,
        tourName: body.tourName,
        positionTitle: body.positionTitle || "",
        candidateLink,
      });

      await sendEmail({
        to: body.candidateEmail,
        subject: emailContent.subject,
        html: emailContent.html,
      });
    } catch (emailError) {
      console.error("Failed to send candidate email:", emailError);
      // Don't fail the request if email fails - the link is still available
    }

    return NextResponse.json({
      id: newRequest.id,
      message: "Onboarding request created successfully",
      candidateLink,
    });
  } catch (error) {
    console.error("Error creating onboarding request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
