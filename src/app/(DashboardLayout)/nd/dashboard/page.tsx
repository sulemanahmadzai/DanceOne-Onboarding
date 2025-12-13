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
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  Select,
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
  IconSearch,
  IconFileExport,
} from "@tabler/icons-react";
import DashboardCard from "@/app/components/shared/DashboardCard";
import { OnboardingStatus } from "@/lib/db/schema";
import { TOUR_FILTER_OPTIONS } from "@/lib/constants/tours";

interface OnboardingRequest {
  id: number;
  candidateFirstName: string;
  candidateLastName: string;
  candidateEmail: string;
  tourName: string | null;
  positionTitle: string | null;
  hireDate: string | null;
  addressState: string | null;
  hireOrRehire: string | null;
  workerCategory: string | null;
  eventRate: string | null;
  dayRate: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdByNd?: {
    id: number;
    name: string | null;
    email: string;
  };
  assignedHr?: {
    id: number;
    name: string | null;
    email: string;
  } | null;
}

interface DashboardStats {
  total: number;
  waitingForCandidate: number;
  waitingForHR: number;
  completed: number;
}

const getStatusChip = (status: string) => {
  const statusConfig: Record<string, { label: string; color: any }> = {
    [OnboardingStatus.ND_TO_APPROVE]: { 
      label: "ND to Approve", 
      color: "secondary" // Purple
    },
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
  const [filteredRequests, setFilteredRequests] = useState<OnboardingRequest[]>(
    []
  );
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    waitingForCandidate: 0,
    waitingForHR: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [tourFilter, setTourFilter] = useState<string>("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/onboarding/nd-requests");
        if (response.ok) {
          const data = await response.json();
          setRequests(data.requests || []);
          setFilteredRequests(data.requests || []);
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

  // Filter requests based on search query and tour filter
  useEffect(() => {
    let filtered = requests;

    if (tourFilter !== "all") {
      filtered = filtered.filter((r) => r.tourName === tourFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.candidateFirstName.toLowerCase().includes(query) ||
          r.candidateLastName.toLowerCase().includes(query) ||
          r.candidateEmail.toLowerCase().includes(query) ||
          r.tourName?.toLowerCase().includes(query)
      );
    }

    setFilteredRequests(filtered);
  }, [tourFilter, searchQuery, requests]);

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
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<IconFileExport size={18} />}
            onClick={() => router.push("/nd/export")}
          >
            Export Records
          </Button>
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

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", md: "center" }}
          >
            <TextField
              placeholder="Search by name or email..."
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconSearch size={18} />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 250 }}
            />
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <Select
                value={tourFilter}
                onChange={(e) => setTourFilter(e.target.value)}
                displayEmpty
              >
                <MenuItem value="all">All Tours</MenuItem>
                {TOUR_FILTER_OPTIONS.map((tour) => (
                  <MenuItem key={tour.value} value={tour.value}>
                    {tour.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <DashboardCard
        title="All Onboarding Requests"
        subtitle={`Showing ${filteredRequests.length} of ${requests.length} requests`}
      >
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table sx={{ minWidth: 1400 }}>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Tour Name</TableCell>
                <TableCell>Created by ND</TableCell>
                <TableCell>Candidate Name</TableCell>
                <TableCell>Job Title</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>State</TableCell>
                <TableCell>Hire Type</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Event Rate</TableCell>
                <TableCell>Day Rate</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Assigned HR</TableCell>
                <TableCell>Last Updated</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, index) => (
                  <TableRow key={index}>
                    {[...Array(16)].map((_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton variant="text" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={16} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">
                      {requests.length === 0
                        ? 'No onboarding requests yet. Click "New Hire Request" to create one.'
                        : "No requests match your filters."}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((request) => (
                  <TableRow key={request.id} hover>
                    <TableCell>#{request.id}</TableCell>
                    <TableCell>{request.tourName || "-"}</TableCell>
                    <TableCell>
                      {request.createdByNd?.name ||
                        request.createdByNd?.email ||
                        "-"}
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={500}>
                        {request.candidateFirstName} {request.candidateLastName}
                      </Typography>
                    </TableCell>
                    <TableCell>{request.positionTitle || "-"}</TableCell>
                    <TableCell>
                      {request.hireDate
                        ? new Date(request.hireDate).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>{request.addressState || "-"}</TableCell>
                    <TableCell>
                      {request.hireOrRehire === "hire"
                        ? "HIRE"
                        : request.hireOrRehire === "rehire"
                        ? "REHIRE"
                        : request.hireOrRehire === "new_hire"
                        ? "HIRE"
                        : "-"}
                    </TableCell>
                    <TableCell>{request.workerCategory || "-"}</TableCell>
                    <TableCell>
                      {request.eventRate ? `$${request.eventRate}` : "-"}
                    </TableCell>
                    <TableCell>
                      {request.dayRate ? `$${request.dayRate}` : "-"}
                    </TableCell>
                    <TableCell>{request.candidateEmail}</TableCell>
                    <TableCell>
                      {request.assignedHr?.name ||
                        request.assignedHr?.email ||
                        "-"}
                    </TableCell>
                    <TableCell>
                      {new Date(request.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{getStatusChip(request.status)}</TableCell>
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
