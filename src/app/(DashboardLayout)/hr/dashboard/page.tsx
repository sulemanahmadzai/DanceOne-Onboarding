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
  MenuItem,
  FormControl,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
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
  IconPlus,
  IconTrash,
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
  const [tourFilter, setTourFilter] = useState<string>("all");
  const [createdByNdFilter, setCreatedByNdFilter] = useState<string>("all");
  const [candidateNameFilter, setCandidateNameFilter] = useState<string>("");
  const [jobTitleFilter, setJobTitleFilter] = useState<string>("all");
  const [startDateFilter, setStartDateFilter] = useState<string>("");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [hireTypeFilter, setHireTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [eventRateMinFilter, setEventRateMinFilter] = useState<string>("");
  const [eventRateMaxFilter, setEventRateMaxFilter] = useState<string>("");
  const [dayRateMinFilter, setDayRateMinFilter] = useState<string>("");
  const [dayRateMaxFilter, setDayRateMaxFilter] = useState<string>("");
  const [emailFilter, setEmailFilter] = useState<string>("");
  const [assignedHrFilter, setAssignedHrFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteRequestId, setDeleteRequestId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  // Extract unique values for dropdown filters
  const uniqueCreatedByNd = Array.from(
    new Set(
      requests
        .map((r) => r.createdByNd?.name || r.createdByNd?.email || "")
        .filter((val): val is string => Boolean(val))
    )
  ).sort();

  const uniqueJobTitles = Array.from(
    new Set(requests.map((r) => r.positionTitle).filter((title): title is string => Boolean(title)))
  ).sort();

  const uniqueStates = Array.from(
    new Set(requests.map((r) => r.addressState).filter((state): state is string => Boolean(state)))
  ).sort();

  const uniqueAssignedHr = Array.from(
    new Set(
      requests
        .map((r) => r.assignedHr?.name || r.assignedHr?.email || "")
        .filter((val): val is string => Boolean(val))
    )
  ).sort();

  // Filter requests based on all filters
  useEffect(() => {
    let filtered = requests;

    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    if (tourFilter !== "all") {
      filtered = filtered.filter((r) => r.tourName === tourFilter);
    }

    if (createdByNdFilter !== "all") {
      filtered = filtered.filter(
        (r) =>
          r.createdByNd?.name === createdByNdFilter ||
          r.createdByNd?.email === createdByNdFilter
      );
    }

    if (candidateNameFilter) {
      const query = candidateNameFilter.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.candidateFirstName.toLowerCase().includes(query) ||
          r.candidateLastName.toLowerCase().includes(query) ||
          `${r.candidateFirstName} ${r.candidateLastName}`
            .toLowerCase()
            .includes(query)
      );
    }

    if (jobTitleFilter !== "all") {
      filtered = filtered.filter((r) => r.positionTitle === jobTitleFilter);
    }

    if (startDateFilter) {
      filtered = filtered.filter((r) => {
        if (!r.hireDate) return false;
        const requestDate = new Date(r.hireDate).toISOString().split("T")[0];
        return requestDate === startDateFilter;
      });
    }

    if (stateFilter !== "all") {
      filtered = filtered.filter((r) => r.addressState === stateFilter);
    }

    if (hireTypeFilter !== "all") {
      filtered = filtered.filter((r) => {
        if (hireTypeFilter === "HIRE") {
          return r.hireOrRehire === "hire" || r.hireOrRehire === "new_hire";
        }
        if (hireTypeFilter === "REHIRE") {
          return r.hireOrRehire === "rehire";
        }
        return false;
      });
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((r) => r.workerCategory === categoryFilter);
    }

    if (eventRateMinFilter) {
      const min = parseFloat(eventRateMinFilter);
      filtered = filtered.filter((r) => {
        const rate = r.eventRate ? parseFloat(r.eventRate) : 0;
        return rate >= min;
      });
    }

    if (eventRateMaxFilter) {
      const max = parseFloat(eventRateMaxFilter);
      filtered = filtered.filter((r) => {
        const rate = r.eventRate ? parseFloat(r.eventRate) : 0;
        return rate <= max;
      });
    }

    if (dayRateMinFilter) {
      const min = parseFloat(dayRateMinFilter);
      filtered = filtered.filter((r) => {
        const rate = r.dayRate ? parseFloat(r.dayRate) : 0;
        return rate >= min;
      });
    }

    if (dayRateMaxFilter) {
      const max = parseFloat(dayRateMaxFilter);
      filtered = filtered.filter((r) => {
        const rate = r.dayRate ? parseFloat(r.dayRate) : 0;
        return rate <= max;
      });
    }

    if (emailFilter) {
      const query = emailFilter.toLowerCase();
      filtered = filtered.filter((r) =>
        r.candidateEmail.toLowerCase().includes(query)
      );
    }

    if (assignedHrFilter !== "all") {
      filtered = filtered.filter(
        (r) =>
          r.assignedHr?.name === assignedHrFilter ||
          r.assignedHr?.email === assignedHrFilter
      );
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
  }, [
    statusFilter,
    searchQuery,
    tourFilter,
    createdByNdFilter,
    candidateNameFilter,
    jobTitleFilter,
    startDateFilter,
    stateFilter,
    hireTypeFilter,
    categoryFilter,
    eventRateMinFilter,
    eventRateMaxFilter,
    dayRateMinFilter,
    dayRateMaxFilter,
    emailFilter,
    assignedHrFilter,
    requests,
  ]);

  const handleDeleteClick = (id: number) => {
    setDeleteRequestId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteRequestId) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/onboarding/${deleteRequestId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== deleteRequestId));
      }
    } catch (error) {
      console.error("Error deleting request:", error);
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setDeleteRequestId(null);
    }
  };

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
        <Stack direction="row" spacing={2}>
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
          <Button
            variant="outlined"
            startIcon={<IconFileExport size={18} />}
            onClick={() => router.push("/hr/export")}
          >
            Export Records
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
          <Stack spacing={3}>
            {/* Main Search and Status Filters */}
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", md: "center" }}
              justifyContent="space-between"
            >
              <Stack direction="row" spacing={2} alignItems="center" flex={1}>
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
                  sx={{ minWidth: 280, flex: 1 }}
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
            </Stack>

            {/* Column Filters Grid */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size="small">
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
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size="small">
                  <Select
                    value={createdByNdFilter}
                    onChange={(e) => setCreatedByNdFilter(e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="all">All Created by ND</MenuItem>
                    {uniqueCreatedByNd.map((nd) => (
                      <MenuItem key={nd} value={nd}>
                        {nd}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  placeholder="Candidate Name"
                  size="small"
                  fullWidth
                  value={candidateNameFilter}
                  onChange={(e) => setCandidateNameFilter(e.target.value)}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size="small">
                  <Select
                    value={jobTitleFilter}
                    onChange={(e) => setJobTitleFilter(e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="all">All Job Titles</MenuItem>
                    {uniqueJobTitles.map((title) => (
                      <MenuItem key={title} value={title}>
                        {title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  type="date"
                  label="Start Date"
                  size="small"
                  fullWidth
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size="small">
                  <Select
                    value={stateFilter}
                    onChange={(e) => setStateFilter(e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="all">All States</MenuItem>
                    {uniqueStates.map((state) => (
                      <MenuItem key={state} value={state}>
                        {state}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size="small">
                  <Select
                    value={hireTypeFilter}
                    onChange={(e) => setHireTypeFilter(e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="all">All Hire Types</MenuItem>
                    <MenuItem value="HIRE">HIRE</MenuItem>
                    <MenuItem value="REHIRE">REHIRE</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size="small">
                  <Select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="all">All Categories</MenuItem>
                    <MenuItem value="W2">W2</MenuItem>
                    <MenuItem value="1099">1099</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Stack direction="row" spacing={1}>
                  <TextField
                    type="number"
                    placeholder="Min Event Rate"
                    size="small"
                    value={eventRateMinFilter}
                    onChange={(e) => setEventRateMinFilter(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">$</InputAdornment>
                      ),
                    }}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    type="number"
                    placeholder="Max Event Rate"
                    size="small"
                    value={eventRateMaxFilter}
                    onChange={(e) => setEventRateMaxFilter(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">$</InputAdornment>
                      ),
                    }}
                    sx={{ flex: 1 }}
                  />
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Stack direction="row" spacing={1}>
                  <TextField
                    type="number"
                    placeholder="Min Day Rate"
                    size="small"
                    value={dayRateMinFilter}
                    onChange={(e) => setDayRateMinFilter(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">$</InputAdornment>
                      ),
                    }}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    type="number"
                    placeholder="Max Day Rate"
                    size="small"
                    value={dayRateMaxFilter}
                    onChange={(e) => setDayRateMaxFilter(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">$</InputAdornment>
                      ),
                    }}
                    sx={{ flex: 1 }}
                  />
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  placeholder="Email"
                  size="small"
                  fullWidth
                  value={emailFilter}
                  onChange={(e) => setEmailFilter(e.target.value)}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size="small">
                  <Select
                    value={assignedHrFilter}
                    onChange={(e) => setAssignedHrFilter(e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="all">All Assigned HR</MenuItem>
                    {uniqueAssignedHr.map((hr) => (
                      <MenuItem key={hr} value={hr}>
                        {hr}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
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
                      No onboarding requests found.
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
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="flex-end"
                      >
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
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteClick(request.id)}
                          >
                            <IconTrash size={18} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DashboardCard>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Request</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this onboarding request? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
