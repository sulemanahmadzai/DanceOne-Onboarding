"use client";
import {
  Box,
  Typography,
  Stack,
  Alert,
  CircularProgress,
  Button,
  Card,
  CardContent,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconLock, IconEye, IconEyeOff, IconCheck } from "@tabler/icons-react";
import CustomTextField from "@/app/components/forms/theme-elements/CustomTextField";
import CustomFormLabel from "@/app/components/forms/theme-elements/CustomFormLabel";
import { createBrowserClient } from "@supabase/ssr";

const validationSchema = Yup.object({
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[0-9]/, "Password must contain at least one number")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Please confirm your password"),
});

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const verifyToken = async () => {
      try {
        // Check if there's an existing session from the invite link
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
        }

        if (session?.user) {
          setUserEmail(session.user.email || null);
          setUserName(session.user.user_metadata?.name || null);
          setVerifying(false);
          return;
        }

        // Try to exchange the token from URL hash (handles both invite and recovery types)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const type = hashParams.get("type");

        // Handle recovery type (password reset link) or invite type
        if ((type === "recovery" || type === "invite") && accessToken && refreshToken) {
          const { data, error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (setSessionError) {
            console.error("Set session error:", setSessionError);
            setError("Failed to verify invitation. Please try again or contact your administrator.");
            setVerifying(false);
            return;
          }

          if (data.user) {
            setUserEmail(data.user.email || null);
            setUserName(data.user.user_metadata?.name || null);
            setVerifying(false);
            return;
          }
        }
        
        // Also check for token in query params (some email clients modify URLs)
        const token = searchParams.get("token");
        const tokenType = searchParams.get("type");
        
        if (token && tokenType === "recovery") {
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: "recovery",
          });

          if (verifyError) {
            console.error("Verify OTP error:", verifyError);
            setError("Invalid or expired invitation link. Please contact your administrator.");
            setVerifying(false);
            return;
          }

          if (data.user) {
            setUserEmail(data.user.email || null);
            setUserName(data.user.user_metadata?.name || null);
            setVerifying(false);
            return;
          }
        }

        // No valid session or token found
        setError("Invalid or expired invitation link. Please contact your administrator for a new invitation.");
      } catch (err) {
        console.error("Verification error:", err);
        setError("An error occurred while verifying your invitation.");
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [supabase.auth, searchParams]);

  const formik = useFormik({
    initialValues: {
      password: "",
      confirmPassword: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setError(null);

      try {
        // Update the user's password
        const { error: updateError } = await supabase.auth.updateUser({
          password: values.password,
        });

        if (updateError) {
          throw new Error(updateError.message);
        }

        // Sign out so they can log in fresh with new password
        await supabase.auth.signOut();

        setSuccess(true);
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/auth/login");
        }, 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to set password");
      } finally {
        setLoading(false);
      }
    },
  });

  if (verifying) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
        }}
      >
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={48} />
          <Typography>Verifying your invitation...</Typography>
        </Stack>
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
          bgcolor: "background.default",
          p: 2,
        }}
      >
        <Card sx={{ maxWidth: 480, width: "100%" }}>
          <CardContent sx={{ p: 4, textAlign: "center" }}>
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
              Account Created!
            </Typography>
            <Typography color="textSecondary" mb={3}>
              Your password has been set successfully. You will be redirected to the login page shortly.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => router.push("/auth/login")}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 480, width: "100%" }}>
        <CardContent sx={{ p: 4 }}>
          <Stack alignItems="center" mb={4}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 2,
                bgcolor: "primary.light",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
              }}
            >
              <IconLock size={32} color="#5D87FF" />
            </Box>
            <Typography variant="h4" fontWeight={600}>
              Set Your Password
            </Typography>
            <Typography color="textSecondary" textAlign="center">
              Welcome to DanceOne Onboarding Hub
            </Typography>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {userEmail && (
            <Alert severity="info" sx={{ mb: 3 }}>
              Setting up account for: <strong>{userEmail}</strong>
              {userName && <> ({userName})</>}
            </Alert>
          )}

          {!error && userEmail && (
            <form onSubmit={formik.handleSubmit}>
              <Stack spacing={3}>
                <Box>
                  <CustomFormLabel htmlFor="password">
                    Password *
                  </CustomFormLabel>
                  <CustomTextField
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    fullWidth
                    placeholder="Enter your password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.password && Boolean(formik.errors.password)
                    }
                    helperText={formik.touched.password && formik.errors.password}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? (
                              <IconEyeOff size={18} />
                            ) : (
                              <IconEye size={18} />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <Box>
                  <CustomFormLabel htmlFor="confirmPassword">
                    Confirm Password *
                  </CustomFormLabel>
                  <CustomTextField
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    fullWidth
                    placeholder="Confirm your password"
                    value={formik.values.confirmPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.confirmPassword &&
                      Boolean(formik.errors.confirmPassword)
                    }
                    helperText={
                      formik.touched.confirmPassword &&
                      formik.errors.confirmPassword
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            edge="end"
                          >
                            {showConfirmPassword ? (
                              <IconEyeOff size={18} />
                            ) : (
                              <IconEye size={18} />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <Typography variant="caption" color="textSecondary">
                  Password must be at least 8 characters and contain uppercase,
                  lowercase, and numbers.
                </Typography>

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  disabled={loading || !formik.isValid}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </Stack>
            </form>
          )}

          {error && !userEmail && (
            <Button
              variant="outlined"
              fullWidth
              onClick={() => router.push("/auth/login")}
            >
              Go to Login
            </Button>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress />
        </Box>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}

