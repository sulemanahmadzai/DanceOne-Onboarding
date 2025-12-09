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
  Card,
  CardContent,
  Skeleton,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { IconSend, IconCheck } from "@tabler/icons-react";
import CustomTextField from "@/app/components/forms/theme-elements/CustomTextField";
import CustomFormLabel from "@/app/components/forms/theme-elements/CustomFormLabel";
import CustomSelect from "@/app/components/forms/theme-elements/CustomSelect";

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

const MARITAL_STATUS = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
];

const validationSchema = Yup.object({
  taxIdNumber: Yup.string()
    .matches(/^\d{3}-?\d{2}-?\d{4}$/, "Invalid SSN format (XXX-XX-XXXX)")
    .required("Tax ID / SSN is required"),
  birthDate: Yup.string().required("Birth date is required"),
  maritalStatusState: Yup.string().required("Marital status is required"),
  addressLine1: Yup.string().required("Address is required"),
  addressLine2: Yup.string(),
  addressCity: Yup.string().required("City is required"),
  addressState: Yup.string().required("State is required"),
  addressZipCode: Yup.string()
    .matches(/^\d{5}(-\d{4})?$/, "Invalid ZIP code")
    .required("ZIP code is required"),
  candidatePhone: Yup.string().required("Phone number is required"),
  candidateEmail: Yup.string()
    .email("Invalid email")
    .required("Email is required"),
});

interface PrefilledData {
  candidateFirstName: string;
  candidateLastName: string;
  candidateEmail: string;
  candidatePhone: string | null;
  stateOfResidence: string | null;
  tourName: string | null;
  positionTitle: string | null;
}

export default function CandidateFormPage() {
  const params = useParams();
  const [prefilledData, setPrefilledData] = useState<PrefilledData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/candidate/${params.token}`);
        const data = await response.json();

        if (!response.ok) {
          if (data.alreadySubmitted) {
            setAlreadySubmitted(true);
          } else {
            throw new Error(data.error || "Invalid or expired link");
          }
        } else {
          setPrefilledData(data);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.token]);

  const formik = useFormik({
    initialValues: {
      taxIdNumber: "",
      birthDate: "",
      maritalStatusState: "",
      addressLine1: "",
      addressLine2: "",
      addressCity: "",
      addressState: "",
      addressZipCode: "",
      candidatePhone: prefilledData?.candidatePhone || "",
      candidateEmail: prefilledData?.candidateEmail || "",
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      setSubmitting(true);
      setError("");

      try {
        const response = await fetch(`/api/candidate/${params.token}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to submit form");
        }

        setSuccess(true);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Update initial values when prefilled data loads
  useEffect(() => {
    if (prefilledData) {
      formik.setFieldValue("candidatePhone", prefilledData.candidatePhone || "");
      formik.setFieldValue("candidateEmail", prefilledData.candidateEmail || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefilledData]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          p: 2,
        }}
      >
        <Card sx={{ maxWidth: 600, width: "100%", p: 4 }}>
          <Skeleton variant="text" width={200} height={40} />
          <Skeleton variant="rectangular" height={300} sx={{ mt: 2 }} />
        </Card>
      </Box>
    );
  }

  if (error && !prefilledData) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          p: 2,
        }}
      >
        <Card sx={{ maxWidth: 500, width: "100%", textAlign: "center" }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" fontWeight={600} color="error" mb={2}>
              Link Invalid or Expired
            </Typography>
            <Typography color="textSecondary">
              This onboarding link is no longer valid. Please contact the person
              who sent you this link for assistance.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (alreadySubmitted) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          p: 2,
        }}
      >
        <Card sx={{ maxWidth: 500, width: "100%", textAlign: "center" }}>
          <CardContent sx={{ p: 4 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                bgcolor: "success.light",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 3,
              }}
            >
              <IconCheck size={40} color="#13DEB9" />
            </Box>
            <Typography variant="h4" fontWeight={600} mb={2}>
              Already Submitted
            </Typography>
            <Typography color="textSecondary">
              You have already submitted your information. The HR team will
              complete the final step of your onboarding process.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (success) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          p: 2,
        }}
      >
        <Card sx={{ maxWidth: 500, width: "100%", textAlign: "center" }}>
          <CardContent sx={{ p: 4 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                bgcolor: "success.light",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 3,
              }}
            >
              <IconCheck size={40} color="#13DEB9" />
            </Box>
            <Typography variant="h4" fontWeight={600} mb={2}>
              Thank You!
            </Typography>
            <Typography color="textSecondary">
              Your information has been submitted successfully. The HR team will
              complete the final step of your onboarding process.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        py: 4,
        px: 2,
      }}
    >
      <Box maxWidth={800} mx="auto">
        {/* Header */}
        <Box textAlign="center" mb={4}>
          <Typography
            variant="h3"
            fontWeight={700}
            color="white"
            sx={{ textShadow: "0 2px 4px rgba(0,0,0,0.2)" }}
          >
            DanceOne Onboarding
          </Typography>
          <Typography variant="h6" color="white" sx={{ opacity: 0.9 }} mt={1}>
            Welcome, {prefilledData?.candidateFirstName}!
          </Typography>
        </Box>

        {/* Progress Stepper */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stepper activeStep={1} alternativeLabel>
              <Step completed>
                <StepLabel>ND Form</StepLabel>
              </Step>
              <Step>
                <StepLabel>Your Information</StepLabel>
              </Step>
              <Step>
                <StepLabel>HR Review</StepLabel>
              </Step>
            </Stepper>
          </CardContent>
        </Card>

        {/* Job Info Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} mb={2}>
              Position Details
            </Typography>
            <Grid container spacing={2}>
              <Grid size={6}>
                <Typography variant="caption" color="textSecondary">
                  Tour Name
                </Typography>
                <Typography fontWeight={500}>
                  {prefilledData?.tourName || "-"}
                </Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="caption" color="textSecondary">
                  Position
                </Typography>
                <Typography fontWeight={500}>
                  {prefilledData?.positionTitle || "-"}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={formik.handleSubmit}>
          {/* Personal Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Personal Information
              </Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <CustomFormLabel htmlFor="taxIdNumber">
                    Tax ID / SSN *
                  </CustomFormLabel>
                  <CustomTextField
                    id="taxIdNumber"
                    name="taxIdNumber"
                    fullWidth
                    placeholder="XXX-XX-XXXX"
                    value={formik.values.taxIdNumber}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.taxIdNumber &&
                      Boolean(formik.errors.taxIdNumber)
                    }
                    helperText={
                      formik.touched.taxIdNumber && formik.errors.taxIdNumber
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <CustomFormLabel htmlFor="birthDate">
                    Date of Birth *
                  </CustomFormLabel>
                  <CustomTextField
                    id="birthDate"
                    name="birthDate"
                    type="date"
                    fullWidth
                    value={formik.values.birthDate}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.birthDate &&
                      Boolean(formik.errors.birthDate)
                    }
                    helperText={
                      formik.touched.birthDate && formik.errors.birthDate
                    }
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <CustomFormLabel htmlFor="maritalStatusState">
                    Marital Status *
                  </CustomFormLabel>
                  <CustomSelect
                    id="maritalStatusState"
                    name="maritalStatusState"
                    fullWidth
                    value={formik.values.maritalStatusState}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.maritalStatusState &&
                      Boolean(formik.errors.maritalStatusState)
                    }
                  >
                    <MenuItem value="">Select Status</MenuItem>
                    {MARITAL_STATUS.map((status) => (
                      <MenuItem key={status.value} value={status.value}>
                        {status.label}
                      </MenuItem>
                    ))}
                  </CustomSelect>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Address */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Address
              </Typography>
              <Grid container spacing={3}>
                <Grid size={12}>
                  <CustomFormLabel htmlFor="addressLine1">
                    Address Line 1 *
                  </CustomFormLabel>
                  <CustomTextField
                    id="addressLine1"
                    name="addressLine1"
                    fullWidth
                    value={formik.values.addressLine1}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.addressLine1 &&
                      Boolean(formik.errors.addressLine1)
                    }
                    helperText={
                      formik.touched.addressLine1 && formik.errors.addressLine1
                    }
                  />
                </Grid>
                <Grid size={12}>
                  <CustomFormLabel htmlFor="addressLine2">
                    Address Line 2
                  </CustomFormLabel>
                  <CustomTextField
                    id="addressLine2"
                    name="addressLine2"
                    fullWidth
                    value={formik.values.addressLine2}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Apt, Suite, Unit, etc."
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <CustomFormLabel htmlFor="addressCity">City *</CustomFormLabel>
                  <CustomTextField
                    id="addressCity"
                    name="addressCity"
                    fullWidth
                    value={formik.values.addressCity}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.addressCity &&
                      Boolean(formik.errors.addressCity)
                    }
                    helperText={
                      formik.touched.addressCity && formik.errors.addressCity
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <CustomFormLabel htmlFor="addressState">
                    State *
                  </CustomFormLabel>
                  <CustomSelect
                    id="addressState"
                    name="addressState"
                    fullWidth
                    value={formik.values.addressState}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.addressState &&
                      Boolean(formik.errors.addressState)
                    }
                  >
                    <MenuItem value="">Select State</MenuItem>
                    {US_STATES.map((state) => (
                      <MenuItem key={state.value} value={state.value}>
                        {state.label}
                      </MenuItem>
                    ))}
                  </CustomSelect>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <CustomFormLabel htmlFor="addressZipCode">
                    ZIP Code *
                  </CustomFormLabel>
                  <CustomTextField
                    id="addressZipCode"
                    name="addressZipCode"
                    fullWidth
                    value={formik.values.addressZipCode}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.addressZipCode &&
                      Boolean(formik.errors.addressZipCode)
                    }
                    helperText={
                      formik.touched.addressZipCode &&
                      formik.errors.addressZipCode
                    }
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Contact Information
              </Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <CustomFormLabel htmlFor="candidatePhone">
                    Phone Number *
                  </CustomFormLabel>
                  <CustomTextField
                    id="candidatePhone"
                    name="candidatePhone"
                    fullWidth
                    value={formik.values.candidatePhone}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.candidatePhone &&
                      Boolean(formik.errors.candidatePhone)
                    }
                    helperText={
                      formik.touched.candidatePhone &&
                      formik.errors.candidatePhone
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <CustomFormLabel htmlFor="candidateEmail">
                    Email Address *
                  </CustomFormLabel>
                  <CustomTextField
                    id="candidateEmail"
                    name="candidateEmail"
                    type="email"
                    fullWidth
                    value={formik.values.candidateEmail}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.candidateEmail &&
                      Boolean(formik.errors.candidateEmail)
                    }
                    helperText={
                      formik.touched.candidateEmail &&
                      formik.errors.candidateEmail
                    }
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Stack direction="row" justifyContent="center">
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={submitting}
              startIcon={<IconSend size={18} />}
              sx={{
                px: 6,
                py: 1.5,
                background: "white",
                color: "#667eea",
                "&:hover": {
                  background: "#f0f0f0",
                },
              }}
            >
              {submitting ? "Submitting..." : "Submit Information"}
            </Button>
          </Stack>
        </form>
      </Box>
    </Box>
  );
}

