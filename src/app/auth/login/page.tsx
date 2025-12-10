"use client";
import {
  Box,
  Typography,
  Button,
  Stack,
  Card,
  CardContent,
  Alert,
} from "@mui/material";
import { useState } from "react";
import { useRouter } from "next/navigation";
import CustomTextField from "@/app/components/forms/theme-elements/CustomTextField";
import CustomFormLabel from "@/app/components/forms/theme-elements/CustomFormLabel";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      // Fetch user role from database (this also sets the role cache cookies)
      const response = await fetch("/api/auth/user-role");
      const data = await response.json();

      // Use window.location to ensure a full page load that picks up the new cookies
      // This is important because the middleware needs the cookies to redirect correctly
      if (data.role === "admin") {
        window.location.href = "/admin/dashboard";
      } else if (data.role === "hr") {
        window.location.href = "/hr/dashboard";
      } else {
        window.location.href = "/nd/dashboard";
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

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
      <Card
        sx={{
          maxWidth: 450,
          width: "100%",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box textAlign="center" mb={4}>
            <Typography
              variant="h3"
              fontWeight={700}
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              DanceOne
            </Typography>
            <Typography variant="h6" color="textSecondary" mt={1}>
              Onboarding Hub
            </Typography>
          </Box>

          <Typography variant="h5" fontWeight={600} mb={1}>
            Welcome Back
          </Typography>
          <Typography variant="body2" color="textSecondary" mb={3}>
            Sign in to continue to your dashboard
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleLogin}>
            <Stack spacing={0}>
              <Box>
                <CustomFormLabel htmlFor="email">Email Address</CustomFormLabel>
                <CustomTextField
                  id="email"
                  type="email"
                  variant="outlined"
                  fullWidth
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEmail(e.target.value)
                  }
                  required
                  placeholder="Enter your email"
                />
              </Box>
              <Box>
                <CustomFormLabel htmlFor="password">Password</CustomFormLabel>
                <CustomTextField
                  id="password"
                  type="password"
                  variant="outlined"
                  fullWidth
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPassword(e.target.value)
                  }
                  required
                  placeholder="Enter your password"
                />
              </Box>
            </Stack>

            <Box mt={4}>
              <Button
                color="primary"
                variant="contained"
                size="large"
                fullWidth
                type="submit"
                disabled={loading}
                sx={{
                  py: 1.5,
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)",
                  },
                }}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </Box>
          </form>

          <Box mt={3} textAlign="center">
            <Typography variant="body2" color="textSecondary">
              For ND and HR staff only. Candidates will receive a direct link
              via email.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
