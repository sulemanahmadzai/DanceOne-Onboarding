import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { onboardingRequests, candidateTokens, users, OnboardingStatus } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import crypto from "crypto";
import { sendEmail } from "@/lib/email/resend";
import { getCandidateInvitationEmail } from "@/lib/email/templates";

/**
 * POST /api/bulk-import/approve
 * Approve and send emails to selected candidates
 * Available for Admin, HR, and the assigned ND
 */
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
    const { requestIds } = body as { requestIds: number[] };

    if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
      return NextResponse.json(
        { error: "No request IDs provided" },
        { status: 400 }
      );
    }

    // Get all requests to approve
    const requestsToApprove = await db.query.onboardingRequests.findMany({
      where: inArray(onboardingRequests.id, requestIds),
    });

    if (requestsToApprove.length === 0) {
      return NextResponse.json(
        { error: "No valid requests found" },
        { status: 404 }
      );
    }

    // Check permissions for each request
    const results: {
      success: boolean;
      requestId: number;
      candidateName: string;
      candidateEmail: string;
      error?: string;
    }[] = [];

    let successCount = 0;
    let errorCount = 0;

    // Get base URL for candidate links
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      request.headers.get("origin") || 
      "http://localhost:3000";

    for (const onboardingRequest of requestsToApprove) {
      try {
        // Check if user has permission (Admin, HR, or the assigned ND)
        const isAdmin = dbUser.role === "admin";
        const isHR = dbUser.role === "hr";
        const isAssignedND = dbUser.id === onboardingRequest.createdByNdId;

        if (!isAdmin && !isHR && !isAssignedND) {
          results.push({
            success: false,
            requestId: onboardingRequest.id,
            candidateName: `${onboardingRequest.candidateFirstName} ${onboardingRequest.candidateLastName}`,
            candidateEmail: onboardingRequest.candidateEmail,
            error: "You don't have permission to approve this request",
          });
          errorCount++;
          continue;
        }

        // Check if request is in ND_TO_APPROVE status
        if (onboardingRequest.status !== OnboardingStatus.ND_TO_APPROVE) {
          results.push({
            success: false,
            requestId: onboardingRequest.id,
            candidateName: `${onboardingRequest.candidateFirstName} ${onboardingRequest.candidateLastName}`,
            candidateEmail: onboardingRequest.candidateEmail,
            error: `Request is not in 'ND to Approve' status (current: ${onboardingRequest.status})`,
          });
          errorCount++;
          continue;
        }

        // Generate token for candidate
        const token = crypto.randomBytes(32).toString("hex");
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 7 days

        // Create candidate token
        await db.insert(candidateTokens).values({
          onboardingRequestId: onboardingRequest.id,
          token,
          verificationCode,
          expiresAt,
        });

        // Update status to WAITING_FOR_CANDIDATE
        await db
          .update(onboardingRequests)
          .set({
            status: OnboardingStatus.WAITING_FOR_CANDIDATE,
            updatedAt: new Date(),
          })
          .where(eq(onboardingRequests.id, onboardingRequest.id));

        // Send email to candidate
        const candidateLink = `${baseUrl}/candidate/${token}`;

        try {
          const emailContent = getCandidateInvitationEmail({
            candidateFirstName: onboardingRequest.candidateFirstName,
            candidateLastName: onboardingRequest.candidateLastName,
            tourName: onboardingRequest.tourName || "",
            positionTitle: onboardingRequest.positionTitle || "",
            candidateLink,
          });

          await sendEmail({
            to: onboardingRequest.candidateEmail,
            subject: emailContent.subject,
            html: emailContent.html,
          });
        } catch (emailError) {
          console.error(`Failed to send email to ${onboardingRequest.candidateEmail}:`, emailError);
          // Don't fail the approval if email fails - the link is still available
        }

        results.push({
          success: true,
          requestId: onboardingRequest.id,
          candidateName: `${onboardingRequest.candidateFirstName} ${onboardingRequest.candidateLastName}`,
          candidateEmail: onboardingRequest.candidateEmail,
        });
        successCount++;
      } catch (error: any) {
        results.push({
          success: false,
          requestId: onboardingRequest.id,
          candidateName: `${onboardingRequest.candidateFirstName} ${onboardingRequest.candidateLastName}`,
          candidateEmail: onboardingRequest.candidateEmail,
          error: error.message || "Unknown error",
        });
        errorCount++;
      }
    }

    return NextResponse.json({
      message: `Approval completed. ${successCount} approved and sent, ${errorCount} failed.`,
      totalRequests: requestIds.length,
      successCount,
      errorCount,
      results,
    });
  } catch (error) {
    console.error("Error in bulk approve:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

