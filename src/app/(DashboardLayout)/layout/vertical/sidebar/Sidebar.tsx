"use client";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Chip,
  useMediaQuery,
  Theme,
  Divider,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSelector } from "@/store/hooks";
import { AppState } from "@/store/store";
import Menuitems from "./MenuItems";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";

interface SidebarProps {
  userRole?: string;
}

const Sidebar = ({ userRole = "nd" }: SidebarProps) => {
  const pathname = usePathname();
  const customizer = useSelector((state: AppState) => state.customizer);
  const theme = useTheme();
  const lgUp = useMediaQuery((theme: Theme) => theme.breakpoints.up("lg"));

  const sidebarWidth = customizer.SidebarWidth || 270;

  // Filter menu items based on user role
  const filteredMenuItems = Menuitems.filter((item) => {
    if (!item.roles) return true;
    // Show item only if user's role is in the item's allowed roles
    return item.roles.includes(userRole);
  });

  const sidebarContent = (
    <Box sx={{ height: "100%" }}>
      {/* Logo */}
      <Box sx={{ p: 3 }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <Typography
            variant="h4"
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
          <Typography variant="caption" color="textSecondary">
            Onboarding Hub
          </Typography>
        </Link>
      </Box>

      <Divider />

      {/* Menu Items */}
      <SimpleBar style={{ maxHeight: "calc(100vh - 100px)" }}>
        <List sx={{ px: 2, pt: 2 }}>
          {filteredMenuItems.map((item) => {
            if (item.navlabel) {
              return (
                <Typography
                  key={item.subheader}
                  variant="caption"
                  fontWeight={600}
                  sx={{
                    pl: 2,
                    pt: 2,
                    pb: 1,
                    display: "block",
                    color: "text.secondary",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {item.subheader}
                </Typography>
              );
            }

            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  component={Link}
                  href={item.href || "#"}
                  sx={{
                    borderRadius: 2,
                    py: 1.2,
                    backgroundColor: isActive
                      ? "primary.light"
                      : "transparent",
                    color: isActive ? "primary.main" : "text.primary",
                    "&:hover": {
                      backgroundColor: isActive
                        ? "primary.light"
                        : "action.hover",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: isActive ? "primary.main" : "text.secondary",
                    }}
                  >
                    {Icon && <Icon size={20} />}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.title}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 600 : 400,
                    }}
                  />
                  {item.chip && (
                    <Chip
                      label={item.chip}
                      size="small"
                      color={item.chipColor as any}
                      sx={{ height: 22 }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </SimpleBar>
    </Box>
  );

  if (lgUp) {
    return (
      <Drawer
        variant="permanent"
        anchor="left"
        open
        PaperProps={{
          sx: {
            width: sidebarWidth,
            boxSizing: "border-box",
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        {sidebarContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="temporary"
      anchor="left"
      open={customizer.isMobileSidebar}
      PaperProps={{
        sx: {
          width: sidebarWidth,
          boxSizing: "border-box",
        },
      }}
      ModalProps={{
        keepMounted: true,
      }}
    >
      {sidebarContent}
    </Drawer>
  );
};

export default Sidebar;

