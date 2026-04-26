import { notFound } from "next/navigation"

import { AuditLogView, type AuditViewRow } from "@/components/audit/AuditLogView"
import { isSuperAdmin, requireAuth } from "@/lib/auth"
import { isAuthBypass } from "@/lib/dev-bypass"
import { createClient } from "@/lib/supabase/server"
import type { BrandOption } from "@/lib/types"

export const dynamic = "force-dynamic"

type RawAuditRow = {
  id: number
  created_at: string
  action: string
  table_name: string | null
  record_id: string | null
  brand_id: string | null
  user_id: string | null
  ip_address: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
}

export default async function AuditLogPage() {
  const user = await requireAuth()
  if (!isSuperAdmin(user)) {
    notFound()
  }

  if (isAuthBypass()) {
    return <AuditLogView rows={[]} brands={[]} />
  }

  const supabase = await createClient()
  const [{ data: rows, error: rErr }, { data: brands, error: bErr }] =
    await Promise.all([
      supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(300),
      supabase.from("brands").select("id,name,slug").order("name", { ascending: true }),
    ])

  if (rErr) {
    return (
      <div className="rounded-lg border border-red-500/40 bg-red-950/30 p-4 text-sm text-red-200">
        Không tải được audit log: {rErr.message}
      </div>
    )
  }
  if (bErr) {
    return (
      <div className="rounded-lg border border-red-500/40 bg-red-950/30 p-4 text-sm text-red-200">
        Không tải được thương hiệu: {bErr.message}
      </div>
    )
  }

  const brandNameById = new Map<string, string>()
  for (const b of (brands ?? []) as BrandOption[]) {
    brandNameById.set(b.id, b.name)
  }

  const auditRows: AuditViewRow[] = ((rows ?? []) as RawAuditRow[]).map((r) => ({
    id: String(r.id),
    created_at: r.created_at,
    action: r.action,
    table_name: r.table_name ?? null,
    record_id: r.record_id ?? null,
    brand_id: r.brand_id ?? null,
    brand_name: r.brand_id ? (brandNameById.get(r.brand_id) ?? r.brand_id) : "Global",
    user_id: r.user_id ?? null,
    ip_address: r.ip_address ?? null,
    old_data: r.old_data ?? null,
    new_data: r.new_data ?? null,
  }))

  return <AuditLogView rows={auditRows} brands={(brands ?? []) as BrandOption[]} />
}
