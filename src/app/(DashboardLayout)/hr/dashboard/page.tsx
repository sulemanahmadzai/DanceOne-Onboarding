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
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  InputAdornment,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
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

interface OnboardingRequest {
  id: number;
  candidateFirstName: string;
  candidateLastName: string;
  candidateEmail: string;
  tourName: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdByNd?: {
    name: string | null;
    email: string;
  };
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
  onClick,
  active,
}: {
  title: string;
  value: number;
  icon: any;
  color: string;
  loading: boolean;
  onClick?: () => void;
  active?: boolean;
}) => (
  <Card
    sx={{
      height: "100%",
      cursor: onClick ? "pointer" : "default",
      border: active ? `2px solid ${color}` : "none",
      transition: "all 0.2s",
      "&:hover": onClick
        ? {
            transform: "translateY(-2px)",
            boxShadow: 3,
          }
        : {},
    }}
    onClick={onClick}
  >
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

export default function HRDashboardPage() {
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
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/onboarding/hr-requests");
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

  // Filter requests based on status and search query
  useEffect(() => {
    let filtered = requests;

    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.candidateFirstName.toLowerCase().includes(query) ||
          r.candidateLastName.toLowerCase().includes(query) ||
          r.candidateEmail.toLowerCase().includes(query) ||
          r.tourName?.toLowerCase().includes(query) ||
          r.createdByNd?.name?.toLowerCase().includes(query) ||
          r.createdByNd?.email.toLowerCase().includes(query)
      );
    }

    setFilteredRequests(filtered);
  }, [statusFilter, searchQuery, requests]);

  const handleStatusFilterChange = (
    event: React.MouseEvent<HTMLElement>,
    newFilter: string | null
  ) => {
    if (newFilter !== null) {
      setStatusFilter(newFilter);
    }
  };

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
            HR Dashboard
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manage all onboarding requests
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<IconFileExport size={18} />}
          onClick={() => router.push("/hr/export")}
          sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)",
            },
          }}
        >
          Export Records
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
            onClick={() => setStatusFilter("all")}
            active={statusFilter === "all"}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Waiting for Candidate"
            value={stats.waitingForCandidate}
            icon={IconClockHour4}
            color="#FFAE1F"
            loading={loading}
            onClick={() =>
              setStatusFilter(OnboardingStatus.WAITING_FOR_CANDIDATE)
            }
            active={statusFilter === OnboardingStatus.WAITING_FOR_CANDIDATE}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Waiting for HR"
            value={stats.waitingForHR}
            icon={IconAlertCircle}
            color="#49BEFF"
            loading={loading}
            onClick={() => setStatusFilter(OnboardingStatus.WAITING_FOR_HR)}
            active={statusFilter === OnboardingStatus.WAITING_FOR_HR}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Completed"
            value={stats.completed}
            icon={IconCircleCheck}
            color="#13DEB9"
            loading={loading}
            onClick={() => setStatusFilter(OnboardingStatus.COMPLETED)}
            active={statusFilter === OnboardingStatus.COMPLETED}
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
            justifyContent="space-between"
          >
            <TextField
              placeholder="Search by name, email, or tour..."
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
              sx={{ minWidth: 300 }}
            />
            <ToggleButtonGroup
              value={statusFilter}
              exclusive
              onChange={handleStatusFilterChange}
              size="small"
            >
              <ToggleButton value="all">All</ToggleButton>
              <ToggleButton value={OnboardingStatus.WAITING_FOR_CANDIDATE}>
                Waiting Candidate
              </ToggleButton>
              <ToggleButton value={OnboardingStatus.WAITING_FOR_HR}>
                Waiting HR
              </ToggleButton>
              <ToggleButton value={OnboardingStatus.COMPLETED}>
                Completed
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <DashboardCard
        title="All Onboarding Requests"
        subtitle={`Showing ${filteredRequests.length} of ${requests.length} requests`}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Candidate Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>ND</TableCell>
                <TableCell>Tour Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Updated</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, index) => (
                  <TableRow key={index}>
                    {[...Array(8)].map((_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton variant="text" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">
                      No onboarding requests found.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((request) => (
                  <TableRow key={request.id} hover>
                    <TableCell>#{request.id}</TableCell>
                    <TableCell>
                      <Typography fontWeight={500}>
                        {request.candidateFirstName} {request.candidateLastName}
                      </Typography>
                    </TableCell>
                    <TableCell>{request.candidateEmail}</TableCell>
                    <TableCell>
                      {request.createdByNd?.name || request.createdByNd?.email || "-"}
                    </TableCell>
                    <TableCell>{request.tourName || "-"}</TableCell>
                    <TableCell>{getStatusChip(request.status)}</TableCell>
                    <TableCell>
                      {new Date(request.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View / Edit">
                        <IconButton
                          size="small"
                          onClick={() =>
                            router.push(`/hr/request/${request.id}`)
                          }
                          color={
                            request.status === OnboardingStatus.WAITING_FOR_HR
                              ? "primary"
                              : "default"
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

