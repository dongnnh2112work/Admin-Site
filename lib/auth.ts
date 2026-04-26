import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { ROUTES } from "@/constants/routes"
import { DEV_MOCK_USER, isAuthBypass } from "@/lib/dev-bypass"
import { createClient } from "@/lib/supabase/server"
import type { AppUser, BrandUserRole } from "@/lib/types"

const DEV_COOKIE = "howl_dev_admin"

/**
 * Lấy user đăng nhập + role/brand từ bảng brand_users.
 * Trả null nếu chưa đăng nhập hoặc không có dòng brand_users.
 * Dev: NEXT_PUBLIC_DEV_AUTH_BYPASS=true và cookie howl_dev_admin=1 → user giả lập.
 */
export async function getCurrentUser(): Promise<AppUser | null> {
  if (isAuthBypass()) {
    const jar = await cookies()
    if (jar.get(DEV_COOKIE)?.value === "1") {
      return { ...DEV_MOCK_USER }
    }
    return null
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user?.email) {
    return null
  }

  const { data: row, error: rowError } = await supabase
    .from("brand_users")
    .select("role, brand_id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (rowError || !row) {
    return null
  }

  const role = row.role as BrandUserRole
  const brand_id = row.brand_id as string | null

  return {
    id: user.id,
    email: user.email,
    role,
    brand_id,
  }
}

/** Bắt buộc đã đăng nhập + có brand_users; không thì redirect /login */
export async function requireAuth(): Promise<AppUser> {
  const user = await getCurrentUser()
  if (!user) {
    redirect(ROUTES.login)
  }
  return user
}

export function isSuperAdmin(user: Pick<AppUser, "role">): boolean {
  return user.role === "super_admin"
}
