import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function normalizeAlias(value: string): string {
  return value.trim().toLowerCase()
}

function nameToAlias(name: string | null): string {
  return (name ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ alias: string }> }
) {
  const { alias } = await params
  const normalizedAlias = normalizeAlias(alias)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from("brands")
    .select(
      "id, name, slug, is_active, logo_url, primary_color, secondary_color, font_family, event_name"
    )
    .eq("is_active", true)
    .or(
      `slug.eq.${normalizedAlias},name.ilike.${normalizedAlias.replace(/-/g, " ")}`
    )
    .limit(20)

  if (error || !data?.length) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 })
  }

  const brand = data.find((row) => {
    if (row.slug === normalizedAlias) return true
    return nameToAlias(row.name) === normalizedAlias
  })

  if (!brand) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 })
  }

  return NextResponse.json(
    {
      brand: {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        logoUrl: brand.logo_url,
        primaryColor: brand.primary_color ?? "#E63946",
        fontFamily: brand.font_family ?? "Inter",
        eventName: brand.event_name ?? null,
      },
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Cache-Control": "no-store",
      },
    }
  )
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
