import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: brand, error } = await supabase
    .from("brands")
    .select(
      "id, name, slug, logo_url, primary_color, secondary_color, font_family, event_name"
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .single()

  if (error || !brand) {
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
