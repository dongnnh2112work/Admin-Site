import { createClient } from "@/lib/supabase/server"
import { STORAGE_BUCKET } from "@/lib/storage"

export type ConnectionCheckResult = {
  ok: boolean
  dbOk: boolean
  storageOk: boolean
  checkedAt: string
  message: string
}

export type SettingsOverview = {
  supabaseHost: string
  storageBucket: string
  envName: string
  devBypass: boolean
  brandsCount: number
  productsCount: number
  notificationsCount: number
  estimatedStorageBytes: number | null
}

async function listBucketPrefixSizeBytes(prefix: string): Promise<number> {
  const supabase = await createClient()

  async function listSum(path: string): Promise<number> {
    let page = 0
    let sum = 0
    while (true) {
      const { data, error } = await supabase.storage.from(STORAGE_BUCKET).list(path, {
        limit: 100,
        offset: page * 100,
        sortBy: { column: "name", order: "asc" },
      })
      if (error || !data || data.length === 0) break
      for (const item of data) {
        const anyItem = item as unknown as {
          name?: string
          id?: string
          metadata?: { size?: number } | null
        }
        const name = String(anyItem.name ?? "")
        if (!name || name === ".emptyFolderPlaceholder") continue
        const id = String(anyItem.id ?? "")
        const metadata = anyItem.metadata ?? null
        const size = typeof metadata?.size === "number" ? metadata.size : 0
        if (id && size >= 0) {
          sum += size
        } else {
          sum += await listSum(`${path}/${name}`)
        }
      }
      if (data.length < 100) break
      page += 1
    }
    return sum
  }

  return listSum(prefix)
}

export async function checkSupabaseConnection(): Promise<ConnectionCheckResult> {
  const supabase = await createClient()
  let dbOk = false
  let storageOk = false
  let message = "Kết nối OK"

  const { error: dbErr } = await supabase
    .from("brands")
    .select("id", { head: true, count: "exact" })
  dbOk = !dbErr

  const { error: storageErr } = await supabase.storage
    .from(STORAGE_BUCKET)
    .list("", { limit: 1 })
  storageOk = !storageErr

  if (dbErr) message = `Lỗi DB: ${dbErr.message}`
  else if (storageErr) message = `Lỗi Storage: ${storageErr.message}`

  return {
    ok: dbOk && storageOk,
    dbOk,
    storageOk,
    checkedAt: new Date().toISOString(),
    message,
  }
}

export async function getSettingsOverview(): Promise<SettingsOverview> {
  const supabase = await createClient()
  const [brandsRes, productsRes, notificationsRes] = await Promise.all([
    supabase.from("brands").select("id", { head: true, count: "exact" }),
    supabase.from("products").select("id", { head: true, count: "exact" }),
    supabase
      .from("notifications")
      .select("id", { head: true, count: "exact" })
      .eq("is_active", true),
  ])

  let estimatedStorageBytes: number | null = null
  try {
    estimatedStorageBytes = await listBucketPrefixSizeBytes("brands")
  } catch {
    estimatedStorageBytes = null
  }

  const host = (() => {
    const raw = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
    try {
      return new URL(raw).host
    } catch {
      return raw
    }
  })()

  return {
    supabaseHost: host || "N/A",
    storageBucket: STORAGE_BUCKET,
    envName: process.env.NODE_ENV ?? "unknown",
    devBypass: process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true",
    brandsCount: brandsRes.count ?? 0,
    productsCount: productsRes.count ?? 0,
    notificationsCount: notificationsRes.count ?? 0,
    estimatedStorageBytes,
  }
}
