import type {
  AppUser,
  BrandRow,
  NotificationRow,
  ProductAssetRow,
  ProductRow,
} from "@/lib/types"

/**
 * Chế độ local: vào admin không cần Supabase Auth / brand_users.
 * Bật: NEXT_PUBLIC_DEV_AUTH_BYPASS=true trong .env.local
 * ⚠️ Không bật trên production.
 */
export function isAuthBypass(): boolean {
  return process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true"
}

/** User giả lập — super_admin để xem đủ menu */
export const DEV_MOCK_USER: AppUser = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "dev@local.howl",
  role: "super_admin",
  brand_id: null,
}

const now = () => new Date().toISOString()

/** BrandRow demo theo id URL — chỉ dùng khi bypass */
export function devMockBrand(id: string): BrandRow {
  return {
    id,
    name: "Thương hiệu demo",
    slug: "thuong-hieu-demo",
    is_active: true,
    logo_url: null,
    favicon_url: null,
    primary_color: "#E8FF47",
    secondary_color: "#1C1C1C",
    accent_color: "#E8FF47",
    font_family: "DM Sans",
    header_config: {
      title: "Sự kiện demo",
      show_logo: true,
      links: [{ label: "Trang chủ", url: "#" }],
    },
    footer_config: {
      copyright: "© Demo",
      bg_color: "#1C1C1C",
      text_color: "#C4C4C4",
      social_links: [],
      links: [],
      show_social: false,
      links_heading: "Liên kết",
    },
    notif_config: {
      toast_enabled: true,
      position: "top-right",
      accent_color: "#E8FF47",
      duration_ms: 4000,
    },
    event_name: "Sự kiện mẫu",
    event_date: null,
    event_location: null,
    event_config: { notes: "Dữ liệu mẫu — kết nối Supabase để lưu thật." },
    created_at: now(),
    updated_at: now(),
  }
}

/** Sản phẩm mẫu khi bypass — cùng brand_id với route */
export function devMockProducts(brandId: string): ProductRow[] {
  const t = now()
  return [
    {
      id: "10000000-0000-4000-8000-000000000001",
      brand_id: brandId,
      category_id: null,
      name: "Gói trải nghiệm",
      slug: "goi-trai-nghiem",
      description: "Mô tả ngắn cho demo.",
      short_desc: "Demo sản phẩm",
      status: "active",
      image_url: null,
      thumbnail_url: null,
      metadata: { sku: "DEMO-001" },
      sort_order: 0,
      is_featured: true,
      seo_title: null,
      seo_description: null,
      created_at: t,
      updated_at: t,
    },
    {
      id: "10000000-0000-4000-8000-000000000002",
      brand_id: brandId,
      category_id: null,
      name: "Sản phẩm nháp",
      slug: "san-pham-nhap",
      description: null,
      short_desc: null,
      status: "draft",
      image_url: null,
      thumbnail_url: null,
      metadata: {},
      sort_order: 1,
      is_featured: false,
      seo_title: null,
      seo_description: null,
      created_at: t,
      updated_at: t,
    },
  ]
}

/** Chi tiết sản phẩm demo theo id (bypass) */
export function devMockProduct(brandId: string, productId: string): ProductRow {
  const t = now()
  return {
    id: productId,
    brand_id: brandId,
    category_id: null,
    name: "Sản phẩm demo",
    slug: "san-pham-demo",
    description: "Mô tả đầy đủ (dữ liệu mẫu).",
    short_desc: "Mô tả ngắn",
    status: "draft",
    image_url: null,
    thumbnail_url: null,
    metadata: { sku: "DEMO" },
    sort_order: 0,
    is_featured: false,
    seo_title: null,
    seo_description: null,
    created_at: t,
    updated_at: t,
  }
}

export function devMockProductAssets(): ProductAssetRow[] {
  return []
}

export function devMockNotifications(brandId: string): NotificationRow[] {
  const now = Date.now()
  return [
    {
      id: "40000000-0000-4000-8000-000000000001",
      brand_id: brandId,
      level: "info",
      title: "Chào mừng đến trang quản trị",
      body: "Bạn có thể quản lý sản phẩm và thông báo theo từng thương hiệu.",
      cta_label: "Xem sản phẩm",
      cta_url: `/brands/${brandId}/products`,
      is_active: true,
      show_from: new Date(now - 60 * 60 * 1000).toISOString(),
      show_until: null,
      created_by: DEV_MOCK_USER.id,
      created_at: new Date(now - 70 * 60 * 1000).toISOString(),
    },
    {
      id: "40000000-0000-4000-8000-000000000002",
      brand_id: null,
      level: "warning",
      title: "Bảo trì hệ thống vào 23:00",
      body: "Một số tính năng có thể gián đoạn trong thời gian bảo trì.",
      cta_label: null,
      cta_url: null,
      is_active: true,
      show_from: new Date(now + 2 * 60 * 60 * 1000).toISOString(),
      show_until: new Date(now + 4 * 60 * 60 * 1000).toISOString(),
      created_by: DEV_MOCK_USER.id,
      created_at: new Date(now - 10 * 60 * 1000).toISOString(),
    },
  ]
}
