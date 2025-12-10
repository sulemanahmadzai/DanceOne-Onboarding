"use client";

import { Box, Container, useMediaQuery, Theme } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useEffect } from "react";
import Sidebar from "./layout/vertical/sidebar/Sidebar";
import Header from "./layout/vertical/header/Header";
import { useSelector } from "@/store/hooks";
import { AppState } from "@/store/store";
import { UserProvider, UserData } from "@/lib/auth/user-context";

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  userData: UserData;
  needsCacheRefresh?: boolean;
  supabaseUserId?: string;
}

export default function DashboardLayoutClient({
  children,
  userData,
  needsCacheRefresh,
  supabaseUserId,
}: DashboardLayoutClientProps) {
  const customizer = useSelector((state: AppState) => state.customizer);
  const theme = useTheme();
  const lgUp = useMediaQuery((theme: Theme) => theme.breakpoints.up("lg"));

  const sidebarWidth = customizer.SidebarWidth || 270;

  // Update cache via API call if needed (runs once on mount)
  useEffect(() => {
    if (needsCacheRefresh && supabaseUserId) {
      // Set cookies via a lightweight API call
      fetch("/api/auth/set-role-cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: userData.role,
          name: userData.name,
          userId: supabaseUserId,
        }),
      }).catch(() => {
        // Silently fail - cache will be refreshed next time
      });
    }
  }, [needsCacheRefresh, supabaseUserId, userData.role, userData.name]);

  return (
    <UserProvider userData={userData}>
      <Box
        className={
          customizer.activeMode === "dark"
            ? "darkbg mainwrapper"
            : "mainwrapper"
        }
        sx={{ display: "flex", minHeight: "100vh", width: "100%" }}
      >
        {/* Sidebar */}
        <Sidebar userRole={userData.role} />

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            ml: lgUp ? `${sidebarWidth}px` : 0,
            width: lgUp ? `calc(100% - ${sidebarWidth}px)` : "100%",
            minHeight: "100vh",
            backgroundColor:
              customizer.activeMode === "dark"
                ? theme.palette.background.default
                : theme.palette.grey[100],
          }}
        >
          {/* Header */}
          <Header userName={userData.name} userRole={userData.role} />

          {/* Page Content */}
          <Container
            maxWidth={customizer.isLayout === "boxed" ? "lg" : false}
            sx={{
              pt: 3,
              pb: 4,
              flexGrow: 1,
            }}
          >
            {children}
          </Container>
        </Box>
      </Box>
    </UserProvider>
  );
}
