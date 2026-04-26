import { notFound } from "next/navigation"

import { UserManagement } from "@/components/users/UserManagement"
import { isSuperAdmin, requireAuth } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import type { BrandOption, BrandUserRole } from "@/lib/types"

export const dynamic = "force-dynamic"

type RawMembershipRow = {
  id: string
  user_id: string
  brand_id: string
  role: BrandUserRole
  created_at: string
  brands: { name: string }[] | null
}

export default async function UsersPage() {
  const user = await requireAuth()
  if (!isSuperAdmin(user)) {
    notFound()
  }

  const supabase = await createClient()
  const [{ data: memberships, error: mErr }, { data: brands, error: bErr }] =
    await Promise.all([
      supabase
        .from("brand_users")
        .select("id,user_id,brand_id,role,created_at,brands(name)")
        .order("created_at", { ascending: false }),
      supabase.from("brands").select("id,name,slug").order("name", { ascending: true }),
    ])

  if (mErr) {
    return (
      <div className="rounded-lg border border-red-500/40 bg-red-950/30 p-4 text-sm text-red-200">
        Không tải được danh sách user: {mErr.message}
      </div>
    )
  }
  if (bErr) {
    return (
      <div className="rounded-lg border border-red-500/40 bg-red-950/30 p-4 text-sm text-red-200">
        Không tải được danh sách thương hiệu: {bErr.message}
      </div>
    )
  }

  const initialMemberships = ((memberships ?? []) as RawMembershipRow[]).map((m) => ({
    id: m.id,
    user_id: m.user_id,
    brand_id: m.brand_id,
    brand_name: m.brands?.[0]?.name ?? m.brand_id,
    role: m.role,
    created_at: m.created_at,
  }))

  return (
    <UserManagement
      initialMemberships={initialMemberships}
      brands={(brands ?? []) as BrandOption[]}
    />
  )
}
