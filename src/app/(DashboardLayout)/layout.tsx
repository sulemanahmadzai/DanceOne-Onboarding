"use client";
import { Box, Container, useMediaQuery, Theme } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useEffect, useState } from "react";
import Sidebar from "./layout/vertical/sidebar/Sidebar";
import Header from "./layout/vertical/header/Header";
import { useSelector } from "@/store/hooks";
import { AppState } from "@/store/store";

interface UserData {
  name: string;
  role: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const customizer = useSelector((state: AppState) => state.customizer);
  const theme = useTheme();
  const lgUp = useMediaQuery((theme: Theme) => theme.breakpoints.up("lg"));

  const [userData, setUserData] = useState<UserData>({ name: "User", role: "nd" });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/auth/user-role");
        if (response.ok) {
          const data = await response.json();
          setUserData({
            name: data.user?.name || data.user?.email?.split("@")[0] || "User",
            role: data.role || "nd",
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  const sidebarWidth = customizer.SidebarWidth || 270;

  return (
    <Box
      className={
        customizer.activeMode === "dark" ? "darkbg mainwrapper" : "mainwrapper"
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
  );
}

