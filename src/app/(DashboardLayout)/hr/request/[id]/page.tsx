"use client";
import {
  Box,
  Typography,
  Button,
  Grid,
  MenuItem,
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
} from "@mui/material";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { IconArrowLeft, IconCheck, IconSend } from "@tabler/icons-react";
import DashboardCard from "@/app/components/shared/DashboardCard";
import CustomTextField from "@/app/components/forms/theme-elements/CustomTextField";
import CustomFormLabel from "@/app/components/forms/theme-elements/CustomFormLabel";
import CustomSelect from "@/app/components/forms/theme-elements/CustomSelect";
import { OnboardingStatus } from "@/lib/db/schema";

const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
];

const validationSchema = Yup.object({
  changeEffectiveDate: Yup.string().required(
    "Change effective date is required"
  ),
  companyCode: Yup.string().required("Company code is required"),
  homeDepartment: Yup.string().required("Home department is required"),
  sui: Yup.string().required("SUI is required"),
  willWorkerCompleteI9: Yup.string().required("I-9 completion is required"),
  eVerifyWorkLocation: Yup.string().required(
    "E-Verify work location is required"
  ),
});

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
  createdByNd?: {
    name: string | null;
    email: string;
  };
}

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

// Helper to get dashboard path based on role
const getDashboardPath = (role: string) => {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "nd":
      return "/nd/dashboard";
    default:
      return "/hr/dashboard";
  }
};

export default function HRRequestPage() {
  const router = useRouter();
  const params = useParams();
  const [request, setRequest] = useState<RequestDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userRole, setUserRole] = useState<string>("hr");

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
          setUserRole(roleData.role || "hr");
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

  const formik = useFormik({
    initialValues: {
      changeEffectiveDate: request?.changeEffectiveDate || "",
      companyCode: request?.companyCode || "",
      homeDepartment: request?.homeDepartment || "",
      sui: request?.sui || "",
      willWorkerCompleteI9: request?.willWorkerCompleteI9 || "",
      eVerifyWorkLocation: request?.eVerifyWorkLocation || "",
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      setSubmitting(true);
      setError("");

      try {
        const response = await fetch(
          `/api/onboarding/${params.id}/hr-complete`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to complete request");
        }

        setSuccess(true);
        setRequest((prev) =>
          prev ? { ...prev, status: OnboardingStatus.COMPLETED } : null
        );
      } catch (err: any) {
        setError(err.message);
      } finally {
        setSubmitting(false);
      }
    },
  });

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

  if (error && !request) {
    return (
      <Box>
        <Alert severity="error">{error}</Alert>
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

  const isWaitingForHR = request?.status === OnboardingStatus.WAITING_FOR_HR;
  const isCompleted = request?.status === OnboardingStatus.COMPLETED;

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
              Request #{request?.id}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {request?.candidateFirstName} {request?.candidateLastName}
            </Typography>
          </Box>
        </Stack>
        {request && getStatusChip(request.status)}
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

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} icon={<IconCheck size={20} />}>
          Onboarding completed successfully! This record is now ready for
          export.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Read-only ND Data */}
        <Grid size={{ xs: 12, md: 6 }}>
          <DashboardCard
            title="ND Information"
            subtitle="Submitted by National Director"
          >
            <>
              <InfoRow
                label="Created By"
                value={
                  request?.createdByNd?.name || request?.createdByNd?.email
                }
              />
              <InfoRow label="Tour Name" value={request?.tourName} />
              <InfoRow label="Position Title" value={request?.positionTitle} />
              <InfoRow
                label="Hire Date"
                value={
                  request?.hireDate
                    ? new Date(request.hireDate).toLocaleDateString()
                    : null
                }
              />
              <InfoRow
                label="Event Rate"
                value={request?.eventRate ? `$${request.eventRate}` : null}
              />
              <InfoRow
                label="Day Rate"
                value={request?.dayRate ? `$${request.dayRate}` : null}
              />
              <InfoRow
                label="Worker Category"
                value={
                  request?.workerCategory === "W2"
                    ? "W2 Employee"
                    : request?.workerCategory === "1099"
                    ? "1099 Contractor"
                    : request?.workerCategory
                }
              />
              <InfoRow
                label="Hire Type"
                value={
                  request?.hireOrRehire === "new_hire"
                    ? "New Hire"
                    : request?.hireOrRehire === "rehire"
                    ? "Rehire"
                    : request?.hireOrRehire
                }
              />
              {request?.notes && (
                <InfoRow label="Notes" value={request.notes} />
              )}
            </>
          </DashboardCard>
        </Grid>

        {/* Read-only Candidate Data */}
        <Grid size={{ xs: 12, md: 6 }}>
          <DashboardCard
            title="Candidate Information"
            subtitle="Submitted by candidate"
          >
            <>
              <InfoRow
                label="Full Name"
                value={`${request?.candidateFirstName} ${request?.candidateLastName}`}
              />
              <InfoRow label="Email" value={request?.candidateEmail} />
              <InfoRow label="Phone" value={request?.candidatePhone} />
              <InfoRow
                label="Tax ID / SSN"
                value={
                  request?.taxIdNumber
                    ? "***-**-" + request.taxIdNumber.slice(-4)
                    : null
                }
              />
              <InfoRow
                label="Date of Birth"
                value={
                  request?.birthDate
                    ? new Date(request.birthDate).toLocaleDateString()
                    : null
                }
              />
              <InfoRow
                label="Marital Status"
                value={
                  request?.maritalStatusState
                    ? request.maritalStatusState.charAt(0).toUpperCase() +
                      request.maritalStatusState.slice(1)
                    : null
                }
              />
              <Divider sx={{ my: 2 }} />
              <InfoRow label="Address Line 1" value={request?.addressLine1} />
              <InfoRow label="Address Line 2" value={request?.addressLine2} />
              <InfoRow
                label="City, State ZIP"
                value={
                  request?.addressCity
                    ? `${request.addressCity}, ${request.addressState} ${request.addressZipCode}`
                    : null
                }
              />
            </>
          </DashboardCard>
        </Grid>

        {/* HR Form */}
        <Grid size={12}>
          <DashboardCard
            title="HR Details - ADP Information"
            subtitle={
              isCompleted
                ? "Completed"
                : isWaitingForHR
                ? "Complete the following fields"
                : "Waiting for candidate to submit their information"
            }
          >
            <form onSubmit={formik.handleSubmit}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <CustomFormLabel htmlFor="changeEffectiveDate">
                    Change Effective Date *
                  </CustomFormLabel>
                  <CustomTextField
                    id="changeEffectiveDate"
                    name="changeEffectiveDate"
                    type="date"
                    fullWidth
                    disabled={!isWaitingForHR}
                    value={formik.values.changeEffectiveDate}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.changeEffectiveDate &&
                      Boolean(formik.errors.changeEffectiveDate)
                    }
                    helperText={
                      formik.touched.changeEffectiveDate &&
                      formik.errors.changeEffectiveDate
                    }
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <CustomFormLabel htmlFor="companyCode">
                    Company Code *
                  </CustomFormLabel>
                  <CustomTextField
                    id="companyCode"
                    name="companyCode"
                    fullWidth
                    disabled={!isWaitingForHR}
                    value={formik.values.companyCode}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.companyCode &&
                      Boolean(formik.errors.companyCode)
                    }
                    helperText={
                      formik.touched.companyCode && formik.errors.companyCode
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <CustomFormLabel htmlFor="homeDepartment">
                    Home Department *
                  </CustomFormLabel>
                  <CustomTextField
                    id="homeDepartment"
                    name="homeDepartment"
                    fullWidth
                    disabled={!isWaitingForHR}
                    value={formik.values.homeDepartment}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.homeDepartment &&
                      Boolean(formik.errors.homeDepartment)
                    }
                    helperText={
                      formik.touched.homeDepartment &&
                      formik.errors.homeDepartment
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <CustomFormLabel htmlFor="sui">
                    SUI (State Unemployment Insurance) *
                  </CustomFormLabel>
                  <CustomSelect
                    id="sui"
                    name="sui"
                    fullWidth
                    disabled={!isWaitingForHR}
                    value={formik.values.sui}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.sui && Boolean(formik.errors.sui)}
                  >
                    <MenuItem value="">Select State</MenuItem>
                    {US_STATES.map((state) => (
                      <MenuItem key={state.value} value={state.value}>
                        {state.label}
                      </MenuItem>
                    ))}
                  </CustomSelect>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <CustomFormLabel htmlFor="willWorkerCompleteI9">
                    Will Worker Complete I-9? *
                  </CustomFormLabel>
                  <CustomSelect
                    id="willWorkerCompleteI9"
                    name="willWorkerCompleteI9"
                    fullWidth
                    disabled={!isWaitingForHR}
                    value={formik.values.willWorkerCompleteI9}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.willWorkerCompleteI9 &&
                      Boolean(formik.errors.willWorkerCompleteI9)
                    }
                  >
                    <MenuItem value="">Select</MenuItem>
                    <MenuItem value="yes">Yes</MenuItem>
                    <MenuItem value="no">No</MenuItem>
                  </CustomSelect>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <CustomFormLabel htmlFor="eVerifyWorkLocation">
                    E-Verify Work Location *
                  </CustomFormLabel>
                  <CustomTextField
                    id="eVerifyWorkLocation"
                    name="eVerifyWorkLocation"
                    fullWidth
                    disabled={!isWaitingForHR}
                    value={formik.values.eVerifyWorkLocation}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.eVerifyWorkLocation &&
                      Boolean(formik.errors.eVerifyWorkLocation)
                    }
                    helperText={
                      formik.touched.eVerifyWorkLocation &&
                      formik.errors.eVerifyWorkLocation
                    }
                  />
                </Grid>
              </Grid>

              {isWaitingForHR && (
                <>
                  <Divider sx={{ my: 4 }} />
                  <Stack direction="row" justifyContent="flex-end" spacing={2}>
                    <Button
                      variant="outlined"
                      onClick={() => router.push(getDashboardPath(userRole))}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={submitting}
                      startIcon={<IconSend size={18} />}
                      sx={{
                        background:
                          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        "&:hover": {
                          background:
                            "linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)",
                        },
                      }}
                    >
                      {submitting ? "Completing..." : "Complete Onboarding"}
                    </Button>
                  </Stack>
                </>
              )}
            </form>
          </DashboardCard>
        </Grid>
      </Grid>
    </Box>
  );
}
