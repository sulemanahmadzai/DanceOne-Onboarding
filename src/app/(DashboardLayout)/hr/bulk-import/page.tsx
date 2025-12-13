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
  Stack,
  Card,
  CardContent,
  Alert,
  AlertTitle,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  LinearProgress,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  IconUpload,
  IconDownload,
  IconFileSpreadsheet,
  IconCheck,
  IconX,
  IconSend,
  IconArrowLeft,
} from "@tabler/icons-react";
import DashboardCard from "@/app/components/shared/DashboardCard";

interface ND {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface ImportResult {
  success: boolean;
  row: number;
  candidateName?: string;
  candidateEmail?: string;
  error?: string;
  requestId?: number;
}

interface ImportResponse {
  message: string;
  totalRows: number;
  successCount: number;
  errorCount: number;
  results: ImportResult[];
}

interface PendingRequest {
  id: number;
  candidateFirstName: string;
  candidateLastName: string;
  candidateEmail: string;
  tourName: string | null;
  positionTitle: string | null;
  hireDate: string | null;
  status: string;
  createdByNd?: {
    id: number;
    name: string | null;
    email: string;
  };
}

export default function BulkImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nds, setNds] = useState<ND[]>([]);
  const [selectedNdId, setSelectedNdId] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResponse | null>(null);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [selectedRequests, setSelectedRequests] = useState<Set<number>>(new Set());
  const [approving, setApproving] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [approveResults, setApproveResults] = useState<any>(null);

  // Fetch NDs for dropdown
  useEffect(() => {
    const fetchNDs = async () => {
      try {
        const response = await fetch("/api/bulk-import/nds");
        if (response.ok) {
          const data = await response.json();
          setNds(data.nds || []);
        }
      } catch (error) {
        console.error("Error fetching NDs:", error);
      }
    };
    fetchNDs();
  }, []);

  // Fetch pending requests (ND_TO_APPROVE status)
  useEffect(() => {
    const fetchPendingRequests = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/onboarding/hr-requests");
        if (response.ok) {
          const data = await response.json();
          // Filter only ND_TO_APPROVE status
          const pending = (data.requests || []).filter(
            (r: PendingRequest) => r.status === "nd_to_approve"
          );
          setPendingRequests(pending);
        }
      } catch (error) {
        console.error("Error fetching pending requests:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPendingRequests();
  }, [importResults, approveResults]);

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch("/api/bulk-import/template");
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "bulk_import_template.csv";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error downloading template:", error);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const parseCSV = (text: string): Record<string, string>[] => {
    const lines = text.split("\n").filter((line) => !line.startsWith("#") && line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim());
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      if (values.length === headers.length) {
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        rows.push(row);
      }
    }

    return rows;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!selectedNdId) {
      alert("Please select an ND first");
      return;
    }

    setImporting(true);
    setImportResults(null);

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        alert("No valid data rows found in the CSV file");
        setImporting(false);
        return;
      }

      const response = await fetch("/api/bulk-import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ndId: selectedNdId,
          rows,
        }),
      });

      const data = await response.json();
      setImportResults(data);
    } catch (error) {
      console.error("Error importing:", error);
      alert("Error importing file. Please check the format and try again.");
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRequests(new Set(pendingRequests.map((r) => r.id)));
    } else {
      setSelectedRequests(new Set());
    }
  };

  const handleSelectRequest = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedRequests);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRequests(newSelected);
  };

  const handleApproveSelected = () => {
    if (selectedRequests.size === 0) {
      alert("Please select at least one request to approve");
      return;
    }
    setApproveDialogOpen(true);
  };

  const handleApproveConfirm = async () => {
    setApproveDialogOpen(false);
    setApproving(true);
    setApproveResults(null);

    try {
      const response = await fetch("/api/bulk-import/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestIds: Array.from(selectedRequests),
        }),
      });

      const data = await response.json();
      setApproveResults(data);
      setSelectedRequests(new Set());
    } catch (error) {
      console.error("Error approving:", error);
      alert("Error approving requests. Please try again.");
    } finally {
      setApproving(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Button
            startIcon={<IconArrowLeft />}
            onClick={() => router.push("/hr/dashboard")}
            sx={{ mb: 1 }}
          >
            Back to Dashboard
          </Button>
          <Typography variant="h4" fontWeight={700}>
            Bulk Import New Hire Requests
          </Typography>
          <Typography color="textSecondary">
            Import multiple new hire requests from a CSV file
          </Typography>
        </Box>
      </Stack>

      {/* Step 1: Download Template */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2} mb={2}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                bgcolor: "primary.main",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
              }}
            >
              1
            </Box>
            <Typography variant="h6">Download Template</Typography>
          </Stack>
          <Typography color="textSecondary" mb={2}>
            Download the CSV template, share it with the National Director to fill out, then upload the completed file.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<IconDownload />}
            onClick={handleDownloadTemplate}
          >
            Download CSV Template
          </Button>
        </CardContent>
      </Card>

      {/* Step 2: Select ND and Upload */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2} mb={2}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                bgcolor: "primary.main",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
              }}
            >
              2
            </Box>
            <Typography variant="h6">Select ND & Upload CSV</Typography>
          </Stack>
          <Typography color="textSecondary" mb={2}>
            Select the National Director who will be assigned to these requests, then upload the completed CSV file.
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-start">
            <FormControl sx={{ minWidth: 300 }}>
              <InputLabel>Select National Director</InputLabel>
              <Select
                value={selectedNdId}
                onChange={(e) => setSelectedNdId(e.target.value as number)}
                label="Select National Director"
              >
                {nds.map((nd) => (
                  <MenuItem key={nd.id} value={nd.id}>
                    {nd.name} ({nd.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />

            <Button
              variant="contained"
              startIcon={<IconUpload />}
              onClick={handleFileSelect}
              disabled={!selectedNdId || importing}
            >
              {importing ? "Importing..." : "Upload CSV File"}
            </Button>
          </Stack>

          {importing && <LinearProgress sx={{ mt: 2 }} />}

          {/* Import Results */}
          {importResults && (
            <Box mt={3}>
              <Alert
                severity={importResults.errorCount === 0 ? "success" : "warning"}
                sx={{ mb: 2 }}
              >
                <AlertTitle>{importResults.message}</AlertTitle>
                {importResults.successCount} of {importResults.totalRows} records imported successfully.
              </Alert>

              {importResults.errorCount > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="error" mb={1}>
                    Failed Rows:
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Row</TableCell>
                          <TableCell>Candidate</TableCell>
                          <TableCell>Email</TableCell>
                          <TableCell>Error</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {importResults.results
                          .filter((r) => !r.success)
                          .map((result) => (
                            <TableRow key={result.row}>
                              <TableCell>{result.row}</TableCell>
                              <TableCell>{result.candidateName || "-"}</TableCell>
                              <TableCell>{result.candidateEmail || "-"}</TableCell>
                              <TableCell>
                                <Typography color="error" variant="body2">
                                  {result.error}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Step 3: Review and Approve */}
      <DashboardCard
        title="Step 3: Review & Approve Pending Requests"
        subtitle={`${pendingRequests.length} requests waiting for approval`}
        action={
          <Button
            variant="contained"
            color="success"
            startIcon={<IconSend />}
            onClick={handleApproveSelected}
            disabled={selectedRequests.size === 0 || approving}
          >
            {approving
              ? "Sending..."
              : `Approve & Send (${selectedRequests.size})`}
          </Button>
        }
      >
        {approveResults && (
          <Alert
            severity={approveResults.errorCount === 0 ? "success" : "warning"}
            sx={{ mb: 2 }}
          >
            <AlertTitle>{approveResults.message}</AlertTitle>
            Emails sent to {approveResults.successCount} candidates.
          </Alert>
        )}

        {loading ? (
          <LinearProgress />
        ) : pendingRequests.length === 0 ? (
          <Alert severity="info">
            No pending requests to approve. Import a CSV file to create new requests.
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={
                        pendingRequests.length > 0 &&
                        selectedRequests.size === pendingRequests.length
                      }
                      indeterminate={
                        selectedRequests.size > 0 &&
                        selectedRequests.size < pendingRequests.length
                      }
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell>Candidate Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Tour</TableCell>
                  <TableCell>Position</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>Assigned ND</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingRequests.map((request) => (
                  <TableRow key={request.id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedRequests.has(request.id)}
                        onChange={(e) =>
                          handleSelectRequest(request.id, e.target.checked)
                        }
                      />
                    </TableCell>
                    <TableCell>#{request.id}</TableCell>
                    <TableCell>
                      <Typography fontWeight={500}>
                        {request.candidateFirstName} {request.candidateLastName}
                      </Typography>
                    </TableCell>
                    <TableCell>{request.candidateEmail}</TableCell>
                    <TableCell>{request.tourName || "-"}</TableCell>
                    <TableCell>{request.positionTitle || "-"}</TableCell>
                    <TableCell>
                      {request.hireDate
                        ? new Date(request.hireDate).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {request.createdByNd?.name || request.createdByNd?.email || "-"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label="ND to Approve"
                        color="secondary"
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DashboardCard>

      {/* Approve Confirmation Dialog */}
      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)}>
        <DialogTitle>Confirm Approval</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You are about to approve {selectedRequests.size} request(s) and send
            invitation emails to the candidates. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleApproveConfirm} variant="contained" color="success">
            Approve & Send Emails
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

