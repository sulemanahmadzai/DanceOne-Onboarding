"use client";
import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Typography,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  ListItemIcon,
  useMediaQuery,
  Theme,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconMenu2, IconLogout, IconUser } from "@tabler/icons-react";
import { useDispatch, useSelector } from "@/store/hooks";
import { toggleMobileSidebar } from "@/store/customizer/CustomizerSlice";
import { AppState } from "@/store/store";

interface HeaderProps {
  userName?: string;
  userRole?: string;
}

const Header = ({ userName = "User", userRole = "nd" }: HeaderProps) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const customizer = useSelector((state: AppState) => state.customizer);
  const theme = useTheme();
  const lgUp = useMediaQuery((theme: Theme) => theme.breakpoints.up("lg"));

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    // Use the logout API to clear cookies and sign out
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
    router.refresh(); // Force refresh to clear any cached state
  };

  const sidebarWidth = customizer.SidebarWidth || 270;

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "hr":
        return "HR Manager";
      case "admin":
        return "Administrator";
      case "nd":
      default:
        return "National Director";
    }
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
        ml: lgUp ? `${sidebarWidth}px` : 0,
        width: lgUp ? `calc(100% - ${sidebarWidth}px)` : "100%",
      }}
    >
      <Toolbar sx={{ minHeight: 70 }}>
        {!lgUp && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={() => dispatch(toggleMobileSidebar())}
            sx={{ mr: 2, color: "text.primary" }}
          >
            <IconMenu2 size={24} />
          </IconButton>
        )}

        <Box sx={{ flexGrow: 1 }} />

        {/* User Menu */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ textAlign: "right", display: { xs: "none", sm: "block" } }}>
            <Typography variant="subtitle2" fontWeight={600}>
              {userName}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {getRoleLabel(userRole)}
            </Typography>
          </Box>

          <IconButton onClick={handleClick} size="small">
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: "primary.main",
                fontSize: "1rem",
              }}
            >
              {userName.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          onClick={handleClose}
          PaperProps={{
            elevation: 3,
            sx: {
              minWidth: 200,
              mt: 1,
            },
          }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              {userName}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {getRoleLabel(userRole)}
            </Typography>
          </Box>
          <Divider />
          <MenuItem disabled>
            <ListItemIcon>
              <IconUser size={18} />
            </ListItemIcon>
            Profile Settings
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <IconLogout size={18} />
            </ListItemIcon>
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;

