import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { onboardingRequests, users, OnboardingStatus } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { US_STATES } from "@/lib/constants/hr-options";

interface ImportRow {
  candidateFirstName: string;
  candidateLastName: string;
  candidateEmail: string;
  candidatePhone: string;
  stateOfResidence: string;
  tourName: string;
  positionTitle?: string;
  hireDate: string;
  eventRate?: string;
  dayRate?: string;
  workerCategory: string;
  hireOrRehire: string;
  notes?: string;
}

interface ImportResult {
  success: boolean;
  row: number;
  candidateName?: string;
  candidateEmail?: string;
  error?: string;
  requestId?: number;
}

/**
 * POST /api/bulk-import
 * Bulk import new hire requests from CSV data
 * Available for Admin and HR only
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

    // Check if user is Admin or HR
    if (dbUser.role !== "admin" && dbUser.role !== "hr") {
      return NextResponse.json(
        { error: "Access denied. Only Admin and HR can bulk import." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { ndId, rows } = body as { ndId: number; rows: ImportRow[] };

    if (!ndId) {
      return NextResponse.json(
        { error: "ND ID is required" },
        { status: 400 }
      );
    }

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: "No data rows provided" },
        { status: 400 }
      );
    }

    // Verify the ND exists and is actually an ND
    const ndUser = await db.query.users.findFirst({
      where: eq(users.id, ndId),
    });

    if (!ndUser) {
      return NextResponse.json(
        { error: "Selected ND user not found" },
        { status: 404 }
      );
    }

    if (ndUser.role !== "nd" && ndUser.role !== "admin") {
      return NextResponse.json(
        { error: "Selected user is not an ND" },
        { status: 400 }
      );
    }

    // Get all existing candidate emails to check for duplicates
    const existingRequests = await db.query.onboardingRequests.findMany({
      columns: {
        candidateEmail: true,
      },
    });
    const existingEmails = new Set(
      existingRequests.map((r) => r.candidateEmail.toLowerCase())
    );

    const results: ImportResult[] = [];
    let successCount = 0;
    let errorCount = 0;

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 1;

      try {
        // Validate required fields
        const validationErrors: string[] = [];

        if (!row.candidateFirstName?.trim()) {
          validationErrors.push("candidateFirstName is required");
        }
        if (!row.candidateLastName?.trim()) {
          validationErrors.push("candidateLastName is required");
        }
        if (!row.candidateEmail?.trim()) {
          validationErrors.push("candidateEmail is required");
        }
        if (!row.candidatePhone?.trim()) {
          validationErrors.push("candidatePhone is required");
        }
        if (!row.stateOfResidence?.trim()) {
          validationErrors.push("stateOfResidence is required");
        }
        if (!row.tourName?.trim()) {
          validationErrors.push("tourName is required");
        }
        if (!row.hireDate?.trim()) {
          validationErrors.push("hireDate is required");
        }
        if (!row.workerCategory?.trim()) {
          validationErrors.push("workerCategory is required");
        }
        if (!row.hireOrRehire?.trim()) {
          validationErrors.push("hireOrRehire is required");
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (row.candidateEmail && !emailRegex.test(row.candidateEmail.trim())) {
          validationErrors.push("Invalid email format");
        }

        // Check for duplicate email
        if (row.candidateEmail && existingEmails.has(row.candidateEmail.toLowerCase().trim())) {
          validationErrors.push("Candidate email already exists in the system");
        }

        // Validate state
        if (row.stateOfResidence && !US_STATES.includes(row.stateOfResidence.toUpperCase().trim())) {
          validationErrors.push(`Invalid state: ${row.stateOfResidence}. Must be a valid US state code.`);
        }

        // Validate workerCategory
        const validCategories = ["W2", "1099"];
        if (row.workerCategory && !validCategories.includes(row.workerCategory.toUpperCase().trim())) {
          validationErrors.push(`Invalid workerCategory: ${row.workerCategory}. Must be W2 or 1099.`);
        }

        // Validate hireOrRehire
        const validHireTypes = ["new_hire", "rehire"];
        if (row.hireOrRehire && !validHireTypes.includes(row.hireOrRehire.toLowerCase().trim())) {
          validationErrors.push(`Invalid hireOrRehire: ${row.hireOrRehire}. Must be new_hire or rehire.`);
        }

        // Validate date format
        if (row.hireDate) {
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(row.hireDate.trim())) {
            validationErrors.push(`Invalid date format: ${row.hireDate}. Must be YYYY-MM-DD.`);
          } else {
            const date = new Date(row.hireDate.trim());
            if (isNaN(date.getTime())) {
              validationErrors.push(`Invalid date: ${row.hireDate}`);
            }
          }
        }

        // Validate rates (if provided)
        if (row.eventRate && isNaN(parseFloat(row.eventRate))) {
          validationErrors.push(`Invalid eventRate: ${row.eventRate}. Must be a number.`);
        }
        if (row.dayRate && isNaN(parseFloat(row.dayRate))) {
          validationErrors.push(`Invalid dayRate: ${row.dayRate}. Must be a number.`);
        }

        if (validationErrors.length > 0) {
          results.push({
            success: false,
            row: rowNumber,
            candidateName: `${row.candidateFirstName || ""} ${row.candidateLastName || ""}`.trim(),
            candidateEmail: row.candidateEmail,
            error: validationErrors.join("; "),
          });
          errorCount++;
          continue;
        }

        // Create the onboarding request with ND_TO_APPROVE status
        const [newRequest] = await db
          .insert(onboardingRequests)
          .values({
            createdByNdId: ndId,
            status: OnboardingStatus.ND_TO_APPROVE,
            candidateFirstName: row.candidateFirstName.trim(),
            candidateLastName: row.candidateLastName.trim(),
            candidateEmail: row.candidateEmail.trim().toLowerCase(),
            candidatePhone: row.candidatePhone.trim(),
            stateOfResidence: row.stateOfResidence.toUpperCase().trim(),
            tourName: row.tourName.trim(),
            positionTitle: row.positionTitle?.trim() || null,
            hireDate: row.hireDate.trim(),
            eventRate: row.eventRate ? row.eventRate.trim() : null,
            dayRate: row.dayRate ? row.dayRate.trim() : null,
            workerCategory: row.workerCategory.toUpperCase().trim(),
            hireOrRehire: row.hireOrRehire.toLowerCase().trim(),
            notes: row.notes?.trim() || null,
          })
          .returning();

        // Add email to existing set to prevent duplicates within the same import
        existingEmails.add(row.candidateEmail.toLowerCase().trim());

        results.push({
          success: true,
          row: rowNumber,
          candidateName: `${row.candidateFirstName} ${row.candidateLastName}`,
          candidateEmail: row.candidateEmail,
          requestId: newRequest.id,
        });
        successCount++;
      } catch (error: any) {
        results.push({
          success: false,
          row: rowNumber,
          candidateName: `${row.candidateFirstName || ""} ${row.candidateLastName || ""}`.trim(),
          candidateEmail: row.candidateEmail,
          error: error.message || "Unknown error",
        });
        errorCount++;
      }
    }

    return NextResponse.json({
      message: `Import completed. ${successCount} successful, ${errorCount} failed.`,
      totalRows: rows.length,
      successCount,
      errorCount,
      results,
    });
  } catch (error) {
    console.error("Error in bulk import:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

