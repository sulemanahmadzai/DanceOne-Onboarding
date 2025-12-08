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
} from "@mui/material";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { IconArrowLeft, IconSend } from "@tabler/icons-react";
import DashboardCard from "@/app/components/shared/DashboardCard";
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

const validationSchema = Yup.object({
  candidateFirstName: Yup.string().required("First name is required"),
  candidateLastName: Yup.string().required("Last name is required"),
  candidateEmail: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  candidatePhone: Yup.string(),
  stateOfResidence: Yup.string().required("State of residence is required"),
  tourName: Yup.string().required("Tour name is required"),
  positionTitle: Yup.string(),
  hireDate: Yup.string().required("Hire date is required"),
  salaryEventRate: Yup.number().positive("Must be a positive number"),
  workerCategory: Yup.string().required("Worker category is required"),
  hireOrRehire: Yup.string().required("Hire type is required"),
  notes: Yup.string(),
});

export default function NewHireRequestPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const formik = useFormik({
    initialValues: {
      candidateFirstName: "",
      candidateLastName: "",
      candidateEmail: "",
      candidatePhone: "",
      stateOfResidence: "",
      tourName: "",
      positionTitle: "",
      hireDate: "",
      salaryEventRate: "",
      workerCategory: "",
      hireOrRehire: "",
      notes: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      setSubmitting(true);
      setError("");

      try {
        const response = await fetch("/api/onboarding/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to create request");
        }

        setSuccess(true);
        setTimeout(() => {
          router.push(`/nd/request/${data.id}`);
        }, 2000);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setSubmitting(false);
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
          onClick={() => router.push("/nd/dashboard")}
        >
          Back
        </Button>
        <Box>
          <Typography variant="h4" fontWeight={600}>
            New Hire Request
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Step 1 of 3 - National Director Form
          </Typography>
        </Box>
      </Stack>

      {/* Progress Stepper */}
      <Box mb={4}>
        <Stepper activeStep={0} alternativeLabel>
          <Step>
            <StepLabel>ND Form</StepLabel>
          </Step>
          <Step>
            <StepLabel>Candidate Form</StepLabel>
          </Step>
          <Step>
            <StepLabel>HR Form</StepLabel>
          </Step>
        </Stepper>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Request created successfully! Redirecting to details page...
        </Alert>
      )}

      <form onSubmit={formik.handleSubmit}>
        {/* Candidate Information */}
        <DashboardCard
          title="Candidate Information"
          subtitle="Basic information about the candidate"
        >
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <CustomFormLabel htmlFor="candidateFirstName">
                First Name *
              </CustomFormLabel>
              <CustomTextField
                id="candidateFirstName"
                name="candidateFirstName"
                fullWidth
                value={formik.values.candidateFirstName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.candidateFirstName &&
                  Boolean(formik.errors.candidateFirstName)
                }
                helperText={
                  formik.touched.candidateFirstName &&
                  formik.errors.candidateFirstName
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <CustomFormLabel htmlFor="candidateLastName">
                Last Name *
              </CustomFormLabel>
              <CustomTextField
                id="candidateLastName"
                name="candidateLastName"
                fullWidth
                value={formik.values.candidateLastName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.candidateLastName &&
                  Boolean(formik.errors.candidateLastName)
                }
                helperText={
                  formik.touched.candidateLastName &&
                  formik.errors.candidateLastName
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
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
                  formik.touched.candidateEmail && formik.errors.candidateEmail
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <CustomFormLabel htmlFor="candidatePhone">
                Phone Number
              </CustomFormLabel>
              <CustomTextField
                id="candidatePhone"
                name="candidatePhone"
                fullWidth
                value={formik.values.candidatePhone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <CustomFormLabel htmlFor="stateOfResidence">
                State of Residence *
              </CustomFormLabel>
              <CustomSelect
                id="stateOfResidence"
                name="stateOfResidence"
                fullWidth
                value={formik.values.stateOfResidence}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.stateOfResidence &&
                  Boolean(formik.errors.stateOfResidence)
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
          </Grid>
        </DashboardCard>

        <Box mt={3} />

        {/* Job Details */}
        <DashboardCard
          title="Job Details"
          subtitle="Position and employment information"
        >
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <CustomFormLabel htmlFor="tourName">Tour Name *</CustomFormLabel>
              <CustomTextField
                id="tourName"
                name="tourName"
                fullWidth
                value={formik.values.tourName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.tourName && Boolean(formik.errors.tourName)
                }
                helperText={formik.touched.tourName && formik.errors.tourName}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <CustomFormLabel htmlFor="positionTitle">
                Position Title
              </CustomFormLabel>
              <CustomTextField
                id="positionTitle"
                name="positionTitle"
                fullWidth
                value={formik.values.positionTitle}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <CustomFormLabel htmlFor="hireDate">Hire Date *</CustomFormLabel>
              <CustomTextField
                id="hireDate"
                name="hireDate"
                type="date"
                fullWidth
                value={formik.values.hireDate}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.hireDate && Boolean(formik.errors.hireDate)
                }
                helperText={formik.touched.hireDate && formik.errors.hireDate}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <CustomFormLabel htmlFor="salaryEventRate">
                Salary / Event Rate
              </CustomFormLabel>
              <CustomTextField
                id="salaryEventRate"
                name="salaryEventRate"
                type="number"
                fullWidth
                value={formik.values.salaryEventRate}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.salaryEventRate &&
                  Boolean(formik.errors.salaryEventRate)
                }
                helperText={
                  formik.touched.salaryEventRate &&
                  formik.errors.salaryEventRate
                }
                InputProps={{
                  startAdornment: (
                    <Typography sx={{ mr: 1 }} color="textSecondary">
                      $
                    </Typography>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <CustomFormLabel htmlFor="workerCategory">
                Worker Category *
              </CustomFormLabel>
              <CustomSelect
                id="workerCategory"
                name="workerCategory"
                fullWidth
                value={formik.values.workerCategory}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.workerCategory &&
                  Boolean(formik.errors.workerCategory)
                }
              >
                <MenuItem value="">Select Category</MenuItem>
                <MenuItem value="W2">W2 Employee</MenuItem>
                <MenuItem value="1099">1099 Contractor</MenuItem>
              </CustomSelect>
            </Grid>
            <Grid item xs={12} md={6}>
              <CustomFormLabel htmlFor="hireOrRehire">
                Hire Type *
              </CustomFormLabel>
              <CustomSelect
                id="hireOrRehire"
                name="hireOrRehire"
                fullWidth
                value={formik.values.hireOrRehire}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.hireOrRehire &&
                  Boolean(formik.errors.hireOrRehire)
                }
              >
                <MenuItem value="">Select Type</MenuItem>
                <MenuItem value="new_hire">New Hire</MenuItem>
                <MenuItem value="rehire">Rehire</MenuItem>
              </CustomSelect>
            </Grid>
            <Grid item xs={12}>
              <CustomFormLabel htmlFor="notes">Notes (Optional)</CustomFormLabel>
              <CustomTextField
                id="notes"
                name="notes"
                fullWidth
                multiline
                rows={4}
                value={formik.values.notes}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Any additional notes about this hire..."
              />
            </Grid>
          </Grid>
        </DashboardCard>

        <Divider sx={{ my: 4 }} />

        {/* Submit Button */}
        <Stack direction="row" justifyContent="flex-end" spacing={2}>
          <Button
            variant="outlined"
            onClick={() => router.push("/nd/dashboard")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            startIcon={<IconSend size={18} />}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)",
              },
            }}
          >
            {submitting ? "Submitting..." : "Submit & Send to Candidate"}
          </Button>
        </Stack>
      </form>
    </Box>
  );
}

