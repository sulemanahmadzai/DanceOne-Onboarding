import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { onboardingRequests, users, OnboardingStatus } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

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

    // Check if user is HR or Admin
    if (dbUser.role !== "hr" && dbUser.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { ids } = body;

    // Fetch the requested records
    let records;
    if (ids && ids.length > 0) {
      records = await db.query.onboardingRequests.findMany({
        where: inArray(onboardingRequests.id, ids),
      });
    } else {
      records = await db.query.onboardingRequests.findMany({
        where: eq(onboardingRequests.status, OnboardingStatus.COMPLETED),
      });
    }

    // Define CSV columns in ADP-compatible order
    const columns = [
      { key: "candidateFirstName", header: "Candidate First Name" },
      { key: "candidateLastName", header: "Candidate Last Name" },
      { key: "taxIdNumber", header: "Tax ID Number" },
      { key: "birthDate", header: "Birth Date" },
      { key: "addressLine1", header: "Address Line 1" },
      { key: "addressLine2", header: "Address Line 2" },
      { key: "addressCity", header: "City" },
      { key: "addressState", header: "State" },
      { key: "addressZipCode", header: "Zip Code" },
      { key: "candidatePhone", header: "Phone" },
      { key: "candidateEmail", header: "Email" },
      { key: "stateOfResidence", header: "State of Residence" },
      { key: "tourName", header: "Tour Name" },
      { key: "positionTitle", header: "Position Title" },
      { key: "hireDate", header: "Hire Date" },
      { key: "eventRate", header: "Event Rate (RATE 1)" },
      { key: "dayRate", header: "Day Rate (RATE 1)" },
      { key: "workerCategory", header: "Worker Category (1099/W2)" },
      { key: "hireOrRehire", header: "Hire or Rehire" },
      { key: "maritalStatusState", header: "Marital Status" },
      { key: "changeEffectiveDate", header: "Change Effective Date" },
      { key: "companyCode", header: "Company Code" },
      { key: "homeDepartment", header: "Home Department" },
      { key: "sui", header: "SUI" },
      { key: "willWorkerCompleteI9", header: "Will Worker Complete I-9" },
      { key: "eVerifyWorkLocation", header: "E-Verify Work Location" },
    ];

    // Generate CSV content
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return "";
      const str = String(value);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const formatDate = (date: string | null): string => {
      if (!date) return "";
      try {
        return new Date(date).toLocaleDateString("en-US");
      } catch {
        return date;
      }
    };

    // Header row
    const headerRow = columns.map((col) => escapeCSV(col.header)).join(",");

    // Data rows
    const dataRows = records.map((record: any) => {
      return columns
        .map((col) => {
          let value = record[col.key];

          // Format dates
          if (
            ["birthDate", "hireDate", "changeEffectiveDate"].includes(col.key)
          ) {
            value = formatDate(value);
          }

          // Format hire/rehire
          if (col.key === "hireOrRehire") {
            value =
              value === "new_hire"
                ? "New Hire"
                : value === "rehire"
                ? "Rehire"
                : value;
          }

          // Format marital status
          if (col.key === "maritalStatusState" && value) {
            value = value.charAt(0).toUpperCase() + value.slice(1);
          }

          // Format I-9
          if (col.key === "willWorkerCompleteI9" && value) {
            value = value.toUpperCase();
          }

          return escapeCSV(value);
        })
        .join(",");
    });

    const csvContent = [headerRow, ...dataRows].join("\n");

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="danceone-onboarding-export-${
          new Date().toISOString().split("T")[0]
        }.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting records:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
