# Project Context — Event Admin Site

> File này dành cho Cursor AI đọc để hiểu toàn bộ dự án trước khi làm việc.  
> Đặt file này ở root folder. Cursor sẽ tự đọc khi mở project.

---

## Dự án là gì?

Một **admin panel đa tenant** (multi-tenant) cho event agency.  
Nhiều brand (khách hàng) dùng chung **1 Supabase project**, nhưng dữ liệu hoàn toàn tách biệt nhờ Row Level Security (RLS).

Người dùng admin site bao gồm:
- Project Manager của agency (Super Admin)
- Đại diện của từng brand (Brand Admin)
- Nhân viên vận hành sự kiện (Brand Editor)

---

## Tech stack

| Thành phần | Công nghệ |
|------------|-----------|
| Framework | Next.js 14 — App Router |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| UI Components | Shadcn/ui |
| Database + Auth + Storage | Supabase |
| Form | React Hook Form + Zod |
| File upload | react-dropzone |
| Date | date-fns với locale `vi` (tiếng Việt) |
| Icons | Lucide React |

---

## Cấu trúc database (Supabase)

### Bảng chính

**`brands`** — Config của từng brand/client
```
id, name, slug, is_active,
logo_url, favicon_url,
primary_color, secondary_color, accent_color, font_family,
header_config (jsonb), footer_config (jsonb), notif_config (jsonb),
event_name, event_date, event_location, event_config (jsonb),
created_at, updated_at
```

**`brand_users`** — Mapping user → brand + role
```
id, brand_id (FK → brands), user_id (FK → auth.users),
role (super_admin | brand_admin | brand_editor),
created_at
```

**`products`** — Sản phẩm của từng brand
```
id, brand_id (FK), category_id (FK),
name, slug, description, short_desc,
status (draft | active | archived),
image_url, thumbnail_url,
metadata (jsonb), sort_order, is_featured,
seo_title, seo_description,
created_at, updated_at
```

**`product_categories`** — Danh mục sản phẩm
```
id, brand_id (FK), name, slug, sort_order, created_at
```

**`product_assets`** — Nhiều ảnh per sản phẩm
```
id, product_id (FK), brand_id (FK),
asset_type (logo|banner|product_image|background|icon),
url, storage_path, alt_text, sort_order, created_at
```

**`brand_assets`** — Ảnh của brand (logo, banner, background)
```
id, brand_id (FK),
asset_type, url, storage_path, label, is_active, created_at
```

**`notifications`** — Thông báo broadcast
```
id, brand_id (FK, nullable — null = gửi tất cả brands),
level (info|success|warning|error),
title, body, cta_label, cta_url,
is_active, show_from, show_until,
created_by, created_at
```

**`audit_log`** — Lịch sử thay đổi (không bao giờ xóa)
```
id (bigserial), brand_id, user_id,
action, table_name, record_id,
old_data (jsonb), new_data (jsonb),
ip_address, created_at
```

### Storage bucket

Tên bucket: `brand-assets` (public)  
Cấu trúc folder:
```
brands/
  {brand-slug}/
    logo/
    banner/
    background/
    icon/
    products/
      {product-id}/
```

---

## Phân quyền (Role-based access)

| Quyền | super_admin | brand_admin | brand_editor |
|-------|-------------|-------------|--------------|
| Xem tất cả brands | ✅ | ❌ | ❌ |
| Thêm/xóa brand | ✅ | ❌ | ❌ |
| Sửa brand của mình | ✅ | ✅ | ❌ |
| Quản lý sản phẩm | ✅ | ✅ | ✅ |
| Upload ảnh | ✅ | ✅ | chỉ products/ |
| Tạo thông báo tất cả brands | ✅ | ❌ | ❌ |
| Tạo thông báo brand của mình | ✅ | ✅ | ❌ |
| Quản lý users | ✅ | ❌ | ❌ |
| Xem Audit Log | ✅ | ❌ | ❌ |
| Xem Settings | ✅ | ❌ | ❌ |

### Cách kiểm tra role trong code

```typescript
// Server component
const user = await requireAuth()
if (user.role !== 'super_admin') redirect('/dashboard')

// Client component — ẩn/hiện UI element
{user.role === 'super_admin' && <Button>Xóa brand</Button>}

// Query Supabase có filter brand
// super_admin: không filter (thấy tất cả)
// brand_admin/editor: thêm .eq('brand_id', user.brand_id)
```

---

## Quy tắc bắt buộc khi viết code

### 1. KHÔNG BAO GIỜ hiển thị JSON với người dùng

Sai:
```tsx
<textarea value={JSON.stringify(brand.header_config)} />
```

Đúng — convert JSON thành form fields bình thường:
```tsx
<Input label="Tiêu đề header" value={brand.header_config.title} onChange={...} />
<ColorPicker label="Màu nền" value={brand.header_config.bg_color} onChange={...} />
```

Khi submit: convert form values ngược lại thành JSON trước khi gửi Supabase.

### 2. MỌI hành động xóa phải có ConfirmDialog

```tsx
<ConfirmDialog
  open={open}
  onOpenChange={setOpen}
  title="Xóa sản phẩm [tên]?"
  description="Hành động này không thể hoàn tác. Toàn bộ hình ảnh của sản phẩm cũng sẽ bị xóa."
  onConfirm={handleDelete}
  isLoading={isDeleting}
/>
```

### 3. Tất cả text hiển thị phải là tiếng Việt

- Labels, placeholders, error messages, toast notifications, button text
- Thời gian: dùng `date-fns` với `import { vi } from 'date-fns/locale'`
- Múi giờ: luôn dùng `Asia/Ho_Chi_Minh`

### 4. Mobile-first — mọi trang phải hoạt động trên 375px

- Sidebar ẩn trên mobile (`hidden md:flex`)
- BottomTabBar hiện trên mobile (`flex md:hidden`)
- Table → card grid trên mobile
- Form: single column trên mobile, 2 columns trên desktop

### 5. Tuyệt đối không dùng `position: fixed`

App shell dùng overflow scroll, không dùng `position: fixed` cho bất kỳ element nào.  
Thay thế: dùng sticky, hoặc thiết kế layout với flex/grid.

### 6. Luôn xử lý loading và error state

```tsx
if (isLoading) return <Skeleton />
if (error) return <ErrorState message="Không thể tải dữ liệu. Vui lòng thử lại." />
if (!data || data.length === 0) return <EmptyState ... />
```

---

## Cấu trúc folder

```
/app
  /login                          → Trang đăng nhập (không có sidebar)
  /(admin)                        → Route group — tất cả trang cần auth
    layout.tsx                    → Dùng AppShell, kiểm tra auth
    /dashboard/page.tsx
    /brands/page.tsx
    /brands/[id]/page.tsx
    /brands/[id]/products/page.tsx
    /brands/[id]/products/new/page.tsx
    /brands/[id]/products/[productId]/page.tsx
    /brands/[id]/assets/page.tsx
    /brands/[id]/notifications/page.tsx
    /users/page.tsx               → super_admin only
    /audit-log/page.tsx           → super_admin only
    /settings/page.tsx            → super_admin only

/components
  /layout
    AppShell.tsx                  → Wrapper chính
    Sidebar.tsx                   → Desktop, icon-only, 44px
    TopBar.tsx                    → Top navigation
    BottomTabBar.tsx              → Mobile, 5 tabs
  /shared
    ConfirmDialog.tsx             → Dùng trước MỌI hành động xóa
    PageHeader.tsx                → Title + actions
    StatCard.tsx                  → Metric card
    StorageWarning.tsx            → Banner khi storage > 80%
    EventCountdown.tsx            → Banner khi event < 7 ngày
    EmptyState.tsx                → Empty state có icon + CTA
  /brands
    BrandList.tsx
    BrandDetailForm.tsx           → 4 tabs, NO JSON fields
    BrandColorPicker.tsx
    HeaderConfigForm.tsx          → Form bình thường, lưu thành header_config
    FooterConfigForm.tsx
  /products
    ProductList.tsx
    ProductForm.tsx               → NO JSON fields, metadata là key-value builder
    StatusToggle.tsx
    FeaturedToggle.tsx
  /assets
    MediaManager.tsx
    UploadDropzone.tsx
    FileCard.tsx
  /notifications
    NotificationList.tsx
    NotificationFormDialog.tsx
  /dashboard
    DashboardView.tsx

/lib
  supabase/
    client.ts                     → Browser client (createBrowserClient)
    server.ts                     → Server client (createServerClient + cookies)
  auth.ts                         → getCurrentUser, requireAuth, isSuperAdmin
  types.ts                        → Tất cả TypeScript interfaces

/hooks
  useBrands.ts
  useProducts.ts
  useAssets.ts
  useNotifications.ts
  useCurrentUser.ts

/constants
  routes.ts                       → ROUTES object
```

---

## Luồng authentication

```
User truy cập trang admin
  → app/(admin)/layout.tsx gọi requireAuth()
    → requireAuth() gọi getCurrentUser()
      → getCurrentUser() gọi supabase.auth.getUser()
        → Nếu không có user: redirect('/login')
        → Nếu có user: query brand_users để lấy role + brand_id
          → Return { id, email, role, brand_id }
```

---

## Patterns hay dùng

### Server Component fetch data + pass to Client Component

```tsx
// app/(admin)/brands/page.tsx — Server Component
export default async function BrandsPage() {
  const user = await requireAuth()
  const supabase = await createClient()

  let query = supabase.from('brands').select('*').order('updated_at', { ascending: false })
  if (user.role !== 'super_admin') {
    query = query.eq('id', user.brand_id)
  }
  const { data: brands } = await query

  return <BrandList brands={brands ?? []} userRole={user.role} />
}
```

### Inline status toggle (không cần nút Lưu)

```tsx
// Thay đổi ngay khi user chọn, không cần submit form
async function handleStatusChange(productId: string, newStatus: ProductStatus) {
  const supabase = createClient()
  await supabase.from('products').update({ status: newStatus }).eq('id', productId)
  // Refresh data
}
```

### Upload ảnh lên Supabase Storage

```tsx
async function uploadImage(file: File, brandSlug: string, folder: string) {
  const supabase = createClient()
  const filename = `${Date.now()}-${file.name}`
  const path = `brands/${brandSlug}/${folder}/${filename}`

  const { error } = await supabase.storage
    .from('brand-assets')
    .upload(path, file, { upsert: true })

  if (error) throw error

  const { data } = supabase.storage.from('brand-assets').getPublicUrl(path)
  return data.publicUrl
}
```

### Convert JSON config thành form fields và ngược lại

```tsx
// Load: JSON → form values
const defaultValues = {
  header_title: brand.header_config.title,
  header_bg_color: brand.header_config.bg_color,
  header_show_logo: brand.header_config.show_logo,
  header_links: brand.header_config.links,
}

// Save: form values → JSON
const header_config: HeaderConfig = {
  title: values.header_title,
  bg_color: values.header_bg_color,
  show_logo: values.header_show_logo,
  text_color: values.header_text_color,
  links: values.header_links,
}
await supabase.from('brands').update({ header_config }).eq('id', brandId)
```

---

## Những thứ KHÔNG làm

| Không làm | Thay bằng |
|-----------|-----------|
| Hiển thị raw JSON với user | Form fields bình thường |
| `position: fixed` | Sticky hoặc flex layout |
| Xóa không có confirm | ConfirmDialog |
| Text tiếng Anh | Tiếng Việt |
| Hardcode brand_id | Lấy từ `user.brand_id` |
| Query không filter theo role | Kiểm tra `user.role` trước khi query |
| Dùng `any` trong TypeScript | Dùng đúng type từ `lib/types.ts` |

---

## Thông tin Supabase

- URL và key: xem file `.env.local`
- RLS đã được cấu hình sẵn trong `schema.sql`
- Storage bucket tên: `brand-assets` (public)
- Timezone mặc định: `Asia/Ho_Chi_Minh`

---

## Liên hệ khi có vấn đề

Xem file `TODO.md` để biết task nào cần làm tiếp theo.  
Xem file `cursor_prompts_v2_tung_man_hinh.txt` để lấy prompt chi tiết cho từng step.
