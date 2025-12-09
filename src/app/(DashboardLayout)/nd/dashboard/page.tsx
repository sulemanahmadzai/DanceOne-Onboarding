"use client";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Stack,
  Card,
  CardContent,
  Grid,
  Skeleton,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconPlus,
  IconEye,
  IconUsers,
  IconClockHour4,
  IconCircleCheck,
  IconAlertCircle,
} from "@tabler/icons-react";
import DashboardCard from "@/app/components/shared/DashboardCard";
import { OnboardingStatus } from "@/lib/db/schema";

interface OnboardingRequest {
  id: number;
  candidateFirstName: string;
  candidateLastName: string;
  candidateEmail: string;
  tourName: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface DashboardStats {
  total: number;
  waitingForCandidate: number;
  waitingForHR: number;
  completed: number;
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

  return <Chip label={config.label} color={config.color} size="small" />;
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  loading,
}: {
  title: string;
  value: number;
  icon: any;
  color: string;
  loading: boolean;
}) => (
  <Card sx={{ height: "100%" }}>
    <CardContent>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="subtitle2" color="textSecondary" mb={1}>
            {title}
          </Typography>
          {loading ? (
            <Skeleton variant="text" width={60} height={40} />
          ) : (
            <Typography variant="h3" fontWeight={600}>
              {value}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: `${color}20`,
          }}
        >
          <Icon size={28} color={color} />
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

export default function NDDashboardPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<OnboardingRequest[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    waitingForCandidate: 0,
    waitingForHR: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/onboarding/nd-requests");
        if (response.ok) {
          const data = await response.json();
          setRequests(data.requests || []);
          setStats(
            data.stats || {
              total: 0,
              waitingForCandidate: 0,
              waitingForHR: 0,
              completed: 0,
            }
          );
        }
      } catch (error) {
        console.error("Error fetching requests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <Box>
      {/* Page Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Box>
          <Typography variant="h4" fontWeight={600}>
            ND Dashboard
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manage your onboarding requests
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<IconPlus size={18} />}
          onClick={() => router.push("/nd/new-request")}
          sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)",
            },
          }}
        >
          New Hire Request
        </Button>
      </Stack>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Requests"
            value={stats.total}
            icon={IconUsers}
            color="#5D87FF"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Waiting for Candidate"
            value={stats.waitingForCandidate}
            icon={IconClockHour4}
            color="#FFAE1F"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Waiting for HR"
            value={stats.waitingForHR}
            icon={IconAlertCircle}
            color="#49BEFF"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Completed"
            value={stats.completed}
            icon={IconCircleCheck}
            color="#13DEB9"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Requests Table */}
      <DashboardCard
        title="My Onboarding Requests"
        subtitle="All hire requests you have created"
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Candidate Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Tour Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, index) => (
                  <TableRow key={index}>
                    {[...Array(7)].map((_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton variant="text" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">
                      No onboarding requests yet. Click &quot;New Hire Request&quot; to
                      create one.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => (
                  <TableRow key={request.id} hover>
                    <TableCell>#{request.id}</TableCell>
                    <TableCell>
                      <Typography fontWeight={500}>
                        {request.candidateFirstName} {request.candidateLastName}
                      </Typography>
                    </TableCell>
                    <TableCell>{request.candidateEmail}</TableCell>
                    <TableCell>{request.tourName || "-"}</TableCell>
                    <TableCell>{getStatusChip(request.status)}</TableCell>
                    <TableCell>
                      {new Date(request.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() =>
                            router.push(`/nd/request/${request.id}`)
                          }
                        >
                          <IconEye size={18} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DashboardCard>
    </Box>
  );
}

