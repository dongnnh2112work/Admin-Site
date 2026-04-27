"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { ROUTES } from "@/constants/routes"
import { createClient } from "@/lib/supabase/client"
import type {
  AppUser,
  BrandRow,
  FooterConfig,
  HeaderConfig,
  NotifBrandConfig,
} from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/shared/PageHeader"

type HeaderLinkRow = { label: string; href: string }

function defaultHeaderLinks(cfg: HeaderConfig | null): HeaderLinkRow[] {
  const links = cfg?.links ?? []
  const rows = links.map((l) => ({
    label: l.label,
    href: (l.url ?? l.href ?? "").trim(),
  }))
  while (rows.length < 3) rows.push({ label: "", href: "" })
  return rows.slice(0, 5)
}

function footerFromBrand(cfg: FooterConfig | null): {
  copyright: string
  show_social: boolean
  footerBg: string
  footerText: string
  colHeading: string
  links: HeaderLinkRow[]
} {
  if (!cfg) {
    return {
      copyright: "",
      show_social: false,
      footerBg: "",
      footerText: "",
      colHeading: "",
      links: [
        { label: "", href: "" },
        { label: "", href: "" },
      ],
    }
  }
  let links: HeaderLinkRow[] = []
  if (cfg.links?.length) {
    links = cfg.links.map((l) => ({
      label: l.label,
      href: (l.url ?? l.href ?? "").trim(),
    }))
  } else {
    const col = cfg.columns?.[0]
    links =
      col?.links?.map((l) => ({
        label: l.label,
        href: (l.url ?? l.href ?? "").trim(),
      })) ?? []
  }
  while (links.length < 2) links.push({ label: "", href: "" })
  const social = cfg.social_links
  const inferredSocial =
    Array.isArray(social) && social.length > 0 ? true : false
  return {
    copyright: cfg.copyright ?? "",
    show_social: cfg.show_social ?? inferredSocial,
    footerBg: cfg.bg_color ?? "",
    footerText: cfg.text_color ?? "",
    colHeading: cfg.links_heading ?? cfg.columns?.[0]?.heading ?? "",
    links: links.slice(0, 4),
  }
}

export function BrandDetailView(props: { brand: BrandRow; user: AppUser }) {
  return (
    <BrandDetailForm
      key={`${props.brand.id}-${props.brand.updated_at}`}
      brand={props.brand}
      user={props.user}
    />
  )
}

function BrandDetailForm({
  brand,
  user,
}: {
  brand: BrandRow
  user: AppUser
}) {
  const router = useRouter()
  const readOnly = user.role === "brand_editor"
  const [banner, setBanner] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState<string | null>(null)

  const footerInit = footerFromBrand(brand.footer_config)

  // —— Tab 1 ——
  const [name, setName] = React.useState(brand.name)
  const [slug, setSlug] = React.useState(brand.slug)
  const [isActive, setIsActive] = React.useState(brand.is_active)
  const [eventName, setEventName] = React.useState(brand.event_name ?? "")
  const [eventDate, setEventDate] = React.useState(
    brand.event_date ? String(brand.event_date).slice(0, 10) : ""
  )
  const [eventLocation, setEventLocation] = React.useState(
    brand.event_location ?? ""
  )
  const [primaryColor, setPrimaryColor] = React.useState(
    brand.primary_color || "#000000"
  )
  const [secondaryColor, setSecondaryColor] = React.useState(
    brand.secondary_color ?? ""
  )
  const [accentColor, setAccentColor] = React.useState(
    brand.accent_color ?? ""
  )
  const [fontFamily, setFontFamily] = React.useState(brand.font_family ?? "")
  const [eventNotes, setEventNotes] = React.useState(
    typeof brand.event_config?.notes === "string"
      ? brand.event_config.notes
      : ""
  )

  // —— Tab 2 ——
  const logoInputRef = React.useRef<HTMLInputElement | null>(null)
  const [logoUrl, setLogoUrl] = React.useState(brand.logo_url ?? "")
  const [lookPrimaryColor, setLookPrimaryColor] = React.useState(
    brand.primary_color || "#000000"
  )
  const [lookSecondaryColor, setLookSecondaryColor] = React.useState(
    brand.secondary_color ?? ""
  )
  const [uploadingLogo, setUploadingLogo] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState(0)

  // —— Tab 3 ——
  const [headerTitle, setHeaderTitle] = React.useState(
    brand.header_config?.title ?? ""
  )
  const [headerBg, setHeaderBg] = React.useState(
    brand.header_config?.bg_color ?? ""
  )
  const [headerText, setHeaderText] = React.useState(
    brand.header_config?.text_color ?? ""
  )
  const [headerShowLogo, setHeaderShowLogo] = React.useState(
    brand.header_config?.show_logo ?? true
  )
  const [headerLinks, setHeaderLinks] = React.useState<HeaderLinkRow[]>(() =>
    defaultHeaderLinks(brand.header_config)
  )

  const [footerCopyright, setFooterCopyright] = React.useState(
    footerInit.copyright
  )
  const [footerShowSocial, setFooterShowSocial] = React.useState(
    footerInit.show_social
  )
  const [footerBg, setFooterBg] = React.useState(footerInit.footerBg)
  const [footerText, setFooterText] = React.useState(footerInit.footerText)
  const [footerColHeading, setFooterColHeading] = React.useState(
    footerInit.colHeading
  )
  const [footerLinks, setFooterLinks] = React.useState<HeaderLinkRow[]>(
    footerInit.links
  )

  // —— Tab 4 ——
  const [toastEnabled, setToastEnabled] = React.useState(
    brand.notif_config?.toast_enabled ?? true
  )
  const [notifPosition, setNotifPosition] = React.useState<
    NotifBrandConfig["position"]
  >(brand.notif_config?.position ?? "top-right")
  const [notifAccent, setNotifAccent] = React.useState(
    brand.notif_config?.accent_color ?? "#0070f3"
  )
  const [notifDuration, setNotifDuration] = React.useState(
    String(brand.notif_config?.duration_ms ?? 4000)
  )

  async function saveTab1() {
    if (readOnly) return
    setSaving("tab1")
    setBanner(null)
    try {
      const supabase = createClient()
      const event_config =
        eventNotes.trim() === ""
          ? null
          : { notes: eventNotes.trim() }
      const { error } = await supabase
        .from("brands")
        .update({
          name,
          slug,
          is_active: isActive,
          event_name: eventName || null,
          event_date: eventDate || null,
          event_location: eventLocation || null,
          primary_color: primaryColor.trim() || "#000000",
          secondary_color: secondaryColor || null,
          accent_color: accentColor || null,
          font_family: fontFamily || null,
          event_config,
        })
        .eq("id", brand.id)
      if (error) {
        setBanner(error.message)
        return
      }
      router.refresh()
    } finally {
      setSaving(null)
    }
  }

  function isHexColor(value: string): boolean {
    return /^#[0-9a-fA-F]{6}$/.test(value.trim())
  }

  async function updatePrimaryColor(value: string) {
    if (readOnly) return
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("brands")
        .update({ primary_color: value })
        .eq("id", brand.id)
      if (error) {
        toast.error("Không thể lưu màu chính")
        return
      }
      setPrimaryColor(value)
      toast.success("Đã lưu màu")
    } catch {
      toast.error("Không thể lưu màu chính")
    }
  }

  async function updateSecondaryColor(value: string | null) {
    if (readOnly) return
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("brands")
        .update({ secondary_color: value })
        .eq("id", brand.id)
      if (error) {
        toast.error("Không thể lưu màu phụ")
        return
      }
      setSecondaryColor(value ?? "")
      toast.success("Đã lưu màu")
    } catch {
      toast.error("Không thể lưu màu phụ")
    }
  }

  async function uploadLogo(file: File) {
    if (readOnly) return
    setBanner(null)
    setUploadingLogo(true)
    setUploadProgress(8)
    const timer = window.setInterval(() => {
      setUploadProgress((prev) => (prev >= 90 ? prev : prev + 8))
    }, 180)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch(`/api/brands/${brand.id}/logo`, {
        method: "POST",
        body: formData,
      })

      const body = (await res.json().catch(() => null)) as
        | { logo_url?: string; error?: string }
        | null

      if (!res.ok || !body?.logo_url) {
        toast.error(body?.error ?? "Không thể tải logo lên")
        return
      }

      setLogoUrl(body.logo_url)
      setUploadProgress(100)
      toast.success("Đã lưu logo")
      router.refresh()
    } catch {
      toast.error("Tải logo thất bại")
    } finally {
      window.clearInterval(timer)
      setUploadingLogo(false)
      window.setTimeout(() => setUploadProgress(0), 500)
    }
  }

  async function saveTab3() {
    if (readOnly) return
    setSaving("tab3")
    setBanner(null)
    try {
      const header_config: HeaderConfig = {
        title: headerTitle || undefined,
        bg_color: headerBg || undefined,
        text_color: headerText || undefined,
        show_logo: headerShowLogo,
        links: headerLinks
          .filter((l) => l.label.trim() && l.href.trim())
          .map((l) => ({
            label: l.label.trim(),
            url: l.href.trim(),
          })),
      }
      const footerLinkObjs = footerLinks
        .filter((l) => l.label.trim() && l.href.trim())
        .map((l) => ({ label: l.label.trim(), url: l.href.trim() }))
      const footer_config: FooterConfig = {
        copyright: footerCopyright.trim() || undefined,
        show_social: footerShowSocial,
        bg_color: footerBg.trim() || undefined,
        text_color: footerText.trim() || undefined,
        links_heading: footerColHeading.trim() || undefined,
        links: footerLinkObjs.length ? footerLinkObjs : undefined,
      }
      const supabase = createClient()
      const { error } = await supabase
        .from("brands")
        .update({
          header_config,
          footer_config,
        })
        .eq("id", brand.id)
      if (error) {
        setBanner(error.message)
        return
      }
      router.refresh()
    } finally {
      setSaving(null)
    }
  }

  async function saveTab4() {
    if (readOnly) return
    setSaving("tab4")
    setBanner(null)
    try {
      const durationParsed = Number.parseInt(notifDuration.trim(), 10)
      const notif_config: NotifBrandConfig = {
        toast_enabled: toastEnabled,
        position: notifPosition ?? "top-right",
        accent_color: notifAccent.trim() || "#0070f3",
        duration_ms:
          Number.isFinite(durationParsed) && durationParsed >= 0
            ? durationParsed
            : 4000,
      }
      const supabase = createClient()
      const { error } = await supabase
        .from("brands")
        .update({ notif_config })
        .eq("id", brand.id)
      if (error) {
        setBanner(error.message)
        return
      }
      router.refresh()
    } finally {
      setSaving(null)
    }
  }

  const disabled = readOnly

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={brand.name}
        subtitle="Chỉnh sửa cấu hình thương hiệu theo từng nhóm."
        breadcrumbs={[
          { label: "Tổng quan", href: ROUTES.dashboard },
          { label: "Thương hiệu", href: ROUTES.brands },
          { label: brand.name },
        ]}
        actions={
          <Link
            href={ROUTES.brandProducts(brand.id)}
            className={cn(buttonVariants({ variant: "outline" }), "border-zinc-700")}
          >
            Sản phẩm
          </Link>
        }
      />

      {readOnly ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">
          Bạn chỉ có quyền xem cấu hình thương hiệu. Liên hệ quản lý để thay đổi.
        </p>
      ) : null}

      {banner ? (
        <div
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200"
        >
          {banner}
        </div>
      ) : null}

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-zinc-900 p-1 md:w-auto">
          <TabsTrigger value="basic" className="data-[state=active]:bg-zinc-800">
            Thông tin cơ bản
          </TabsTrigger>
          <TabsTrigger value="look" className="data-[state=active]:bg-zinc-800">
            Giao diện
          </TabsTrigger>
          <TabsTrigger value="chrome" className="data-[state=active]:bg-zinc-800">
            Header &amp; Footer
          </TabsTrigger>
          <TabsTrigger value="notif" className="data-[state=active]:bg-zinc-800">
            Thông báo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Tên thương hiệu</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={disabled}
                className="border-zinc-700 bg-zinc-950"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                disabled={disabled}
                className="border-zinc-700 bg-zinc-950 font-mono text-sm"
              />
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <Switch
                id="active"
                checked={isActive}
                onCheckedChange={setIsActive}
                disabled={disabled}
              />
              <Label htmlFor="active">Đang hoạt động</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventName">Tên sự kiện</Label>
              <Input
                id="eventName"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                disabled={disabled}
                className="border-zinc-700 bg-zinc-950"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventDate">Ngày sự kiện</Label>
              <Input
                id="eventDate"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                disabled={disabled}
                className="border-zinc-700 bg-zinc-950"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="eventLocation">Địa điểm</Label>
              <Input
                id="eventLocation"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                disabled={disabled}
                className="border-zinc-700 bg-zinc-950"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pc">Màu chính</Label>
              <Input
                id="pc"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                disabled={disabled}
                placeholder="#0A0A0A"
                className="border-zinc-700 bg-zinc-950"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sc">Màu phụ</Label>
              <Input
                id="sc"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                disabled={disabled}
                className="border-zinc-700 bg-zinc-950"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ac">Màu nhấn</Label>
              <Input
                id="ac"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                disabled={disabled}
                className="border-zinc-700 bg-zinc-950"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="font">Font chữ</Label>
              <Input
                id="font"
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                disabled={disabled}
                placeholder="DM Sans"
                className="border-zinc-700 bg-zinc-950"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Ghi chú sự kiện (nội bộ)</Label>
              <Textarea
                id="notes"
                value={eventNotes}
                onChange={(e) => setEventNotes(e.target.value)}
                disabled={disabled}
                rows={3}
                className="border-zinc-700 bg-zinc-950"
              />
            </div>
          </div>
          {!disabled ? (
            <Button
              type="button"
              className="bg-[#E8FF47] text-zinc-950 hover:bg-[#E8FF47]/90"
              disabled={saving === "tab1"}
              onClick={() => void saveTab1()}
            >
              {saving === "tab1" ? "Đang lưu…" : "Lưu tab này"}
            </Button>
          ) : null}
        </TabsContent>

        <TabsContent value="look" className="mt-4 space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Label>Logo</Label>
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt="Logo thương hiệu"
                  className="size-20 rounded border border-zinc-700 object-contain"
                />
              ) : (
                <div className="flex size-20 items-center justify-center rounded border border-dashed border-zinc-700 text-xs text-zinc-400">
                  Chưa có logo
                </div>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={disabled || uploadingLogo}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void uploadLogo(file)
                  e.target.value = ""
                }}
              />
              <Button
                type="button"
                variant="outline"
                className="border-zinc-700"
                disabled={disabled || uploadingLogo}
                onClick={() => logoInputRef.current?.click()}
              >
                Thay logo
              </Button>
              {uploadingLogo ? (
                <div className="space-y-2">
                  <div className="h-2 w-full overflow-hidden rounded bg-zinc-800">
                    <div
                      className="h-full bg-[#E8FF47] transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-zinc-400">Đang tải logo lên...</p>
                </div>
              ) : null}
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lookPrimaryHex">Màu chính</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="lookPrimaryPicker"
                    type="color"
                    value={isHexColor(lookPrimaryColor) ? lookPrimaryColor : "#000000"}
                    disabled={disabled}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase()
                      setLookPrimaryColor(value)
                      void updatePrimaryColor(value)
                    }}
                    className="h-10 w-10 cursor-pointer border-zinc-700 bg-zinc-950 p-1"
                  />
                  <Input
                    id="lookPrimaryHex"
                    value={lookPrimaryColor}
                    disabled={disabled}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase()
                      setLookPrimaryColor(value)
                      if (isHexColor(value)) {
                        void updatePrimaryColor(value)
                      }
                    }}
                    placeholder="#E63946"
                    className="border-zinc-700 bg-zinc-950 font-mono"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lookSecondaryHex">Màu phụ</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="lookSecondaryPicker"
                    type="color"
                    value={
                      isHexColor(lookSecondaryColor)
                        ? lookSecondaryColor
                        : "#000000"
                    }
                    disabled={disabled}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase()
                      setLookSecondaryColor(value)
                      void updateSecondaryColor(value)
                    }}
                    className="h-10 w-10 cursor-pointer border-zinc-700 bg-zinc-950 p-1"
                  />
                  <Input
                    id="lookSecondaryHex"
                    value={lookSecondaryColor}
                    disabled={disabled}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase()
                      setLookSecondaryColor(value)
                      if (value === "") {
                        void updateSecondaryColor(null)
                        return
                      }
                      if (isHexColor(value)) {
                        void updateSecondaryColor(value)
                      }
                    }}
                    placeholder="#111111 (để trống nếu không dùng)"
                    className="border-zinc-700 bg-zinc-950 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="chrome" className="mt-4 space-y-8">
          <section className="space-y-4">
            <h3 className="text-sm font-medium text-zinc-300">Header</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="htitle">Tiêu đề</Label>
                <Input
                  id="htitle"
                  value={headerTitle}
                  onChange={(e) => setHeaderTitle(e.target.value)}
                  disabled={disabled}
                  className="border-zinc-700 bg-zinc-950"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hbg">Màu nền</Label>
                <Input
                  id="hbg"
                  value={headerBg}
                  onChange={(e) => setHeaderBg(e.target.value)}
                  disabled={disabled}
                  className="border-zinc-700 bg-zinc-950"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="htext">Màu chữ</Label>
                <Input
                  id="htext"
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  disabled={disabled}
                  className="border-zinc-700 bg-zinc-950"
                />
              </div>
              <div className="flex items-center gap-2 md:col-span-2">
                <Switch
                  id="hshow"
                  checked={headerShowLogo}
                  onCheckedChange={setHeaderShowLogo}
                  disabled={disabled}
                />
                <Label htmlFor="hshow">Hiển thị logo</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Liên kết menu (tối đa 5)</Label>
              <div className="space-y-2">
                {headerLinks.map((row, i) => (
                  <div key={i} className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      placeholder="Nhãn"
                      value={row.label}
                      disabled={disabled}
                      onChange={(e) => {
                        const next = [...headerLinks]
                        next[i] = { ...next[i]!, label: e.target.value }
                        setHeaderLinks(next)
                      }}
                      className="border-zinc-700 bg-zinc-950"
                    />
                    <Input
                      placeholder="https://…"
                      value={row.href}
                      disabled={disabled}
                      onChange={(e) => {
                        const next = [...headerLinks]
                        next[i] = { ...next[i]!, href: e.target.value }
                        setHeaderLinks(next)
                      }}
                      className="border-zinc-700 bg-zinc-950"
                    />
                  </div>
                ))}
              </div>
              {!disabled && headerLinks.length < 5 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-zinc-700"
                  onClick={() =>
                    setHeaderLinks([...headerLinks, { label: "", href: "" }])
                  }
                >
                  Thêm dòng liên kết
                </Button>
              ) : null}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-medium text-zinc-300">Footer</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fbg">Màu nền footer</Label>
                <Input
                  id="fbg"
                  value={footerBg}
                  onChange={(e) => setFooterBg(e.target.value)}
                  disabled={disabled}
                  placeholder="#0A0A0A"
                  className="border-zinc-700 bg-zinc-950"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ftext">Màu chữ footer</Label>
                <Input
                  id="ftext"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  disabled={disabled}
                  placeholder="#FAFAFA"
                  className="border-zinc-700 bg-zinc-950"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fcopy">Dòng bản quyền</Label>
              <Input
                id="fcopy"
                value={footerCopyright}
                onChange={(e) => setFooterCopyright(e.target.value)}
                disabled={disabled}
                className="border-zinc-700 bg-zinc-950"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="fsocial"
                checked={footerShowSocial}
                onCheckedChange={setFooterShowSocial}
                disabled={disabled}
              />
              <Label htmlFor="fsocial">Hiển thị mạng xã hội</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fcolh">Tiêu đề cột liên kết</Label>
              <Input
                id="fcolh"
                value={footerColHeading}
                onChange={(e) => setFooterColHeading(e.target.value)}
                disabled={disabled}
                className="border-zinc-700 bg-zinc-950"
              />
            </div>
            <div className="space-y-2">
              <Label>Liên kết cột</Label>
              {footerLinks.map((row, i) => (
                <div key={i} className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    placeholder="Nhãn"
                    value={row.label}
                    disabled={disabled}
                    onChange={(e) => {
                      const next = [...footerLinks]
                      next[i] = { ...next[i]!, label: e.target.value }
                      setFooterLinks(next)
                    }}
                    className="border-zinc-700 bg-zinc-950"
                  />
                  <Input
                    placeholder="https://…"
                    value={row.href}
                    disabled={disabled}
                    onChange={(e) => {
                      const next = [...footerLinks]
                      next[i] = { ...next[i]!, href: e.target.value }
                      setFooterLinks(next)
                    }}
                    className="border-zinc-700 bg-zinc-950"
                  />
                </div>
              ))}
            </div>
          </section>

          {!disabled ? (
            <Button
              type="button"
              className="bg-[#E8FF47] text-zinc-950 hover:bg-[#E8FF47]/90"
              disabled={saving === "tab3"}
              onClick={() => void saveTab3()}
            >
              {saving === "tab3" ? "Đang lưu…" : "Lưu Header & Footer"}
            </Button>
          ) : null}
        </TabsContent>

        <TabsContent value="notif" className="mt-4 space-y-4">
          <div className="flex items-center gap-2">
            <Switch
              id="toast"
              checked={toastEnabled}
              onCheckedChange={setToastEnabled}
              disabled={disabled}
            />
            <Label htmlFor="toast">Bật thông báo toast trên site</Label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="naccent">Màu nhấn toast</Label>
              <Input
                id="naccent"
                value={notifAccent}
                onChange={(e) => setNotifAccent(e.target.value)}
                disabled={disabled}
                placeholder="#0070f3"
                className="border-zinc-700 bg-zinc-950"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ndur">Thời lượng (ms)</Label>
              <Input
                id="ndur"
                type="number"
                min={0}
                step={100}
                value={notifDuration}
                onChange={(e) => setNotifDuration(e.target.value)}
                disabled={disabled}
                placeholder="4000"
                className="border-zinc-700 bg-zinc-950"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Vị trí hiển thị</Label>
            <Select
              value={notifPosition ?? "top-right"}
              onValueChange={(v) =>
                setNotifPosition(v as NotifBrandConfig["position"])
              }
              disabled={disabled}
            >
              <SelectTrigger className="max-w-xs border-zinc-700 bg-zinc-950">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-zinc-700 bg-zinc-900 text-zinc-50">
                <SelectItem value="top-right">Trên phải</SelectItem>
                <SelectItem value="top-center">Trên giữa</SelectItem>
                <SelectItem value="bottom-center">Dưới giữa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {!disabled ? (
            <Button
              type="button"
              className="bg-[#E8FF47] text-zinc-950 hover:bg-[#E8FF47]/90"
              disabled={saving === "tab4"}
              onClick={() => void saveTab4()}
            >
              {saving === "tab4" ? "Đang lưu…" : "Lưu tab này"}
            </Button>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  )
}
