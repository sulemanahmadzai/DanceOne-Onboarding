import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { onboardingRequests, OnboardingStatus } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getDocumentStatus } from "@/lib/pandadoc/client";

/**
 * Test endpoint to check PandaDoc document status and manually update onboarding status
 * 
 * GET /api/pandadoc/test?documentId=XXX - Check document status
 * POST /api/pandadoc/test - Manually check and update status for a request
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get("documentId");

  if (!documentId) {
    // List all requests with PandaDoc documents
    const requests = await db.query.onboardingRequests.findMany({
      columns: {
        id: true,
        pandadocDocumentId: true,
        status: true,
        candidateFirstName: true,
        candidateLastName: true,
        ndInitialsCompletedAt: true,
        hrSignatureCompletedAt: true,
        candidateSignatureCompletedAt: true,
      },
    });

    const requestsWithDocs = requests.filter(r => r.pandadocDocumentId);

    return NextResponse.json({
      message: "Requests with PandaDoc documents",
      count: requestsWithDocs.length,
      requests: requestsWithDocs,
    });
  }

  try {
    const status = await getDocumentStatus(documentId);
    return NextResponse.json({
      documentId,
      pandadocStatus: status,
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      documentId,
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { requestId, documentId } = body;

    if (!requestId && !documentId) {
      return NextResponse.json({
        error: "Either requestId or documentId is required",
      }, { status: 400 });
    }

    // Find the onboarding request
    let onboardingRequest;
    if (requestId) {
      onboardingRequest = await db.query.onboardingRequests.findFirst({
        where: eq(onboardingRequests.id, parseInt(requestId)),
      });
    } else {
      onboardingRequest = await db.query.onboardingRequests.findFirst({
        where: eq(onboardingRequests.pandadocDocumentId, documentId),
      });
    }

    if (!onboardingRequest) {
      return NextResponse.json({
        error: "Onboarding request not found",
      }, { status: 404 });
    }

    if (!onboardingRequest.pandadocDocumentId) {
      return NextResponse.json({
        error: "No PandaDoc document associated with this request",
        requestId: onboardingRequest.id,
        status: onboardingRequest.status,
      }, { status: 400 });
    }

    // Get the current document status from PandaDoc
    let pandadocStatus;
    try {
      pandadocStatus = await getDocumentStatus(onboardingRequest.pandadocDocumentId);
    } catch (error: any) {
      return NextResponse.json({
        error: `Failed to get PandaDoc status: ${error.message}`,
        requestId: onboardingRequest.id,
        pandadocDocumentId: onboardingRequest.pandadocDocumentId,
      }, { status: 500 });
    }

    // Check if document is completed
    const isCompleted = pandadocStatus.status === "document.completed" || 
                        pandadocStatus.status === "completed";

    if (isCompleted && onboardingRequest.status !== OnboardingStatus.ADP_COMPLETED) {
      // Update the status
      await db
        .update(onboardingRequests)
        .set({
          status: OnboardingStatus.ADP_COMPLETED,
          updatedAt: new Date(),
        })
        .where(eq(onboardingRequests.id, onboardingRequest.id));

      return NextResponse.json({
        message: "Status updated to ADP_COMPLETED",
        requestId: onboardingRequest.id,
        previousStatus: onboardingRequest.status,
        newStatus: OnboardingStatus.ADP_COMPLETED,
        pandadocStatus: pandadocStatus.status,
      });
    }

    return NextResponse.json({
      message: isCompleted ? "Already at correct status" : "Document not yet completed",
      requestId: onboardingRequest.id,
      currentStatus: onboardingRequest.status,
      pandadocStatus: pandadocStatus.status,
      pandadocRecipients: pandadocStatus.recipients,
    });
  } catch (error: any) {
    console.error("Error in PandaDoc test endpoint:", error);
    return NextResponse.json({
      error: error.message,
    }, { status: 500 });
  }
}
