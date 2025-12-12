import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { onboardingRequests, users, OnboardingStatus } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { sendEmail } from "@/lib/email/resend";

/**
 * GET endpoint to verify webhook is accessible
 * PandaDoc may use this to verify the webhook URL
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "PandaDoc webhook endpoint is active",
    timestamp: new Date().toISOString(),
  });
}

/**
 * PandaDoc Webhook Handler
 * Handles document status updates and signature events
 * 
 * PandaDoc webhook event types:
 * - document_state_changed: When document status changes (draft, sent, completed, etc.)
 * - recipient_completed: When a recipient completes their signing
 * - document_completed: Alternative event when all signatures are done
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Log the full webhook payload for debugging
    console.log("📨 PandaDoc Webhook Received:", JSON.stringify(body, null, 2));

    // PandaDoc webhook events
    // See: https://developers.pandadoc.com/reference/webhooks
    // Note: PandaDoc uses different event names in different versions
    const eventType = body.event || body.type || body.name;
    const documentId = body.data?.id || body.data?.document?.id || body.document?.id;
    const documentStatus = body.data?.status || body.document?.status || body.status;

    console.log("📋 Webhook Details:", {
      eventType,
      documentId,
      documentStatus,
      rawEvent: body.event,
      rawType: body.type,
      rawName: body.name,
    });

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID not found in webhook" },
        { status: 400 }
      );
    }

    // Find the onboarding request by PandaDoc document ID
    const onboardingRequest = await db.query.onboardingRequests.findFirst({
      where: eq(onboardingRequests.pandadocDocumentId, documentId),
    });

    if (!onboardingRequest) {
      console.warn(
        `No onboarding request found for PandaDoc document: ${documentId}`
      );
      return NextResponse.json({ message: "Request not found" });
    }

    // Get ND and HR user info for email matching
    const ndUser = await db.query.users.findFirst({
      where: eq(users.id, onboardingRequest.createdByNdId),
    });

    const mariaPerezBrau = await db.query.users.findFirst({
      where: and(
        eq(users.role, "hr"),
        eq(users.name, "Maria Perez-Brau")
      ),
    });

    // Handle different event types
    // PandaDoc can send: document_state_changed, document_status_changed, document.completed, recipient_completed
    switch (eventType) {
      case "document_state_changed":
      case "document_status_changed":
      case "document.state_changed":
        // Check for document completion
        const status = documentStatus || body.data?.status;
        console.log(`📄 Document state changed to: ${status}`);
        
        if (status === "document.completed" || status === "completed") {
          // All signatures completed - update status to ADP_COMPLETED
          await db
            .update(onboardingRequests)
            .set({
              status: OnboardingStatus.ADP_COMPLETED,
              updatedAt: new Date(),
            })
            .where(eq(onboardingRequests.id, onboardingRequest.id));

          console.log(
            `✅ All signatures completed for document ${documentId}, request ${onboardingRequest.id}`
          );
        } else if (status === "document.sent" || status === "sent") {
          console.log(`📤 Document ${documentId} was sent`);
        } else if (status === "document.viewed" || status === "viewed") {
          console.log(`👁️ Document ${documentId} was viewed`);
        }
        break;

      case "document_completed":
      case "document.completed":
        // Alternative event for document completion
        await db
          .update(onboardingRequests)
          .set({
            status: OnboardingStatus.ADP_COMPLETED,
            updatedAt: new Date(),
          })
          .where(eq(onboardingRequests.id, onboardingRequest.id));

        console.log(
          `✅ Document completed event for ${documentId}, request ${onboardingRequest.id}`
        );
        break;

      case "recipient_completed":
        // When a recipient completes their part (initials or signature)
        const recipient = body.data?.recipient;
        const recipientEmail = recipient?.email;
        const completedAt = new Date();

        console.log(
          `Recipient completed for document ${documentId}:`,
          recipientEmail,
          recipient
        );

        // Track ND initials completion (signing_order: 1)
        if (ndUser && recipientEmail === ndUser.email) {
          await db
            .update(onboardingRequests)
            .set({
              ndInitialsCompletedAt: completedAt,
              updatedAt: completedAt,
            })
            .where(eq(onboardingRequests.id, onboardingRequest.id));

          console.log(
            `✅ ND initials completed for request ${onboardingRequest.id} by ${ndUser.email}`
          );

          // After ND completes initials, HR (Maria Perez-Brau) will receive PandaDoc email automatically
          // Send custom notification email to HR with additional context
          if (mariaPerezBrau) {
            try {
              await sendEmail({
                to: mariaPerezBrau.email,
                subject: `Offer Letter Ready for Signature - ${onboardingRequest.candidateFirstName} ${onboardingRequest.candidateLastName}`,
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
                      <h2 style="color: #333; margin-top: 0;">Hi Maria,</h2>
                      
                      <p>The ND has completed their initials on the offer letter. It's now your turn to sign.</p>
                      
                      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0 0 10px 0;"><strong>Candidate:</strong> ${onboardingRequest.candidateFirstName} ${onboardingRequest.candidateLastName}</p>
                        <p style="margin: 0 0 10px 0;"><strong>Tour:</strong> ${onboardingRequest.tourName || 'N/A'}</p>
                        <p style="margin: 0;"><strong>ND:</strong> ${ndUser.name || ndUser.email}</p>
                      </div>
                      
                      <p>You will receive a separate email from PandaDoc with a link to sign the document. Please add your signature and date.</p>
                      
                      <p style="color: #666; font-size: 14px;"><strong>Note:</strong> After you sign, the candidate will automatically receive the document for their signature.</p>
                      
                      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">
                      
                      <p style="color: #999; font-size: 12px; margin: 0;">
                        This is an automated message from DanceOne Onboarding Hub.
                      </p>
                    </div>
                  </body>
                  </html>
                `,
              });
              console.log(
                `✅ Custom notification email sent to HR ${mariaPerezBrau.email} after ND initials`
              );
            } catch (emailError) {
              console.error("Error sending HR notification email:", emailError);
              // Don't fail the webhook if email fails
            }
          }
        }
        // Track HR signature completion (signing_order: 2)
        else if (
          mariaPerezBrau &&
          recipientEmail === mariaPerezBrau.email
        ) {
          await db
            .update(onboardingRequests)
            .set({
              hrSignatureCompletedAt: completedAt,
              updatedAt: completedAt,
            })
            .where(eq(onboardingRequests.id, onboardingRequest.id));

          console.log(
            `✅ HR signature completed for request ${onboardingRequest.id} by ${mariaPerezBrau.email}`
          );

          // After HR signs, candidate will receive the document automatically via PandaDoc
          // Send custom email to candidate with ADP instructions
          try {
            await sendEmail({
              to: onboardingRequest.candidateEmail,
              subject: "Offer Letter - Action Required",
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
                  </div>
                  
                  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #333; margin-top: 0;">Dear ${onboardingRequest.candidateFirstName},</h2>
                    
                    <p>Please carefully review your attached Offer Letter. Once signed, you will receive an email from ADP within 24–48 hours to begin your onboarding process.</p>
                    
                    <p><strong>Please note:</strong> completing your ADP onboarding is required in order to be paid. If you need assistance, contact ADP at 1-855-547-8508.</p>
                    
                    <p>Best regards,<br>DanceOne Team</p>
                  </div>
                </body>
                </html>
              `,
            });
            console.log(
              `✅ Custom email sent to candidate ${onboardingRequest.candidateEmail} after HR signature`
            );
          } catch (emailError) {
            console.error("Error sending candidate email:", emailError);
            // Don't fail the webhook if email fails
          }
        }
        // Track Candidate signature completion (signing_order: 3)
        else if (recipientEmail === onboardingRequest.candidateEmail) {
          await db
            .update(onboardingRequests)
            .set({
              candidateSignatureCompletedAt: completedAt,
              updatedAt: completedAt,
            })
            .where(eq(onboardingRequests.id, onboardingRequest.id));

          console.log(
            `✅ Candidate signature completed for request ${onboardingRequest.id} by ${onboardingRequest.candidateEmail}`
          );
        } else {
          console.warn(
            `Unknown recipient completed: ${recipientEmail} for document ${documentId}`
          );
        }
        break;

      default:
        console.log(`Unhandled PandaDoc webhook event: ${eventType}`);
    }

    return NextResponse.json({ message: "Webhook processed successfully" });
  } catch (error) {
    console.error("Error processing PandaDoc webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

