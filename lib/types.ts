/** Vai trò trong hệ thống admin (bảng brand_users.role) */
export type BrandUserRole = "super_admin" | "brand_admin" | "brand_editor"

/** Thương hiệu gọn cho menu / selector (không cần full BrandRow) */
export type BrandOption = {
  id: string
  name: string
  slug: string
}

/** User đã đăng nhập + mapping brand (dùng trong app sau requireAuth) */
export type AppUser = {
  id: string
  email: string
  role: BrandUserRole
  /** Brand gắn với user; super_admin có thể null tùy dữ liệu RLS/seed */
  brand_id: string | null
}

/** Trạng thái sản phẩm */
export type ProductStatus = "draft" | "active" | "archived"

/** Loại asset sản phẩm / brand */
export type ProductAssetType =
  | "logo"
  | "banner"
  | "product_image"
  | "background"
  | "icon"

/** Mức thông báo */
export type NotificationLevel = "info" | "success" | "warning" | "error"

// —— JSON config brands (form flatten → object khi lưu DB) ——

export type HeaderNavLink = {
  label: string
  /** Schema JSONB thường dùng `url`; bản cũ có thể dùng `href` */
  url?: string
  href?: string
  open_in_new_tab?: boolean
}

export type HeaderConfig = {
  title?: string
  bg_color?: string
  text_color?: string
  show_logo?: boolean
  links?: HeaderNavLink[]
}

export type FooterColumn = {
  heading?: string
  links?: HeaderNavLink[]
}

export type FooterNavLink = {
  label: string
  url?: string
  href?: string
}

export type FooterConfig = {
  copyright?: string
  bg_color?: string
  text_color?: string
  /** Theo schema mặc định; có thể là URL hoặc object tùy frontend */
  social_links?: unknown[]
  links?: FooterNavLink[]
  /** Tiêu đề nhóm liên kết (key mở rộng, không có trong default SQL) */
  links_heading?: string
  /** Legacy admin — cột + heading */
  columns?: FooterColumn[]
  show_social?: boolean
}

export type NotifBrandConfig = {
  accent_color?: string
  position?: "top-right" | "top-center" | "bottom-center"
  duration_ms?: number
  /** Key mở rộng cho admin site (không bắt buộc trong default SQL) */
  toast_enabled?: boolean
}

export type BrandRow = {
  id: string
  name: string
  slug: string
  is_active: boolean
  logo_url: string | null
  favicon_url: string | null
  /** DB: NOT NULL DEFAULT '#000000' */
  primary_color: string
  secondary_color: string | null
  accent_color: string | null
  font_family: string | null
  header_config: HeaderConfig | null
  footer_config: FooterConfig | null
  notif_config: NotifBrandConfig | null
  event_name: string | null
  event_date: string | null
  event_location: string | null
  event_config: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export type BrandUserRow = {
  id: string
  brand_id: string
  user_id: string
  role: BrandUserRole
  created_at: string
}

export type ProductCategoryRow = {
  id: string
  brand_id: string
  name: string
  slug: string
  sort_order: number
  created_at: string
}

export type ProductRow = {
  id: string
  brand_id: string
  category_id: string | null
  name: string
  slug: string
  description: string | null
  short_desc: string | null
  status: ProductStatus
  image_url: string | null
  thumbnail_url: string | null
  /** DB: jsonb NOT NULL DEFAULT '{}' */
  metadata: Record<string, unknown>
  sort_order: number
  is_featured: boolean
  seo_title: string | null
  seo_description: string | null
  created_at: string
  updated_at: string
}

export type ProductAssetRow = {
  id: string
  product_id: string
  brand_id: string
  asset_type: ProductAssetType
  url: string
  storage_path: string
  alt_text: string | null
  sort_order: number
  created_at: string
}

export type BrandAssetRow = {
  id: string
  brand_id: string
  asset_type: ProductAssetType
  url: string
  storage_path: string
  label: string | null
  is_active: boolean
  created_at: string
}

export type NotificationRow = {
  id: string
  brand_id: string | null
  level: NotificationLevel
  title: string
  body: string | null
  cta_label: string | null
  cta_url: string | null
  is_active: boolean
  show_from: string | null
  show_until: string | null
  created_by: string | null
  created_at: string
}

export type AuditLogRow = {
  id: string
  brand_id: string | null
  user_id: string | null
  action: string
  table_name: string | null
  record_id: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
}
