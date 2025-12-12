import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { onboardingRequests, users, OnboardingStatus } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  createDocumentFromTemplate,
  sendDocument,
} from "@/lib/pandadoc/client";
import { sendEmail } from "@/lib/email/resend";

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

    // Check if request is waiting for HR (allow if already in offer letter sent status for retry)
    if (
      onboardingRequest.status !== OnboardingStatus.WAITING_FOR_HR &&
      onboardingRequest.status !== OnboardingStatus.OFFER_LETTER_SENT
    ) {
      return NextResponse.json(
        { error: "Request is not in a valid state for HR completion" },
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

    // Get ND user (creator) for PandaDoc
    const ndUser = await db.query.users.findFirst({
      where: eq(users.id, onboardingRequest.createdByNdId),
    });

    if (!ndUser) {
      return NextResponse.json(
        { error: "ND user not found" },
        { status: 404 }
      );
    }

    // Find Maria Perez-Brau (HR Chief People Officer)
    const mariaPerezBrau = await db.query.users.findFirst({
      where: and(
        eq(users.role, "hr"),
        eq(users.name, "Maria Perez-Brau")
      ),
    });

    if (!mariaPerezBrau) {
      return NextResponse.json(
        {
          error:
            "Maria Perez-Brau (Chief People Officer) not found. Please ensure she exists in the system.",
        },
        { status: 404 }
      );
    }

    // Create PandaDoc document
    let pandadocDocumentId: string | null = null;
    let pandadocError: string | null = null;
    
    try {
      console.log("Creating PandaDoc document for request:", requestId);
      console.log("ND User:", { email: ndUser.email, name: ndUser.name });
      console.log("HR User:", { email: mariaPerezBrau.email, name: mariaPerezBrau.name });
      console.log("Candidate:", {
        email: onboardingRequest.candidateEmail,
        name: `${onboardingRequest.candidateFirstName} ${onboardingRequest.candidateLastName}`,
      });

      const doc = await createDocumentFromTemplate({
        firstName: onboardingRequest.candidateFirstName,
        lastName: onboardingRequest.candidateLastName,
        candidateEmail: onboardingRequest.candidateEmail,
        jobTitle: onboardingRequest.positionTitle,
        tourName: onboardingRequest.tourName,
        startDate: onboardingRequest.hireDate
          ? new Date(onboardingRequest.hireDate).toISOString().split("T")[0]
          : null,
        eventRate: onboardingRequest.eventRate
          ? onboardingRequest.eventRate.toString()
          : null,
        dayRate: onboardingRequest.dayRate
          ? onboardingRequest.dayRate.toString()
          : null,
        notes: onboardingRequest.notes,
        ndEmail: ndUser.email,
        ndName: ndUser.name,
        hrEmail: mariaPerezBrau.email,
        hrName: mariaPerezBrau.name,
      });

      pandadocDocumentId = doc.id;
      console.log("PandaDoc document created successfully:", doc.id);

      // Send the document to start the signing process
      await sendDocument(doc.id);
      console.log("PandaDoc document sent successfully");

      // Send custom notification email to ND to let them know to check for PandaDoc email
      try {
        await sendEmail({
          to: ndUser.email,
          subject: `Offer Letter Ready for Your Initials - ${onboardingRequest.candidateFirstName} ${onboardingRequest.candidateLastName}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">DanceOne</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Onboarding Hub</p>
              </div>
              
              <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 10px 10px;">
                <h2 style="color: #333; margin-top: 0;">Hi ${ndUser.name || 'there'},</h2>
                
                <p>The offer letter for the new hire request you submitted is ready for your initials.</p>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0 0 10px 0;"><strong>Candidate:</strong> ${onboardingRequest.candidateFirstName} ${onboardingRequest.candidateLastName}</p>
                  <p style="margin: 0 0 10px 0;"><strong>Position:</strong> ${onboardingRequest.positionTitle || 'N/A'}</p>
                  <p style="margin: 0;"><strong>Tour:</strong> ${onboardingRequest.tourName || 'N/A'}</p>
                </div>
                
                <p><strong>Action Required:</strong> You will receive a separate email from PandaDoc with a link to add your initials. Please check your inbox (and spam folder) for an email from PandaDoc.</p>
                
                <div style="background: #FFF3CD; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FFC107;">
                  <p style="margin: 0; color: #856404;"><strong>Signing Flow:</strong></p>
                  <ol style="margin: 10px 0 0 0; padding-left: 20px; color: #856404;">
                    <li><strong>You (ND)</strong> - Add your initials ← You are here</li>
                    <li><strong>HR (Maria Perez-Brau)</strong> - Sign and date</li>
                    <li><strong>Candidate</strong> - Sign and date</li>
                  </ol>
                </div>
                
                <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">
                
                <p style="color: #999; font-size: 12px; margin: 0;">
                  This is an automated message from DanceOne Onboarding Hub.
                </p>
              </div>
            </body>
            </html>
          `,
        });
        console.log(`✅ Notification email sent to ND ${ndUser.email}`);
      } catch (emailError) {
        console.error("Error sending ND notification email:", emailError);
        // Don't fail if email fails - PandaDoc will still send its own email
      }
    } catch (error: any) {
      pandadocError = error.message || String(error);
      console.error("PandaDoc error details:", {
        message: error.message,
        stack: error.stack,
        error: error,
        requestId,
        candidateEmail: onboardingRequest.candidateEmail,
        ndEmail: ndUser.email,
        hrEmail: mariaPerezBrau.email,
      });
      // Continue with status update even if PandaDoc fails
      // The document can be created manually if needed
    }

    // Update the onboarding request with HR data and new status
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
        status: OnboardingStatus.OFFER_LETTER_SENT,
        pandadocDocumentId: pandadocDocumentId,
        updatedAt: new Date(),
      })
      .where(eq(onboardingRequests.id, requestId));

    return NextResponse.json({
      message: pandadocError
        ? `Onboarding completed but PandaDoc error: ${pandadocError}`
        : "Onboarding completed and offer letter sent successfully",
      pandadocDocumentId,
      pandadocError: pandadocError || undefined,
    });
  } catch (error) {
    console.error("Error completing HR form:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

