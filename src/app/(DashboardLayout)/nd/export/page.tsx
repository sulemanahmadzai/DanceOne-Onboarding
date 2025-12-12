"use client";
import {
  Box,
  Typography,
  Button,
  Stack,
  Card,
  CardContent,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Chip,
  Skeleton,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconArrowLeft,
  IconFileExport,
  IconDownload,
} from "@tabler/icons-react";
import DashboardCard from "@/app/components/shared/DashboardCard";

interface CompletedRequest {
  id: number;
  candidateFirstName: string;
  candidateLastName: string;
  candidateEmail: string;
  tourName: string | null;
  hrCompletedAt: string | null;
}

export default function NDExportPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<CompletedRequest[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/export/completed-records");
        if (response.ok) {
          const data = await response.json();
          setRequests(data.requests || []);
        }
      } catch (error) {
        console.error("Error fetching completed records:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedIds(requests.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const idsToExport = selectedIds.length > 0 ? selectedIds : requests.map((r) => r.id);
      
      const response = await fetch("/api/export/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: idsToExport }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `danceone-onboarding-export-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Error exporting records:", error);
    } finally {
      setExporting(false);
    }
  };

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
              Export Records
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Export your completed onboarding records to CSV for ADP upload
            </Typography>
          </Box>
        </Stack>
        <Button
          variant="contained"
          startIcon={<IconDownload size={18} />}
          onClick={handleExport}
          disabled={exporting || requests.length === 0}
          sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)",
            },
          }}
        >
          {exporting
            ? "Exporting..."
            : selectedIds.length > 0
            ? `Export Selected (${selectedIds.length})`
            : `Export All (${requests.length})`}
        </Button>
      </Stack>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Records exported successfully!
        </Alert>
      )}

      {/* Export Info */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <IconFileExport size={24} color="#667eea" />
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                ADP-Compatible Export
              </Typography>
              <Typography variant="body2" color="textSecondary">
                The exported CSV file includes all required fields in the correct
                order for ADP import: Name, Tax ID, Birth Date, Address, Contact
                Info, Position Details, and HR Fields.
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Records Table */}
      <DashboardCard
        title="Completed Records"
        subtitle={`${requests.length} records ready for export`}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={
                      selectedIds.length > 0 &&
                      selectedIds.length < requests.length
                    }
                    checked={
                      requests.length > 0 &&
                      selectedIds.length === requests.length
                    }
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>ID</TableCell>
                <TableCell>Candidate Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Tour Name</TableCell>
                <TableCell>Completed Date</TableCell>
                <TableCell>Status</TableCell>
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
                      No completed records available for export.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => (
                  <TableRow
                    key={request.id}
                    hover
                    selected={selectedIds.includes(request.id)}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedIds.includes(request.id)}
                        onChange={() => handleSelectOne(request.id)}
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
                    <TableCell>
                      {request.hrCompletedAt
                        ? new Date(request.hrCompletedAt).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Chip label="Completed" color="success" size="small" />
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



