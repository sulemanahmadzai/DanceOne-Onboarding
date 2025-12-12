/**
 * PandaDoc API Client
 * Handles document creation, sending, and webhook events
 */

const PANDADOC_API_KEY = process.env.PANDADOC_API_KEY;
const PANDADOC_TEMPLATE_UUID = process.env.PANDADOC_TEMPLATE_UUID;
const PANDADOC_API_BASE = "https://api.pandadoc.com/public/v1";

// Role names - these MUST match the role names in your PandaDoc template
// You can override these via environment variables if your template uses different names
const PANDADOC_ROLE_ND = process.env.PANDADOC_ROLE_ND || "ND";
const PANDADOC_ROLE_HR = process.env.PANDADOC_ROLE_HR || "HR";
const PANDADOC_ROLE_CANDIDATE = process.env.PANDADOC_ROLE_CANDIDATE || "CDD";

interface CreateDocumentParams {
  firstName: string;
  lastName: string;
  candidateEmail: string;
  jobTitle: string | null;
  tourName: string | null;
  startDate: string | null;
  eventRate: string | null;
  dayRate: string | null;
  notes: string | null;
  ndEmail: string;
  ndName: string | null;
  hrEmail: string;
  hrName: string | null;
}

interface PandaDocRecipient {
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string; // Role is optional and must match template roles if provided
  signing_order?: number;
}

interface PandaDocField {
  name: string;
  value: string;
}

/**
 * Create a document from template with recipients
 */
export async function createDocumentFromTemplate(
  params: CreateDocumentParams
): Promise<{ id: string; status: string }> {
  if (!PANDADOC_API_KEY || !PANDADOC_TEMPLATE_UUID) {
    throw new Error("PandaDoc API key or template UUID not configured");
  }

  // Determine rate to use: prefer event rate if both exist, otherwise use whichever is filled
  const rate = params.eventRate || params.dayRate || "";

  // Prepare recipients in order:
  // 1. ND (for initials) - signing_order 1
  // 2. HR - Maria Perez-Brau (for signature) - signing_order 2
  // 3. Candidate (for signature) - signing_order 3
  //
  // IMPORTANT: The 'role' property MUST match the role names defined in your PandaDoc template.
  // In the template, each signature/initial field is assigned to a specific role.
  // The recipient with matching role will be able to fill those fields.
  //
  // Common template role names:
  // - "ND" or "Signer 1" for the first signer (initials)
  // - "HR" or "Signer 2" for the second signer (signature)
  // - "Candidate" or "CDD" or "Signer 3" for the third signer (signature)
  //
  // If you're still having issues with recipients not being able to edit fields:
  // 1. Open your template in PandaDoc dashboard
  // 2. Check what role names are assigned to each signature/initial field
  // 3. Update the 'role' values below to match exactly
  const recipients: PandaDocRecipient[] = [
    {
      email: params.ndEmail,
      first_name: params.ndName?.split(" ")[0] || "",
      last_name: params.ndName?.split(" ").slice(1).join(" ") || "",
      role: PANDADOC_ROLE_ND, // Must match the role name in your PandaDoc template for initial fields
      signing_order: 1, // First to sign - ND adds initials
    },
    {
      email: params.hrEmail,
      first_name: params.hrName?.split(" ")[0] || "Maria",
      last_name: params.hrName?.split(" ").slice(1).join(" ") || "Perez-Brau",
      role: PANDADOC_ROLE_HR, // Must match the role name in your PandaDoc template for HR signature fields
      signing_order: 2, // Second to sign - HR adds signature and date
    },
    {
      email: params.candidateEmail,
      first_name: params.firstName,
      last_name: params.lastName,
      role: PANDADOC_ROLE_CANDIDATE, // Must match the role name in your PandaDoc template for candidate signature fields
      signing_order: 3, // Third to sign - Candidate adds signature and date
    },
  ];

  console.log(
    "PandaDoc Recipients Order:",
    recipients.map((r, i) => ({
      position: i + 1,
      email: r.email,
      role: r.role,
      signing_order: r.signing_order,
    }))
  );
  console.log("PandaDoc Role Configuration:", {
    ND_ROLE: PANDADOC_ROLE_ND,
    HR_ROLE: PANDADOC_ROLE_HR,
    CANDIDATE_ROLE: PANDADOC_ROLE_CANDIDATE,
    note: "These roles MUST match the role names in your PandaDoc template",
  });

  // PandaDoc API expects tokens to match exactly what's in the template
  // Template uses: [Candidate.FirstName], [Candidate.LastName], [Candidate.Title], [startDate], [rateEvent], [Extra.Notes]
  const fieldMapping: Record<string, string> = {
    "Candidate.FirstName": params.firstName,
    "Candidate.LastName": params.lastName,
    "Candidate.Title": params.jobTitle || "",
    startDate: params.startDate || "",
    rateEvent: rate,
    "Extra.Notes": params.notes || "",
  };

  // PandaDoc API expects tokens as an array of objects with name and value
  // Tokens should match the template token names exactly
  const tokens = Object.entries(fieldMapping).map(([name, value]) => ({
    name,
    value: String(value),
  }));

  const requestBody = {
    name: `Offer Letter - ${params.firstName} ${params.lastName}`,
    template_uuid: PANDADOC_TEMPLATE_UUID,
    recipients,
    tokens, // PandaDoc uses "tokens" not "fields", and it's an array
    metadata: {
      onboarding_request_id: "", // Will be set by caller
    },
  };

  console.log("PandaDoc API Request:", {
    url: `${PANDADOC_API_BASE}/documents`,
    template_uuid: PANDADOC_TEMPLATE_UUID,
    recipients_count: recipients.length,
    tokens_count: tokens.length,
    has_api_key: !!PANDADOC_API_KEY,
  });

  let response: Response;
  try {
    // Add timeout and better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    response = await fetch(`${PANDADOC_API_BASE}/documents`, {
      method: "POST",
      headers: {
        Authorization: `API-Key ${PANDADOC_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
  } catch (fetchError: any) {
    const errorDetails: any = {
      message: fetchError.message,
      url: `${PANDADOC_API_BASE}/documents`,
      apiKeyLength: PANDADOC_API_KEY?.length || 0,
    };

    if (fetchError.name === "AbortError") {
      errorDetails.reason = "Request timeout after 30 seconds";
    } else if (fetchError.cause) {
      errorDetails.cause = fetchError.cause.message || fetchError.cause;
    }

    console.error("PandaDoc fetch error details:", errorDetails);

    throw new Error(
      `PandaDoc API connection failed: ${fetchError.message}. ` +
        `Please check: 1) API key is correct, 2) Network connectivity, 3) PandaDoc service status`
    );
  }

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `PandaDoc API error: ${response.status}`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage += ` - ${JSON.stringify(errorJson)}`;
    } catch {
      errorMessage += ` - ${errorText}`;
    }
    console.error("PandaDoc API Error Details:", {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
      requestBody: JSON.stringify(requestBody, null, 2),
    });
    throw new Error(errorMessage);
  }

  const data = await response.json();
  console.log("PandaDoc Document Created:", {
    id: data.id,
    status: data.status,
  });

  return {
    id: data.id,
    status: data.status,
  };
}

/**
 * Wait for document to be ready (status: document.draft)
 * PandaDoc processes documents asynchronously after creation
 */
async function waitForDocumentReady(
  documentId: string,
  maxAttempts: number = 10,
  delayMs: number = 2000
): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const status = await getDocumentStatus(documentId);

    if (status.status === "document.draft") {
      console.log(`Document ${documentId} is ready (document.draft)`);
      return;
    }

    if (status.status === "document.error") {
      throw new Error(`Document processing failed: ${documentId}`);
    }

    console.log(
      `Waiting for document ${documentId} to be ready... (${attempt}/${maxAttempts}) Status: ${status.status}`
    );

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error(
    `Document ${documentId} did not become ready within ${
      maxAttempts * delayMs
    }ms`
  );
}

/**
 * Send document to recipients
 * PandaDoc automatically handles sequential sending based on signing_order:
 * 1. Sends to ND (signing_order: 1) for initials
 * 2. After ND completes, automatically sends to HR (signing_order: 2) for signature
 * 3. After HR completes, automatically sends to Candidate (signing_order: 3) for signature
 *
 * Each recipient receives an email automatically when it's their turn to sign.
 */
export async function sendDocument(documentId: string): Promise<void> {
  if (!PANDADOC_API_KEY) {
    throw new Error("PandaDoc API key not configured");
  }

  console.log("Waiting for document to be ready before sending:", documentId);

  // Wait for document to be in draft status before sending
  await waitForDocumentReady(documentId);

  console.log("Sending PandaDoc document to recipients:", documentId);

  const response = await fetch(
    `${PANDADOC_API_BASE}/documents/${documentId}/send`,
    {
      method: "POST",
      headers: {
        Authorization: `API-Key ${PANDADOC_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Please review and complete the offer letter.",
        subject: "Offer Letter - Action Required",
        silent: false, // Ensure email is sent
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `PandaDoc send error: ${response.status}`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage += ` - ${JSON.stringify(errorJson)}`;
    } catch {
      errorMessage += ` - ${errorText}`;
    }
    console.error("PandaDoc Send Error:", {
      status: response.status,
      error: errorText,
    });
    throw new Error(errorMessage);
  }

  const result = await response.json();
  console.log("PandaDoc Document Sent - Sequential signing will begin:", {
    documentId,
    result,
    note: "ND will receive email first, then HR, then Candidate automatically",
  });
}

/**
 * Get document status
 */
export async function getDocumentStatus(
  documentId: string
): Promise<{ status: string; recipients: any[] }> {
  if (!PANDADOC_API_KEY) {
    throw new Error("PandaDoc API key not configured");
  }

  const response = await fetch(`${PANDADOC_API_BASE}/documents/${documentId}`, {
    headers: {
      Authorization: `API-Key ${PANDADOC_API_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PandaDoc API error: ${response.status} - ${error}`);
  }

  return await response.json();
}

/**
 * Send email to candidate when document is ready
 */
export async function sendCandidateEmail(
  candidateEmail: string,
  candidateFirstName: string
): Promise<void> {
  // This will be handled by PandaDoc's email system when the document is sent
  // But we can also send a custom email if needed
  // For now, PandaDoc will handle the email when we call sendDocument
}
