import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { US_STATES } from "@/lib/constants/hr-options";

/**
 * GET /api/bulk-import/template
 * Download CSV template for bulk importing new hire requests
 * Available for Admin and HR only
 */
export async function GET() {
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
        { error: "Access denied. Only Admin and HR can download the template." },
        { status: 403 }
      );
    }

    // Create CSV content with headers and example row
    const headers = [
      "candidateFirstName",
      "candidateLastName",
      "candidateEmail",
      "candidatePhone",
      "stateOfResidence",
      "tourName",
      "positionTitle",
      "hireDate",
      "eventRate",
      "dayRate",
      "workerCategory",
      "hireOrRehire",
      "notes",
    ];

    // Create instructions/comments
    const instructions = [
      "# BULK IMPORT TEMPLATE - DanceOne Onboarding Hub",
      "# Instructions:",
      "# 1. Fill in the data starting from row 4 (after the headers)",
      "# 2. Required fields: candidateFirstName, candidateLastName, candidateEmail, candidatePhone, stateOfResidence, tourName, hireDate, workerCategory, hireOrRehire",
      "# 3. Optional fields: positionTitle, eventRate, dayRate, notes",
      "# 4. Valid values for stateOfResidence: " + US_STATES.slice(0, 10).join(", ") + "... (all US state codes)",
      "# 5. Valid values for workerCategory: W2, 1099",
      "# 6. Valid values for hireOrRehire: new_hire, rehire",
      "# 7. Date format for hireDate: YYYY-MM-DD (e.g., 2025-01-15)",
      "# 8. Rates should be numbers without $ sign (e.g., 500.00)",
      "#",
    ];

    // Example row
    const exampleRow = [
      "John",
      "Doe",
      "john.doe@example.com",
      "555-123-4567",
      "CA",
      "Summer Tour 2025",
      "Stage Manager",
      "2025-06-01",
      "500.00",
      "150.00",
      "W2",
      "new_hire",
      "Experienced professional",
    ];

    // Build CSV content
    const csvLines = [
      ...instructions,
      headers.join(","),
      exampleRow.join(","),
    ];

    const csvContent = csvLines.join("\n");

    // Return as downloadable CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="bulk_import_template.csv"',
      },
    });
  } catch (error) {
    console.error("Error generating template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

