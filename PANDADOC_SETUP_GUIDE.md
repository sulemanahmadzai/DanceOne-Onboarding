# PandaDoc Setup and Testing Guide

## Why ND Didn't Receive Email

The document was created successfully, but **sending failed** with this error:

```
403 - "You are not allowed to send documents outside of your organization"
```

## The Problem

**PandaDoc Sandbox Mode Restriction:**

- In sandbox mode, you can only send documents to email addresses that are **registered in your PandaDoc organization**
- The emails `s82004966@gmail.com` and `anesaahmadzai1@gmail.com` need to be added to your PandaDoc account first

## How PandaDoc Sequential Signing Works

1. **Document Created** → Status: `document.draft`
2. **Send Document** → Calls `/documents/{id}/send` API
3. **PandaDoc Sends Email** → To first recipient (ND with signing_order: 1)
4. **ND Completes Initials** → PandaDoc automatically sends to next recipient (HR)
5. **HR Completes Signature** → PandaDoc automatically sends to candidate
6. **Candidate Completes Signature** → Document status becomes `document.completed`

## Solution: Add Emails to PandaDoc Organization

### Option 1: Add Users in PandaDoc Dashboard (Recommended)

1. Log into your PandaDoc account
2. Go to **Settings** → **Team** or **Users**
3. Add these emails as team members:
   - `s82004966@gmail.com` (ND)
   - `anesaahmadzai1@gmail.com` (HR)
4. They will receive an invitation to join your PandaDoc organization
5. Once they accept, you can send documents to them

### Option 2: Use Production API Key

If you have a production PandaDoc account, switch to production API key:

- Update `PANDADOC_API_KEY` in `.env.local` with production key
- Production accounts have fewer restrictions

### Option 3: Test with Organization Emails

Use email addresses that are already in your PandaDoc organization for testing.

## Testing the Flow

### Step 1: Verify Document Was Created

```bash
# Check document status
curl -X GET "https://api.pandadoc.com/public/v1/documents/XXA5reVfjwwbk36qRFH8iT" \
  -H "Authorization: API-Key YOUR_API_KEY"
```

### Step 2: Manually Send from PandaDoc Dashboard

1. Go to PandaDoc dashboard
2. Find document `XXA5reVfjwwbk36qRFH8iT`
3. Click "Send" button
4. This will send to ND first (signing_order: 1)

### Step 3: Test Sequential Flow

1. **ND receives email** → Opens document → Completes initials
2. **HR automatically receives email** → Opens document → Completes signature
3. **Candidate automatically receives email** → Opens document → Completes signature
4. **Webhook fires** → Updates status to `ADP_COMPLETED`

## Current Document Status

- **Document ID:** `XXA5reVfjwwbk36qRFH8iT`
- **Status:** `document.draft` (ready but not sent)
- **Recipients:**
  - ND: `s82004966@gmail.com` (signing_order: 1)
  - HR: `anesaahmadzai1@gmail.com` (signing_order: 2)
  - Candidate: `test-candidate-1765536997@example.com` (signing_order: 3)

## Next Steps

1. **Add emails to PandaDoc organization** (see Option 1 above)
2. **Re-run the test** or **manually send from dashboard**
3. **Check email inboxes** for PandaDoc signature requests
4. **Complete signatures in order** to test the sequential flow

## Manual Send via API (After Adding Emails)

Once emails are in your organization, you can send via API:

```bash
curl -X POST "https://api.pandadoc.com/public/v1/documents/XXA5reVfjwwbk36qRFH8iT/send" \
  -H "Authorization: API-Key YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Offer Letter - Action Required",
    "message": "Please review and complete the offer letter.",
    "silent": false
  }'
```

This will trigger the sequential signing flow automatically!
