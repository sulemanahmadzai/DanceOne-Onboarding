# PandaDoc Template Setup Guide

## Issue: ND Cannot Edit/Initial Document

If the ND recipient receives the email but cannot edit or initial the document, this is a **template configuration issue** in PandaDoc.

## Root Cause

The PandaDoc template needs to have **signature/initial fields assigned to each recipient role**. When creating documents via API, recipients can only interact with fields that are assigned to them in the template.

**The `role` property in the API must EXACTLY match the role names defined in your PandaDoc template.**

## Signing Flow

The correct signing flow is:
1. **ND (signing_order: 1)** → Receives email first → Adds initials
2. **HR - Maria Perez-Brau (signing_order: 2)** → Receives email after ND completes → Adds signature and date
3. **Candidate (signing_order: 3)** → Receives email after HR completes → Adds signature and date

PandaDoc handles this sequential flow automatically based on `signing_order`.

## Solution: Configure Template in PandaDoc Dashboard

### Step 1: Open Your Template

1. Log into PandaDoc dashboard
2. Go to **Templates**
3. Open your template (e.g., `SDA TOUR Offer 25-26 with TOKENS`)

### Step 2: Check Role Names in Template

1. Click **Edit Template**
2. Go to the **Recipients** or **Roles** section
3. Note the EXACT role names used. Common patterns:
   - `ND`, `HR`, `CDD` (custom names)
   - `Signer 1`, `Signer 2`, `Signer 3` (default names)
   - `Role 1`, `Role 2`, `Role 3`

### Step 3: Update Environment Variables

Add these to your `.env.local` file to match your template's role names:

```bash
# PandaDoc role names - MUST match your template exactly
PANDADOC_ROLE_ND=ND          # Role for first signer (initials)
PANDADOC_ROLE_HR=HR          # Role for second signer (HR signature)
PANDADOC_ROLE_CANDIDATE=CDD  # Role for third signer (candidate signature)
```

If your template uses different role names (like "Signer 1", "Signer 2", "Signer 3"):

```bash
PANDADOC_ROLE_ND=Signer 1
PANDADOC_ROLE_HR=Signer 2
PANDADOC_ROLE_CANDIDATE=Signer 3
```

### Step 4: Assign Fields to Roles in Template

For each signature/initial field in the template:
1. Click on the field
2. In the field properties panel, look for "Assigned to" or "Recipient"
3. Assign the field to the correct role:
   - **Initial fields** → Assign to ND role
   - **HR signature/date fields** → Assign to HR role
   - **Candidate signature/date fields** → Assign to Candidate role
4. Save the template

## Quick Check: Verify Template Configuration

1. **In PandaDoc Dashboard:**
   - Open the template
   - Check if signature/initial fields exist
   - Verify fields are assigned to recipients
   - Note the exact role names

2. **Test with a Manual Document:**
   - Create a document manually from the template
   - Add the same recipients with the same roles
   - Verify each can sign/initial their assigned fields
   - If they can't, the template needs configuration

## Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Can't edit/sign | Fields not assigned to role | Assign fields in template editor |
| Wrong person gets fields | Role name mismatch | Update env vars to match template |
| No fields visible | Template missing signature fields | Add signature/initial fields to template |
| "Viewer" mode | Recipient set as viewer | Change to "signer" in template roles |

## Debugging

Check the server logs for role configuration:

```
PandaDoc Role Configuration: {
  ND_ROLE: "ND",
  HR_ROLE: "HR", 
  CANDIDATE_ROLE: "CDD",
  note: "These roles MUST match the role names in your PandaDoc template"
}
```

If these don't match your template, update the environment variables.

## Need Help?

1. Check PandaDoc documentation: https://support.pandadoc.com/en/articles/9714650-add-and-manage-recipients
2. Check field assignment: https://support.pandadoc.com/en/articles/9714628-assigning-fields-to-recipients
3. Contact PandaDoc support for template configuration help



