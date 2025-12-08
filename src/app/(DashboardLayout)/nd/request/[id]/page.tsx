"use client";
import {
  Box,
  Typography,
  Button,
  Grid,
  Stack,
  Chip,
  Divider,
  Alert,
  Skeleton,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  IconArrowLeft,
  IconCopy,
  IconMail,
  IconCheck,
} from "@tabler/icons-react";
import DashboardCard from "@/app/components/shared/DashboardCard";
import { OnboardingStatus } from "@/lib/db/schema";

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
  salaryEventRate: string | null;
  workerCategory: string | null;
  hireOrRehire: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  candidateLink?: string;
}

const getStatusChip = (status: string) => {
  const statusConfig: Record<string, { label: string; color: any }> = {
    [OnboardingStatus.ND_DRAFT]: { label: "Draft", color: "default" },
    [OnboardingStatus.WAITING_FOR_CANDIDATE]: {
      label: "Waiting for Candidate",
      color: "warning",
    },
    [OnboardingStatus.WAITING_FOR_HR]: {
      label: "Waiting for HR",
      color: "info",
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

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const response = await fetch(`/api/onboarding/${params.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch request");
        }
        const data = await response.json();
        setRequest(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
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
      const response = await fetch(`/api/onboarding/${params.id}/resend-email`, {
        method: "POST",
      });
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
          onClick={() => router.push("/nd/dashboard")}
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
            onClick={() => router.push("/nd/dashboard")}
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
                    {copied ? (
                      <IconCheck size={18} />
                    ) : (
                      <IconCopy size={18} />
                    )}
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
        {/* Candidate Information */}
        <Grid item xs={12} md={6}>
          <DashboardCard
            title="Candidate Information"
            subtitle="Basic candidate details"
          >
            <>
              <InfoRow
                label="Full Name"
                value={`${request.candidateFirstName} ${request.candidateLastName}`}
              />
              <InfoRow label="Email" value={request.candidateEmail} />
              <InfoRow label="Phone" value={request.candidatePhone} />
              <InfoRow
                label="State of Residence"
                value={request.stateOfResidence}
              />
            </>
          </DashboardCard>
        </Grid>

        {/* Job Details */}
        <Grid item xs={12} md={6}>
          <DashboardCard title="Job Details" subtitle="Position information">
            <>
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
                label="Salary / Event Rate"
                value={
                  request.salaryEventRate ? `$${request.salaryEventRate}` : null
                }
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
            </>
          </DashboardCard>
        </Grid>

        {/* Notes */}
        {request.notes && (
          <Grid item xs={12}>
            <DashboardCard title="Notes" subtitle="Additional information">
              <Typography>{request.notes}</Typography>
            </DashboardCard>
          </Grid>
        )}

        {/* Timeline */}
        <Grid item xs={12}>
          <DashboardCard title="Timeline" subtitle="Request history">
            <>
              <InfoRow
                label="Created"
                value={new Date(request.createdAt).toLocaleString()}
              />
              <InfoRow
                label="Last Updated"
                value={new Date(request.updatedAt).toLocaleString()}
              />
            </>
          </DashboardCard>
        </Grid>
      </Grid>
    </Box>
  );
}

