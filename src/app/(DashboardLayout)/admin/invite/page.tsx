"use client";
import {
  Box,
  Typography,
  Stack,
  Grid,
  Alert,
  CircularProgress,
  MenuItem,
  Button,
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconSend, IconArrowLeft } from "@tabler/icons-react";
import DashboardCard from "@/app/components/shared/DashboardCard";
import CustomTextField from "@/app/components/forms/theme-elements/CustomTextField";
import CustomFormLabel from "@/app/components/forms/theme-elements/CustomFormLabel";
import CustomSelect from "@/app/components/forms/theme-elements/CustomSelect";

const validationSchema = Yup.object({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  name: Yup.string().required("Name is required"),
  role: Yup.string()
    .oneOf(["nd", "hr", "admin"], "Invalid role")
    .required("Role is required"),
});

export default function AdminInvitePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      email: "",
      name: "",
      role: "nd",
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const response = await fetch("/api/admin/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to send invitation");
        }

        setSuccess(`Invitation sent successfully to ${values.email}!`);
        resetForm();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <Box>
      {/* Page Header */}
      <Stack direction="row" alignItems="center" spacing={2} mb={4}>
        <Button
          variant="text"
          startIcon={<IconArrowLeft size={18} />}
          onClick={() => router.back()}
        >
          Back
        </Button>
        <Box>
          <Typography variant="h4" fontWeight={600}>
            Invite New User
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Send an invitation email to a new team member
          </Typography>
        </Box>
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <DashboardCard
            title="Invitation Details"
            subtitle="The user will receive an email with a link to set up their account"
          >
            <form onSubmit={formik.handleSubmit}>
              <Stack spacing={3}>
                {error && (
                  <Alert severity="error" onClose={() => setError(null)}>
                    {error}
                  </Alert>
                )}

                {success && (
                  <Alert severity="success" onClose={() => setSuccess(null)}>
                    {success}
                  </Alert>
                )}

                <Box>
                  <CustomFormLabel htmlFor="name">Full Name *</CustomFormLabel>
                  <CustomTextField
                    id="name"
                    name="name"
                    fullWidth
                    placeholder="John Doe"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.name && Boolean(formik.errors.name)}
                    helperText={formik.touched.name && formik.errors.name}
                  />
                </Box>

                <Box>
                  <CustomFormLabel htmlFor="email">
                    Email Address *
                  </CustomFormLabel>
                  <CustomTextField
                    id="email"
                    name="email"
                    type="email"
                    fullWidth
                    placeholder="john@danceone.com"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.email && Boolean(formik.errors.email)}
                    helperText={formik.touched.email && formik.errors.email}
                  />
                </Box>

                <Box>
                  <CustomFormLabel htmlFor="role">User Role *</CustomFormLabel>
                  <CustomSelect
                    id="role"
                    name="role"
                    fullWidth
                    value={formik.values.role}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.role && Boolean(formik.errors.role)}
                  >
                    <MenuItem value="nd">National Director (ND)</MenuItem>
                    <MenuItem value="hr">Human Resources (HR)</MenuItem>
                    <MenuItem value="admin">Administrator</MenuItem>
                  </CustomSelect>
                  <Typography variant="caption" color="textSecondary" mt={1}>
                    {formik.values.role === "nd" &&
                      "Can create new hire requests and track their status"}
                    {formik.values.role === "hr" &&
                      "Can process onboarding requests and export data"}
                    {formik.values.role === "admin" &&
                      "Full access to all features including user management"}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={() => router.push("/admin/users")}
                  >
                    View All Users
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading || !formik.isValid}
                    startIcon={
                      loading ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        <IconSend size={18} />
                      )
                    }
                  >
                    {loading ? "Sending..." : "Send Invitation"}
                  </Button>
                </Stack>
              </Stack>
            </form>
          </DashboardCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <DashboardCard title="Role Permissions">
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" fontWeight={600} color="info.main">
                  National Director (ND)
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  • Create new hire requests
                  <br />
                  • View their own requests
                  <br />
                  • Resend candidate invitations
                  <br />• Track onboarding progress
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" fontWeight={600} color="success.main">
                  Human Resources (HR)
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  • View all onboarding requests
                  <br />
                  • Complete HR portion of forms
                  <br />
                  • Export data to CSV/Excel
                  <br />• Mark requests as complete
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" fontWeight={600} color="error.main">
                  Administrator
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  • All ND and HR permissions
                  <br />
                  • Invite new users
                  <br />
                  • Manage user accounts
                  <br />• Access admin dashboard
                </Typography>
              </Box>
            </Stack>
          </DashboardCard>
        </Grid>
      </Grid>
    </Box>
  );
}


