#!/bin/bash

# Test the complete onboarding workflow using curl
# This script tests the entire flow: ND creates -> Candidate submits -> HR completes -> PandaDoc

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
ND_EMAIL="s82004966@gmail.com"
HR_EMAIL="anesaahmadzai1@gmail.com"
CANDIDATE_EMAIL="i228807@nu.edu.pk"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Testing Complete Onboarding Workflow${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Base URL: $BASE_URL"
echo "ND Email: $ND_EMAIL"
echo "HR Email: $HR_EMAIL"
echo "Candidate Email: $CANDIDATE_EMAIL"
echo ""

# Test complete workflow using test endpoint
echo -e "${YELLOW}Running complete workflow test...${NC}"
echo ""

WORKFLOW_RESPONSE=$(curl -s -X POST "$BASE_URL/api/test/workflow" \
  -H "Content-Type: application/json" \
  -d '{
    "ndEmail": "'"$ND_EMAIL"'",
    "hrEmail": "'"$HR_EMAIL"'",
    "candidateEmail": "'"$CANDIDATE_EMAIL"'",
    "candidateFirstName": "John",
    "candidateLastName": "Doe",
    "candidatePhone": "555-1234",
    "stateOfResidence": "CA",
    "tourName": "Summer Festival Tour",
    "positionTitle": "Show Manager",
    "hireDate": "2025-02-15",
    "eventRate": "1800.00",
    "dayRate": null,
    "workerCategory": "W2",
    "hireOrRehire": "new_hire",
    "notes": "Test workflow - complete flow",
    "taxIdNumber": "123-45-6789",
    "birthDate": "1990-01-15",
    "maritalStatusState": "single",
    "addressLine1": "123 Test Street",
    "addressCity": "Los Angeles",
    "addressState": "CA",
    "addressZipCode": "90001",
    "changeEffectiveDate": "2025-02-15",
    "companyCode": "0AF",
    "homeDepartment": "10101",
    "sui": "06",
    "willWorkerCompleteI9": "YE",
    "eVerifyWorkLocation": "Los Angeles, CA"
  }')

echo "$WORKFLOW_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$WORKFLOW_RESPONSE"
echo ""

# Extract values
SUCCESS=$(echo "$WORKFLOW_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null)
REQUEST_ID=$(echo "$WORKFLOW_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('requestId', ''))" 2>/dev/null)
PANDADOC_ID=$(echo "$WORKFLOW_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('pandadocDocumentId', ''))" 2>/dev/null)
CANDIDATE_TOKEN=$(echo "$WORKFLOW_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('candidateToken', ''))" 2>/dev/null)

if [ "$SUCCESS" = "True" ] || [ "$SUCCESS" = "true" ]; then
  echo -e "${GREEN}✅ Complete workflow executed successfully!${NC}"
  echo ""
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}Test Results${NC}"
  echo -e "${BLUE}========================================${NC}"
  echo "Request ID: $REQUEST_ID"
  echo "Candidate Email: $CANDIDATE_EMAIL"
  echo "Candidate Token: $CANDIDATE_TOKEN"
  echo "PandaDoc Document ID: ${PANDADOC_ID:-Not created}"
  echo ""
  echo -e "${GREEN}✅ All steps completed!${NC}"
  echo ""
  echo -e "${YELLOW}📧 Check these email inboxes:${NC}"
  echo "   1. $CANDIDATE_EMAIL"
  echo "      → Should receive: Candidate invitation email"
  echo "      → Later: PandaDoc signature request (after HR signs)"
  echo ""
  echo "   2. $ND_EMAIL"
  echo "      → Should receive: PandaDoc document for initials (signing_order: 1)"
  echo ""
  echo "   3. $HR_EMAIL"
  echo "      → Should receive: PandaDoc document for signature (signing_order: 2)"
  echo ""
  echo -e "${YELLOW}📄 Next Steps:${NC}"
  echo "   1. Check PandaDoc dashboard for document: $PANDADOC_ID"
  echo "   2. ND should complete initials first"
  echo "   3. HR will receive email after ND completes"
  echo "   4. Candidate will receive email after HR completes"
  echo "   5. Check webhook logs for signature completion events"
  echo ""
else
  echo -e "${RED}❌ Workflow test failed${NC}"
  echo "Response: $WORKFLOW_RESPONSE"
  exit 1
fi

