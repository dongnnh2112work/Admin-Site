import { createClient } from "@/lib/supabase/server"
import { isSuperAdmin } from "@/lib/auth"
import { isAuthBypass } from "@/lib/dev-bypass"
import type { AppUser } from "@/lib/types"

export type DashboardRecentBrand = {
  id: string
  name: string
  slug: string
  updated_at: string
  is_active: boolean
  primary_color: string
}

export type DashboardRecentAudit = {
  id: string
  created_at: string
  action: string
  table_name: string | null
  brand_id: string | null
}

export type DashboardData = {
  brandsCount: number
  productsCount: number
  activeNotificationsCount: number
  auditLogCount: number
  recentBrands: DashboardRecentBrand[]
  recentAuditLogs: DashboardRecentAudit[]
  nextEventBrand: {
    event_name: string | null
    event_date: string
  } | null
  storageUsedBytes: number | null
  showAuditSection: boolean
}

export async function getDashboardData(user: AppUser): Promise<DashboardData> {
  if (isAuthBypass()) {
    const superUser = isSuperAdmin(user)
    const showAuditSection = superUser || user.role === "brand_admin"
    return {
      brandsCount: 0,
      productsCount: 0,
      activeNotificationsCount: 0,
      auditLogCount: 0,
      recentBrands: [],
      recentAuditLogs: [],
      nextEventBrand: null,
      storageUsedBytes: null,
      showAuditSection,
    }
  }

  const supabase = await createClient()
  const superUser = isSuperAdmin(user)
  const showAuditSection = superUser || user.role === "brand_admin"

  const todayIso = new Date().toISOString().slice(0, 10)

  let brandsCountQ = supabase.from("brands").select("*", { count: "exact", head: true })
  if (!superUser && user.brand_id) {
    brandsCountQ = brandsCountQ.eq("id", user.brand_id)
  }

  let productsCountQ = supabase.from("products").select("*", { count: "exact", head: true })
  if (!superUser && user.brand_id) {
    productsCountQ = productsCountQ.eq("brand_id", user.brand_id)
  }

  let notifsCountQ = supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)
  if (!superUser && user.brand_id) {
    notifsCountQ = notifsCountQ.or(
      `brand_id.eq.${user.brand_id},brand_id.is.null`
    )
  }

  let recentBrandsQ = supabase
    .from("brands")
    .select("id,name,slug,updated_at,is_active,primary_color")
    .order("updated_at", { ascending: false })
    .limit(5)
  if (!superUser && user.brand_id) {
    recentBrandsQ = recentBrandsQ.eq("id", user.brand_id)
  }

  let nextEventQ = supabase
    .from("brands")
    .select("event_name, event_date")
    .not("event_date", "is", null)
    .gte("event_date", todayIso)
    .order("event_date", { ascending: true })
    .limit(1)
  if (!superUser && user.brand_id) {
    nextEventQ = nextEventQ.eq("id", user.brand_id)
  }

  const basePromises = [
    brandsCountQ,
    productsCountQ,
    notifsCountQ,
    recentBrandsQ,
    nextEventQ,
  ] as const

  if (showAuditSection) {
    let auditCountQ = supabase.from("audit_log").select("*", { count: "exact", head: true })
    let recentAuditQ = supabase
      .from("audit_log")
      .select("id, created_at, action, table_name, brand_id")
      .order("created_at", { ascending: false })
      .limit(8)
    if (!superUser && user.brand_id) {
      auditCountQ = auditCountQ.eq("brand_id", user.brand_id)
      recentAuditQ = recentAuditQ.eq("brand_id", user.brand_id)
    }

    const [
      brandsCountRes,
      productsCountRes,
      notifsCountRes,
      recentBrandsRes,
      nextEventRes,
      auditCountRes,
      recentAuditRes,
    ] = await Promise.all([
      ...basePromises,
      auditCountQ,
      recentAuditQ,
    ])

    return buildDashboardResult({
      brandsCountRes,
      productsCountRes,
      notifsCountRes,
      recentBrandsRes,
      nextEventRes,
      auditCountRes,
      recentAuditRes,
      showAuditSection,
    })
  }

  const [brandsCountRes, productsCountRes, notifsCountRes, recentBrandsRes, nextEventRes] =
    await Promise.all(basePromises)

  return buildDashboardResult({
    brandsCountRes,
    productsCountRes,
    notifsCountRes,
    recentBrandsRes,
    nextEventRes,
    auditCountRes: { count: 0 },
    recentAuditRes: { data: [] },
    showAuditSection,
  })
}

function buildDashboardResult({
  brandsCountRes,
  productsCountRes,
  notifsCountRes,
  recentBrandsRes,
  nextEventRes,
  auditCountRes,
  recentAuditRes,
  showAuditSection,
}: {
  brandsCountRes: { count: number | null }
  productsCountRes: { count: number | null }
  notifsCountRes: { count: number | null }
  recentBrandsRes: {
    data: Record<string, unknown>[] | null
  }
  nextEventRes: {
    data: Record<string, unknown>[] | null
  }
  auditCountRes: { count: number | null }
  recentAuditRes: {
    data: Record<string, unknown>[] | null
  }
  showAuditSection: boolean
}): DashboardData {
  const recentBrands: DashboardRecentBrand[] = (recentBrandsRes.data ?? []).map(
    (r) => ({
      id: r.id as string,
      name: r.name as string,
      slug: r.slug as string,
      updated_at: r.updated_at as string,
      is_active: Boolean(r.is_active),
      primary_color: (r.primary_color as string) || "#000000",
    })
  )

  const recentAuditLogs: DashboardRecentAudit[] = (recentAuditRes.data ?? []).map(
    (r) => ({
      id: String(r.id),
      created_at: r.created_at as string,
      action: r.action as string,
      table_name: (r.table_name as string | null) ?? null,
      brand_id: (r.brand_id as string | null) ?? null,
    })
  )

  const nextRow = nextEventRes.data?.[0]
  const nextEventBrand =
    nextRow?.event_date != null
      ? {
          event_name: (nextRow.event_name as string | null) ?? null,
          event_date: String(nextRow.event_date),
        }
      : null

  return {
    brandsCount: brandsCountRes.count ?? 0,
    productsCount: productsCountRes.count ?? 0,
    activeNotificationsCount: notifsCountRes.count ?? 0,
    auditLogCount: showAuditSection ? auditCountRes.count ?? 0 : 0,
    recentBrands,
    recentAuditLogs: showAuditSection ? recentAuditLogs : [],
    nextEventBrand,
    storageUsedBytes: null,
    showAuditSection,
  }
}
