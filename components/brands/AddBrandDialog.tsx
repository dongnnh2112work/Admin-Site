"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { CalendarIcon, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { ROUTES } from "@/constants/routes"
import { createClient } from "@/lib/supabase/client"
import { slugify } from "@/lib/utils/slugify"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const schema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên thương hiệu"),
  slug: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập slug")
    .regex(/^[a-z0-9-]+$/, "Slug chỉ chứa a-z, 0-9 và dấu gạch ngang"),
  primaryColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Màu chính không hợp lệ"),
  eventName: z.string().trim().optional(),
  eventDate: z.date().optional(),
})

type FormValues = z.infer<typeof schema>

export function AddBrandDialog() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [slugManuallyEdited, setSlugManuallyEdited] = React.useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      slug: "",
      primaryColor: "#E63946",
      eventName: "",
      eventDate: undefined,
    },
  })

  const name = form.watch("name")
  const slug = form.watch("slug")
  const primaryColor = form.watch("primaryColor")
  const eventDate = form.watch("eventDate")

  React.useEffect(() => {
    if (slugManuallyEdited) return
    form.setValue("slug", slugify(name), { shouldValidate: true })
  }, [form, name, slugManuallyEdited])

  async function handleSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      const supabase = createClient()
      const normalizedSlug = values.slug.trim()

      const { data: existingSlug, error: slugError } = await supabase
        .from("brands")
        .select("id")
        .eq("slug", normalizedSlug)
        .single()

      if (existingSlug) {
        form.setError("slug", { message: "Slug này đã được dùng" })
        return
      }

      if (slugError && slugError.code !== "PGRST116") {
        throw slugError
      }

      const { data: inserted, error: insertError } = await supabase
        .from("brands")
        .insert({
          name: values.name.trim(),
          slug: normalizedSlug,
          primary_color: values.primaryColor.trim().toUpperCase(),
          event_name: values.eventName?.trim() ? values.eventName.trim() : null,
          event_date: values.eventDate
            ? format(values.eventDate, "yyyy-MM-dd")
            : null,
          is_active: true,
          font_family: "Inter",
          header_config: {
            title: values.name.trim(),
            show_logo: true,
            bg_color: "#ffffff",
            text_color: "#000000",
            links: [],
          },
          footer_config: {
            copyright: `© 2026 ${values.name.trim()}`,
            bg_color: "#f5f5f5",
            text_color: "#666666",
            social_links: [],
            links: [],
          },
          notif_config: {
            accent_color: values.primaryColor.trim().toUpperCase(),
            position: "top-right",
            duration_ms: 4000,
          },
        })
        .select("id,name")
        .single()

      if (insertError || !inserted) {
        throw insertError ?? new Error("Insert failed")
      }

      toast.success(`Đã tạo thương hiệu ${inserted.name} thành công!`)
      setOpen(false)
      form.reset({
        name: "",
        slug: "",
        primaryColor: "#E63946",
        eventName: "",
        eventDate: undefined,
      })
      setSlugManuallyEdited(false)
      router.refresh()
      router.push(ROUTES.brand(inserted.id))
    } catch {
      toast.error("Không thể tạo thương hiệu. Vui lòng thử lại.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!submitting) setOpen(next)
      }}
    >
      <DialogTrigger
        render={
          <Button
            type="button"
            className="bg-[#E8FF47] text-zinc-950 hover:bg-[#E8FF47]/90"
          />
        }
      >
        + Thêm thương hiệu
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tạo thương hiệu mới</DialogTitle>
          <DialogDescription>
            Tạo brand mới để cấu hình giao diện, sản phẩm và thông báo.
          </DialogDescription>
        </DialogHeader>

        <form
          id="add-brand-form"
          className="space-y-4"
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          <div className="space-y-2">
            <Label htmlFor="new-brand-name">Tên thương hiệu *</Label>
            <Input
              id="new-brand-name"
              disabled={submitting}
              className="border-zinc-700 bg-zinc-950"
              {...form.register("name", {
                onChange: () => {
                  if (!slugManuallyEdited) return
                },
              })}
            />
            {form.formState.errors.name ? (
              <p className="text-xs text-red-400">{form.formState.errors.name.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-brand-slug">Slug *</Label>
            <Input
              id="new-brand-slug"
              disabled={submitting}
              className="border-zinc-700 bg-zinc-950 font-mono"
              {...form.register("slug", {
                onChange: () => setSlugManuallyEdited(true),
              })}
            />
            <p className="text-xs text-zinc-400">
              Dùng trong URL và thư mục lưu trữ. Không thể thay đổi sau khi tạo.
            </p>
            <p className="font-mono text-xs text-zinc-500">
              URL game: lucky-draw-the-matrix.vercel.app/{slug || "..."}
            </p>
            {form.formState.errors.slug ? (
              <p className="text-xs text-red-400">{form.formState.errors.slug.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-brand-color">Màu chính *</Label>
            <div className="flex items-center gap-3">
              <Input
                id="new-brand-color-picker"
                type="color"
                value={primaryColor}
                disabled={submitting}
                onChange={(e) =>
                  form.setValue("primaryColor", e.target.value.toUpperCase(), {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                className="h-10 w-10 cursor-pointer border-zinc-700 bg-zinc-950 p-1"
              />
              <Input
                id="new-brand-color"
                value={primaryColor}
                disabled={submitting}
                onChange={(e) =>
                  form.setValue("primaryColor", e.target.value.toUpperCase(), {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                className="border-zinc-700 bg-zinc-950 font-mono"
              />
            </div>
            {form.formState.errors.primaryColor ? (
              <p className="text-xs text-red-400">
                {form.formState.errors.primaryColor.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-brand-event-name">Tên sự kiện</Label>
            <Input
              id="new-brand-event-name"
              placeholder="Ví dụ: Samsung Galaxy Launch 2026"
              disabled={submitting}
              className="border-zinc-700 bg-zinc-950"
              {...form.register("eventName")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-brand-event-date">Ngày sự kiện</Label>
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start border-zinc-700 bg-zinc-950 text-left font-normal hover:bg-zinc-900",
                      !eventDate && "text-zinc-500"
                    )}
                    disabled={submitting}
                  />
                }
              >
                <CalendarIcon className="mr-2 size-4" />
                {eventDate
                  ? format(eventDate, "dd/MM/yyyy", { locale: vi })
                  : "Chọn ngày sự kiện"}
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={eventDate}
                  onSelect={(date) =>
                    form.setValue("eventDate", date, { shouldDirty: true })
                  }
                  locale={vi}
                />
              </PopoverContent>
            </Popover>
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => setOpen(false)}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            form="add-brand-form"
            disabled={submitting}
            className="bg-[#E8FF47] text-zinc-950 hover:bg-[#E8FF47]/90"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Đang tạo...
              </>
            ) : (
              "Tạo thương hiệu"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
