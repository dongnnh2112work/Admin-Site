import { notFound } from "next/navigation"

import { NotificationList } from "@/components/notifications/NotificationList"
import { isSuperAdmin, requireAuth } from "@/lib/auth"
import { devMockBrand, devMockNotifications, isAuthBypass } from "@/lib/dev-bypass"
import { createClient } from "@/lib/supabase/server"
import type { NotificationRow } from "@/lib/types"

export const dynamic = "force-dynamic"

export default async function BrandNotificationsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: brandId } = await params
  const user = await requireAuth()

  if (!isSuperAdmin(user) && user.brand_id !== brandId) {
    notFound()
  }

  if (isAuthBypass()) {
    const b = devMockBrand(brandId)
    return (
      <NotificationList
        brandId={b.id}
        brandName={b.name}
        initialNotifications={devMockNotifications(brandId)}
        currentUserId={user.id}
        allowGlobalScope={isSuperAdmin(user)}
        readOnly={user.role === "brand_editor"}
      />
    )
  }

  const supabase = await createClient()
  const { data: brand, error: bErr } = await supabase
    .from("brands")
    .select("id,name")
    .eq("id", brandId)
    .maybeSingle()

  if (bErr || !brand) {
    notFound()
  }

  let notifQuery = supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })

  if (isSuperAdmin(user)) {
    notifQuery = notifQuery.or(`brand_id.eq.${brandId},brand_id.is.null`)
  } else {
    notifQuery = notifQuery.eq("brand_id", brandId)
  }

  const { data: notifications, error: nErr } = await notifQuery
  if (nErr) {
    return (
      <div className="rounded-lg border border-red-500/40 bg-red-950/30 p-4 text-sm text-red-200">
        Không tải được danh sách thông báo: {nErr.message}
      </div>
    )
  }

  return (
    <NotificationList
      brandId={brand.id}
      brandName={brand.name}
      initialNotifications={(notifications ?? []) as NotificationRow[]}
      currentUserId={user.id}
      allowGlobalScope={isSuperAdmin(user)}
      readOnly={user.role === "brand_editor"}
    />
  )
}
