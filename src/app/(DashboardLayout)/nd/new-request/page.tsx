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
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { IconArrowLeft, IconSend } from "@tabler/icons-react";
import DashboardCard from "@/app/components/shared/DashboardCard";
import CustomTextField from "@/app/components/forms/theme-elements/CustomTextField";
import CustomFormLabel from "@/app/components/forms/theme-elements/CustomFormLabel";
import CustomSelect from "@/app/components/forms/theme-elements/CustomSelect";
import { POSITION_TITLES } from "@/lib/constants/hr-options";

const TOUR_NAMES = [
  { value: "Starpower", label: "Starpower" },
  { value: "Revolution", label: "Revolution" },
  { value: "Imagine", label: "Imagine" },
  { value: "Nexstar", label: "Nexstar" },
  { value: "DreamMaker", label: "DreamMaker" },
  { value: "Believe", label: "Believe" },
  { value: "Wild", label: "Wild" },
  { value: "Radix", label: "Radix" },
  { value: "Jump", label: "Jump" },
  { value: "24Seven", label: "24Seven" },
  { value: "Nuvo", label: "Nuvo" },
  { value: "Kaos", label: "Kaos" },
  { value: "Ovation", label: "Ovation" },
  { value: "Power Pak", label: "Power Pak" },
  { value: "WCW WDP", label: "WCW WDP" },
  { value: "Other", label: "Other" },
];

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
  tourNameSelect: Yup.string().required("Tour name is required"),
  tourNameOther: Yup.string().when("tourNameSelect", {
    is: "Other",
    then: (schema) => schema.required("Please specify the tour name"),
    otherwise: (schema) => schema,
  }),
  positionTitle: Yup.string(),
  hireDate: Yup.string().required("Hire date is required"),
  eventRate: Yup.number().positive("Must be a positive number").nullable(),
  dayRate: Yup.number().positive("Must be a positive number").nullable(),
  workerCategory: Yup.string().required("Worker category is required"),
  hireOrRehire: Yup.string().required("Hire type is required"),
  notes: Yup.string(),
});

export default function NewHireRequestPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userRole, setUserRole] = useState<string>("nd");

  // Fetch user role to determine correct redirect
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch("/api/auth/user-role");
        if (response.ok) {
          const data = await response.json();
          setUserRole(data.role || "nd");
        }
      } catch (err) {
        console.error("Error fetching user role:", err);
      }
    };
    fetchUserRole();
  }, []);

  // Get the correct dashboard path based on user role
  const getDashboardPath = () => {
    switch (userRole) {
      case "admin":
        return "/admin/dashboard";
      case "hr":
        return "/hr/dashboard";
      default:
        return "/nd/dashboard";
    }
  };

  // Get the correct request detail path based on user role
  const getRequestDetailPath = (id: number) => {
    switch (userRole) {
      case "admin":
      case "hr":
        return `/hr/request/${id}`;
      default:
        return `/nd/request/${id}`;
    }
  };

  const formik = useFormik({
    initialValues: {
      candidateFirstName: "",
      candidateLastName: "",
      candidateEmail: "",
      candidatePhone: "",
      stateOfResidence: "",
      tourNameSelect: "",
      tourNameOther: "",
      positionTitle: "",
      hireDate: "",
      eventRate: "",
      dayRate: "",
      workerCategory: "",
      hireOrRehire: "",
      notes: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      setSubmitting(true);
      setError("");

      // Combine tourName fields - use Other value if "Other" is selected
      const tourName =
        values.tourNameSelect === "Other"
          ? values.tourNameOther
          : values.tourNameSelect;

      const submitData = {
        ...values,
        tourName,
      };

      try {
        const response = await fetch("/api/onboarding/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitData),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to create request");
        }

        setSuccess(true);
        setTimeout(() => {
          router.push(getRequestDetailPath(data.id));
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
          onClick={() => router.push(getDashboardPath())}
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
            <Grid size={{ xs: 12, md: 6 }}>
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
            <Grid size={{ xs: 12, md: 6 }}>
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
                  formik.touched.candidateEmail && formik.errors.candidateEmail
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
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
                error={
                  formik.touched.candidatePhone &&
                  Boolean(formik.errors.candidatePhone)
                }
                helperText={
                  formik.touched.candidatePhone && formik.errors.candidatePhone
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
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
            <Grid size={{ xs: 12, md: 6 }}>
              <CustomFormLabel htmlFor="tourNameSelect">
                Tour Name *
              </CustomFormLabel>
              <CustomSelect
                id="tourNameSelect"
                name="tourNameSelect"
                fullWidth
                value={formik.values.tourNameSelect}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.tourNameSelect &&
                  Boolean(formik.errors.tourNameSelect)
                }
              >
                <MenuItem value="">Select Tour</MenuItem>
                {TOUR_NAMES.map((tour) => (
                  <MenuItem key={tour.value} value={tour.value}>
                    {tour.label}
                  </MenuItem>
                ))}
              </CustomSelect>
            </Grid>
            {formik.values.tourNameSelect === "Other" && (
              <Grid size={{ xs: 12, md: 6 }}>
                <CustomFormLabel htmlFor="tourNameOther">
                  Specify Tour Name *
                </CustomFormLabel>
                <CustomTextField
                  id="tourNameOther"
                  name="tourNameOther"
                  fullWidth
                  placeholder="Enter tour name"
                  value={formik.values.tourNameOther}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.tourNameOther &&
                    Boolean(formik.errors.tourNameOther)
                  }
                  helperText={
                    formik.touched.tourNameOther && formik.errors.tourNameOther
                  }
                />
              </Grid>
            )}
            <Grid size={{ xs: 12, md: 6 }}>
              <CustomFormLabel htmlFor="positionTitle">
                Position Title
              </CustomFormLabel>
              <CustomSelect
                id="positionTitle"
                name="positionTitle"
                fullWidth
                value={formik.values.positionTitle || ""}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              >
                <MenuItem value="">Select Position Title</MenuItem>
                {POSITION_TITLES.map((title) => (
                  <MenuItem key={title.value} value={title.value}>
                    {title.label}
                  </MenuItem>
                ))}
              </CustomSelect>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
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
            <Grid size={{ xs: 12, md: 6 }}>
              <CustomFormLabel htmlFor="eventRate">Event Rate</CustomFormLabel>
              <CustomTextField
                id="eventRate"
                name="eventRate"
                type="number"
                fullWidth
                value={formik.values.eventRate}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.eventRate && Boolean(formik.errors.eventRate)
                }
                helperText={formik.touched.eventRate && formik.errors.eventRate}
                InputProps={{
                  startAdornment: (
                    <Typography sx={{ mr: 1 }} color="textSecondary">
                      $
                    </Typography>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <CustomFormLabel htmlFor="dayRate">Day Rate</CustomFormLabel>
              <CustomTextField
                id="dayRate"
                name="dayRate"
                type="number"
                fullWidth
                value={formik.values.dayRate}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.dayRate && Boolean(formik.errors.dayRate)}
                helperText={formik.touched.dayRate && formik.errors.dayRate}
                InputProps={{
                  startAdornment: (
                    <Typography sx={{ mr: 1 }} color="textSecondary">
                      $
                    </Typography>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
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
                <MenuItem value="1099">1099</MenuItem>
                <MenuItem value="W2">W2</MenuItem>
              </CustomSelect>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
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
                <MenuItem value="hire">HIRE</MenuItem>
                <MenuItem value="rehire">REHIRE</MenuItem>
              </CustomSelect>
            </Grid>
            <Grid size={12}>
              <CustomFormLabel htmlFor="notes">
                Notes (Optional)
              </CustomFormLabel>
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
            onClick={() => router.push(getDashboardPath())}
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
