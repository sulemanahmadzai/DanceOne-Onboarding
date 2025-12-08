import { uniqueId } from "lodash";
import {
  IconLayoutDashboard,
  IconUserPlus,
  IconFileExport,
  IconUsers,
  IconShieldCheck,
  IconUserCog,
  IconMail,
} from "@tabler/icons-react";

interface MenuitemsType {
  id?: string;
  navlabel?: boolean;
  subheader?: string;
  title?: string;
  icon?: any;
  href?: string;
  children?: MenuitemsType[];
  chip?: string;
  chipColor?: string;
  variant?: string;
  external?: boolean;
  disabled?: boolean;
  roles?: string[]; // Which roles can see this item
}

const Menuitems: MenuitemsType[] = [
  // Admin Section (only for admin users)
  {
    navlabel: true,
    subheader: "Administration",
    roles: ["admin"],
  },
  {
    id: uniqueId(),
    title: "Admin Dashboard",
    icon: IconShieldCheck,
    href: "/admin/dashboard",
    roles: ["admin"],
  },
  {
    id: uniqueId(),
    title: "User Management",
    icon: IconUserCog,
    href: "/admin/users",
    roles: ["admin"],
  },
  {
    id: uniqueId(),
    title: "Invite User",
    icon: IconMail,
    href: "/admin/invite",
    chip: "New",
    chipColor: "secondary",
    roles: ["admin"],
  },
  {
    id: uniqueId(),
    title: "Export Records",
    icon: IconFileExport,
    href: "/hr/export",
    roles: ["admin"],
  },
  // ND Section (only for ND users)
  {
    navlabel: true,
    subheader: "National Director",
    roles: ["nd"],
  },
  {
    id: uniqueId(),
    title: "ND Dashboard",
    icon: IconLayoutDashboard,
    href: "/nd/dashboard",
    roles: ["nd"],
  },
  {
    id: uniqueId(),
    title: "New Hire Request",
    icon: IconUserPlus,
    href: "/nd/new-request",
    chip: "New",
    chipColor: "primary",
    roles: ["nd"],
  },
  // HR Section (only for HR users)
  {
    navlabel: true,
    subheader: "Human Resources",
    roles: ["hr"],
  },
  {
    id: uniqueId(),
    title: "HR Dashboard",
    icon: IconUsers,
    href: "/hr/dashboard",
    roles: ["hr"],
  },
  {
    id: uniqueId(),
    title: "Export Records",
    icon: IconFileExport,
    href: "/hr/export",
    roles: ["hr"],
  },
];

export default Menuitems;

