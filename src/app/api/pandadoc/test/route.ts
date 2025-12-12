import { NextResponse } from "next/server";
import { createDocumentFromTemplate } from "@/lib/pandadoc/client";

/**
 * Test endpoint for PandaDoc integration
 * This helps debug PandaDoc API issues
 */
export async function GET() {
  try {
    const apiKey = process.env.PANDADOC_API_KEY;
    const templateUuid = process.env.PANDADOC_TEMPLATE_UUID;

    return NextResponse.json({
      configured: {
        hasApiKey: !!apiKey,
        hasTemplateUuid: !!templateUuid,
        apiKeyLength: apiKey?.length || 0,
        templateUuid: templateUuid || "NOT SET",
      },
      message:
        "PandaDoc configuration check. Use POST to test document creation.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Test document creation with sample data
    const doc = await createDocumentFromTemplate({
      firstName: body.firstName || "Test",
      lastName: body.lastName || "User",
      candidateEmail: body.candidateEmail || "test@example.com",
      jobTitle: body.jobTitle || "Test Position",
      tourName: body.tourName || "Test Tour",
      startDate: body.startDate || new Date().toISOString().split("T")[0],
      eventRate: body.eventRate || "100",
      dayRate: body.dayRate || null,
      notes: body.notes || "Test notes",
      ndEmail: body.ndEmail || "nd@example.com",
      ndName: body.ndName || "Test ND",
      hrEmail: body.hrEmail || "hr@example.com",
      hrName: body.hrName || "Maria Perez-Brau",
    });

    return NextResponse.json({
      success: true,
      documentId: doc.id,
      status: doc.status,
      message: "Test document created successfully",
    });
  } catch (error: any) {
    console.error("PandaDoc test error:", error);
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



