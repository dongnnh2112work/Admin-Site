import { NextResponse } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

import { getCurrentUser, isSuperAdmin } from "@/lib/auth"
import { STORAGE_BUCKET } from "@/lib/storage"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Bạn chưa đăng nhập." }, { status: 401 })
  }
  if (!isSuperAdmin(user) && user.brand_id !== id) {
    return NextResponse.json({ error: "Bạn không có quyền thao tác." }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Thiếu tệp logo." }, { status: 400 })
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: brand, error: brandError } = await admin
    .from("brands")
    .select("id, slug")
    .eq("id", id)
    .maybeSingle()
  if (brandError || !brand) {
    return NextResponse.json({ error: "Không tìm thấy thương hiệu." }, { status: 404 })
  }

  const safeName = file.name.replace(/\s+/g, "-")
  const path = `brands/${brand.slug}/logo/${Date.now()}-${safeName}`
  const { error: uploadError } = await admin.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { upsert: true })
  if (uploadError) {
    return NextResponse.json(
      { error: `Tải logo thất bại: ${uploadError.message}` },
      { status: 400 }
    )
  }

  const { data } = admin.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  const logo_url = data.publicUrl
  const { error: updateError } = await admin
    .from("brands")
    .update({ logo_url })
    .eq("id", id)
  if (updateError) {
    return NextResponse.json(
      { error: `Lưu logo thất bại: ${updateError.message}` },
      { status: 400 }
    )
  }

  return NextResponse.json({ logo_url })
}
