"use client";
import { Box, CircularProgress, Typography } from "@mui/material";

export default function Loading() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <CircularProgress size={48} sx={{ color: "white", mb: 2 }} />
      <Typography variant="h6" color="white">
        Loading...
      </Typography>
    </Box>
  );
}

