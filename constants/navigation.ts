import type { LucideIcon } from "lucide-react"
import {
  Building2,
  LayoutDashboard,
  ScrollText,
  Settings,
  Users,
} from "lucide-react"

import { ROUTES } from "@/constants/routes"
import type { BrandUserRole } from "@/lib/types"

export type NavItem = {
  href: string
  label: string
  /** Mô tả ngắn — hiện khi bấm vào mục trên sidebar */
  description: string
  icon: LucideIcon
  /** Role được hiển thị mục này */
  roles: BrandUserRole[]
}

export const SIDEBAR_NAV: NavItem[] = [
  {
    href: ROUTES.dashboard,
    label: "Tổng quan",
    description:
      "Bảng điều khiển: số liệu nhanh, thương hiệu và hoạt động gần đây.",
    icon: LayoutDashboard,
    roles: ["super_admin", "brand_admin", "brand_editor"],
  },
  {
    href: ROUTES.brands,
    label: "Thương hiệu",
    description:
      "Danh sách và chi tiết từng thương hiệu — giao diện sự kiện, màu sắc, thông báo.",
    icon: Building2,
    roles: ["super_admin", "brand_admin", "brand_editor"],
  },
  {
    href: ROUTES.users,
    label: "Người dùng",
    description:
      "Quản lý tài khoản admin: gán vai trò và quyền theo từng thương hiệu.",
    icon: Users,
    roles: ["super_admin"],
  },
  {
    href: ROUTES.auditLog,
    label: "Nhật ký hoạt động",
    description:
      "Lịch sử thao tác trên dữ liệu hệ thống — ai thay đổi gì và khi nào.",
    icon: ScrollText,
    roles: ["super_admin"],
  },
  {
    href: ROUTES.settings,
    label: "Cài đặt",
    description: "Cấu hình chung của hệ thống admin (theo quyền super admin).",
    icon: Settings,
    roles: ["super_admin"],
  },
]

export function filterNavByRole(
  items: NavItem[],
  role: BrandUserRole
): NavItem[] {
  return items.filter((item) => item.roles.includes(role))
}
