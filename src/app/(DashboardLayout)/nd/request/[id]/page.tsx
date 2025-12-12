"use client";
import {
  Box,
  Typography,
  Button,
  Grid,
  Stack,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Chip,
  Skeleton,
  Card,
  CardContent,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  IconArrowLeft,
  IconCopy,
  IconMail,
  IconCheck,
} from "@tabler/icons-react";
import DashboardCard from "@/app/components/shared/DashboardCard";
import { OnboardingStatus } from "@/lib/db/schema";

// Helper to get dashboard path based on role
const getDashboardPath = (role: string) => {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "hr":
      return "/hr/dashboard";
    default:
      return "/nd/dashboard";
  }
};

interface RequestDetails {
  id: number;
  status: string;
  candidateFirstName: string;
  candidateLastName: string;
  candidateEmail: string;
  candidatePhone: string | null;
  stateOfResidence: string | null;
  tourName: string | null;
  positionTitle: string | null;
  hireDate: string | null;
  eventRate: string | null;
  dayRate: string | null;
  workerCategory: string | null;
  hireOrRehire: string | null;
  notes: string | null;
  taxIdNumber: string | null;
  birthDate: string | null;
  maritalStatusState: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressZipCode: string | null;
  changeEffectiveDate: string | null;
  companyCode: string | null;
  homeDepartment: string | null;
  sui: string | null;
  willWorkerCompleteI9: string | null;
  eVerifyWorkLocation: string | null;
  createdAt: string;
  updatedAt: string;
  candidateLink?: string;
  createdByNd?: {
    name: string | null;
    email: string;
  };
}

const getStatusChip = (status: string) => {
  const statusConfig: Record<string, { label: string; color: any }> = {
    [OnboardingStatus.ND_DRAFT]: { label: "Draft", color: "default" },
    [OnboardingStatus.WAITING_FOR_CANDIDATE]: {
      label: "CDD Forms",
      color: "warning", // Yellow
    },
    [OnboardingStatus.WAITING_FOR_HR]: {
      label: "HR Forms",
      color: "info", // Blue
    },
    [OnboardingStatus.OFFER_LETTER_SENT]: {
      label: "Offer/BGC Sent",
      color: "error", // Red
    },
    [OnboardingStatus.ADP_COMPLETED]: {
      label: "ADP OK",
      color: "success", // Green
    },
    [OnboardingStatus.COMPLETED]: { label: "Completed", color: "success" },
  };

  const config = statusConfig[status] || { label: status, color: "default" };

  return <Chip label={config.label} color={config.color} />;
};

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) => (
  <Box mb={2}>
    <Typography variant="caption" color="textSecondary" display="block">
      {label}
    </Typography>
    <Typography variant="body1" fontWeight={500}>
      {value || "-"}
    </Typography>
  </Box>
);

export default function RequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [request, setRequest] = useState<RequestDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [userRole, setUserRole] = useState<string>("nd");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user role and request data in parallel
        const [roleResponse, requestResponse] = await Promise.all([
          fetch("/api/auth/user-role"),
          fetch(`/api/onboarding/${params.id}`),
        ]);

        if (roleResponse.ok) {
          const roleData = await roleResponse.json();
          setUserRole(roleData.role || "nd");
        }

        if (!requestResponse.ok) {
          throw new Error("Failed to fetch request");
        }
        const data = await requestResponse.json();
        setRequest(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  const handleCopyLink = () => {
    if (request?.candidateLink) {
      navigator.clipboard.writeText(request.candidateLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleResendEmail = async () => {
    setResending(true);
    try {
      const response = await fetch(
        `/api/onboarding/${params.id}/resend-email`,
        {
          method: "POST",
        }
      );
      if (response.ok) {
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Error resending email:", err);
    } finally {
      setResending(false);
    }
  };

  const getActiveStep = () => {
    if (!request) return 0;
    switch (request.status) {
      case OnboardingStatus.ND_DRAFT:
      case OnboardingStatus.WAITING_FOR_CANDIDATE:
        return 1;
      case OnboardingStatus.WAITING_FOR_HR:
        return 2;
      case OnboardingStatus.COMPLETED:
        return 3;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton variant="rectangular" height={400} sx={{ mt: 2 }} />
      </Box>
    );
  }

  if (error || !request) {
    return (
      <Box>
        <Alert severity="error">{error || "Request not found"}</Alert>
        <Button
          variant="text"
          startIcon={<IconArrowLeft size={18} />}
          onClick={() => router.push(getDashboardPath(userRole))}
          sx={{ mt: 2 }}
        >
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Page Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={4}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Button
            variant="text"
            startIcon={<IconArrowLeft size={18} />}
            onClick={() => router.push(getDashboardPath(userRole))}
          >
            Back
          </Button>
          <Box>
            <Typography variant="h4" fontWeight={600}>
              Request #{request.id}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {request.candidateFirstName} {request.candidateLastName}
            </Typography>
          </Box>
        </Stack>
        {getStatusChip(request.status)}
      </Stack>

      {/* Progress Stepper */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stepper activeStep={getActiveStep()} alternativeLabel>
            <Step completed={getActiveStep() > 0}>
              <StepLabel>ND Form</StepLabel>
            </Step>
            <Step completed={getActiveStep() > 1}>
              <StepLabel>Candidate Form</StepLabel>
            </Step>
            <Step completed={getActiveStep() > 2}>
              <StepLabel>HR Form</StepLabel>
            </Step>
          </Stepper>
        </CardContent>
      </Card>

      {/* Candidate Link Section */}
      {request.status === OnboardingStatus.WAITING_FOR_CANDIDATE &&
        request.candidateLink && (
          <Alert
            severity="info"
            sx={{ mb: 3 }}
            action={
              <Stack direction="row" spacing={1}>
                <Tooltip title={copied ? "Copied!" : "Copy Link"}>
                  <IconButton size="small" onClick={handleCopyLink}>
                    {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
                  </IconButton>
                </Tooltip>
                <Button
                  size="small"
                  startIcon={<IconMail size={16} />}
                  onClick={handleResendEmail}
                  disabled={resending}
                >
                  {resending ? "Sending..." : "Resend Email"}
                </Button>
              </Stack>
            }
          >
            {resendSuccess
              ? "Email sent successfully!"
              : "Waiting for candidate to complete their form. You can copy the link or resend the email."}
          </Alert>
        )}

      <Grid container spacing={3}>
        {/* ND Information */}
        <Grid size={{ xs: 12, md: 6 }}>
          <DashboardCard
            title="ND Information"
            subtitle="Submitted by National Director"
          >
            <>
              <InfoRow
                label="Created By"
                value={
                  request.createdByNd?.name || request.createdByNd?.email || "-"
                }
              />
              <InfoRow label="Tour Name" value={request.tourName} />
              <InfoRow label="Position Title" value={request.positionTitle} />
              <InfoRow
                label="Hire Date"
                value={
                  request.hireDate
                    ? new Date(request.hireDate).toLocaleDateString()
                    : null
                }
              />
              <InfoRow
                label="Event Rate"
                value={request.eventRate ? `$${request.eventRate}` : null}
              />
              <InfoRow
                label="Day Rate"
                value={request.dayRate ? `$${request.dayRate}` : null}
              />
              <InfoRow
                label="Worker Category"
                value={
                  request.workerCategory === "W2"
                    ? "W2 Employee"
                    : request.workerCategory === "1099"
                    ? "1099 Contractor"
                    : request.workerCategory
                }
              />
              <InfoRow
                label="Hire Type"
                value={
                  request.hireOrRehire === "new_hire"
                    ? "New Hire"
                    : request.hireOrRehire === "rehire"
                    ? "Rehire"
                    : request.hireOrRehire
                }
              />
              {request.notes && <InfoRow label="Notes" value={request.notes} />}
            </>
          </DashboardCard>
        </Grid>

        {/* Candidate Information */}
        <Grid size={{ xs: 12, md: 6 }}>
          <DashboardCard
            title="Candidate Information"
            subtitle="Submitted by candidate"
          >
            <>
              <InfoRow
                label="Full Name"
                value={`${request.candidateFirstName} ${request.candidateLastName}`}
              />
              <InfoRow label="Email" value={request.candidateEmail} />
              <InfoRow label="Phone" value={request.candidatePhone} />
              <InfoRow
                label="Tax ID / SSN"
                value={
                  request.taxIdNumber
                    ? "***-**-" + request.taxIdNumber.slice(-4)
                    : null
                }
              />
              <InfoRow
                label="Date of Birth"
                value={
                  request.birthDate
                    ? new Date(request.birthDate).toLocaleDateString()
                    : null
                }
              />
              <InfoRow
                label="Marital Status"
                value={
                  request.maritalStatusState
                    ? request.maritalStatusState.charAt(0).toUpperCase() +
                      request.maritalStatusState.slice(1)
                    : null
                }
              />
              <Divider sx={{ my: 2 }} />
              <InfoRow label="Address Line 1" value={request.addressLine1} />
              <InfoRow label="Address Line 2" value={request.addressLine2} />
              <InfoRow
                label="City, State ZIP"
                value={
                  request.addressCity
                    ? `${request.addressCity}, ${request.addressState} ${request.addressZipCode}`
                    : null
                }
              />
            </>
          </DashboardCard>
        </Grid>

        {/* HR Information */}
        <Grid size={12}>
          <DashboardCard
            title="HR Details - ADP Information"
            subtitle={
              request.status === OnboardingStatus.COMPLETED
                ? "Completed"
                : request.status === OnboardingStatus.WAITING_FOR_HR
                ? "Waiting for HR to complete"
                : "Waiting for candidate to submit their information"
            }
          >
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <InfoRow
                  label="Change Effective Date"
                  value={
                    request.changeEffectiveDate
                      ? new Date(
                          request.changeEffectiveDate
                        ).toLocaleDateString()
                      : null
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <InfoRow label="Company Code" value={request.companyCode} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <InfoRow
                  label="Home Department"
                  value={request.homeDepartment}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <InfoRow
                  label="SUI (State Unemployment Insurance)"
                  value={request.sui}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <InfoRow
                  label="Will Worker Complete I-9?"
                  value={
                    request.willWorkerCompleteI9
                      ? request.willWorkerCompleteI9.toUpperCase()
                      : null
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <InfoRow
                  label="E-Verify Work Location"
                  value={request.eVerifyWorkLocation}
                />
              </Grid>
            </Grid>
          </DashboardCard>
        </Grid>
      </Grid>
    </Box>
  );
}
