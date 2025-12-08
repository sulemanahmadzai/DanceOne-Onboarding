"use client";
import {
  Box,
  Typography,
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
  Skeleton,
  TextField,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Snackbar,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconSearch,
  IconUserPlus,
  IconTrash,
  IconUserOff,
  IconUserCheck,
  IconRefresh,
  IconMail,
} from "@tabler/icons-react";
import DashboardCard from "@/app/components/shared/DashboardCard";

interface User {
  id: number;
  supabaseAuthId: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const getRoleChip = (role: string) => {
  const roleConfig: Record<string, { label: string; color: any }> = {
    admin: { label: "Admin", color: "error" },
    hr: { label: "HR", color: "success" },
    nd: { label: "ND", color: "info" },
  };

  const config = roleConfig[role] || { label: role, color: "default" };

  return <Chip label={config.label} color={config.color} size="small" />;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: User | null }>({
    open: false,
    user: null,
  });
  const [deactivateDialog, setDeactivateDialog] = useState<{
    open: boolean;
    user: User | null;
    action: "activate" | "deactivate";
  }>({
    open: false,
    user: null,
    action: "deactivate",
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setFilteredUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search query and role
  useEffect(() => {
    let filtered = users;

    if (roleFilter !== "all") {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.email.toLowerCase().includes(query) ||
          u.name?.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  }, [roleFilter, searchQuery, users]);

  const handleRoleFilterChange = (
    event: React.MouseEvent<HTMLElement>,
    newFilter: string | null
  ) => {
    if (newFilter !== null) {
      setRoleFilter(newFilter);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteDialog.user) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${deleteDialog.user.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete user");
      }

      setSnackbar({
        open: true,
        message: "User deleted successfully",
        severity: "success",
      });
      fetchUsers();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : "Failed to delete user",
        severity: "error",
      });
    } finally {
      setActionLoading(false);
      setDeleteDialog({ open: false, user: null });
    }
  };

  const handleToggleUserStatus = async () => {
    if (!deactivateDialog.user) return;

    setActionLoading(true);
    try {
      const response = await fetch(
        `/api/admin/users/${deactivateDialog.user.id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isActive: deactivateDialog.action === "activate",
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update user status");
      }

      setSnackbar({
        open: true,
        message: `User ${deactivateDialog.action === "activate" ? "activated" : "deactivated"} successfully`,
        severity: "success",
      });
      fetchUsers();
    } catch (error) {
      setSnackbar({
        open: true,
        message:
          error instanceof Error ? error.message : "Failed to update user status",
        severity: "error",
      });
    } finally {
      setActionLoading(false);
      setDeactivateDialog({ open: false, user: null, action: "deactivate" });
    }
  };

  const handleResendInvitation = async (user: User) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/resend-invite`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to resend invitation");
      }

      setSnackbar({
        open: true,
        message: `Invitation resent to ${user.email}`,
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : "Failed to resend invitation",
        severity: "error",
      });
    } finally {
      setActionLoading(false);
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
            User Management
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manage all users in the system
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchUsers} disabled={loading}>
              <IconRefresh size={20} />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            color="primary"
            startIcon={<IconUserPlus size={18} />}
            onClick={() => router.push("/admin/invite")}
          >
            Invite User
          </Button>
        </Stack>
      </Stack>

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
              sx={{ minWidth: 300 }}
            />
            <ToggleButtonGroup
              value={roleFilter}
              exclusive
              onChange={handleRoleFilterChange}
              size="small"
            >
              <ToggleButton value="all">All Roles</ToggleButton>
              <ToggleButton value="admin">Admin</ToggleButton>
              <ToggleButton value="hr">HR</ToggleButton>
              <ToggleButton value="nd">ND</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </CardContent>
      </Card>

      {/* Users Table */}
      <DashboardCard
        title="All Users"
        subtitle={`Showing ${filteredUsers.length} of ${users.length} users`}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
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
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">
                      No users found.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>#{user.id}</TableCell>
                    <TableCell>
                      <Typography fontWeight={500}>
                        {user.name || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleChip(user.role)}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.isActive ? "Active" : "Inactive"}
                        color={user.isActive ? "success" : "default"}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip title="Resend Invitation">
                          <IconButton
                            size="small"
                            onClick={() => handleResendInvitation(user)}
                            color="primary"
                            disabled={actionLoading}
                          >
                            <IconMail size={18} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip
                          title={user.isActive ? "Deactivate User" : "Activate User"}
                        >
                          <IconButton
                            size="small"
                            onClick={() =>
                              setDeactivateDialog({
                                open: true,
                                user,
                                action: user.isActive ? "deactivate" : "activate",
                              })
                            }
                            color={user.isActive ? "warning" : "success"}
                          >
                            {user.isActive ? (
                              <IconUserOff size={18} />
                            ) : (
                              <IconUserCheck size={18} />
                            )}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete User">
                          <IconButton
                            size="small"
                            onClick={() => setDeleteDialog({ open: true, user })}
                            color="error"
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
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, user: null })}
      >
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the user{" "}
            <strong>{deleteDialog.user?.email}</strong>? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialog({ open: false, user: null })}
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteUser}
            color="error"
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Activate/Deactivate Confirmation Dialog */}
      <Dialog
        open={deactivateDialog.open}
        onClose={() =>
          setDeactivateDialog({ open: false, user: null, action: "deactivate" })
        }
      >
        <DialogTitle>
          {deactivateDialog.action === "activate"
            ? "Activate User"
            : "Deactivate User"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deactivateDialog.action === "activate"
              ? `Are you sure you want to activate the user ${deactivateDialog.user?.email}? They will be able to log in and access the system.`
              : `Are you sure you want to deactivate the user ${deactivateDialog.user?.email}? They will no longer be able to log in.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setDeactivateDialog({ open: false, user: null, action: "deactivate" })
            }
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleToggleUserStatus}
            color={deactivateDialog.action === "activate" ? "success" : "warning"}
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading
              ? "Processing..."
              : deactivateDialog.action === "activate"
              ? "Activate"
              : "Deactivate"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

