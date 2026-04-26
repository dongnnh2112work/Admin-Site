/**
 * Đường dẫn ứng dụng — dùng thống nhất thay vì hardcode string.
 */
export const ROUTES = {
  login: "/login",
  dashboard: "/dashboard",
  brands: "/brands",
  brand: (id: string) => `/brands/${id}` as const,
  brandProducts: (brandId: string) => `/brands/${brandId}/products` as const,
  brandProductNew: (brandId: string) => `/brands/${brandId}/products/new` as const,
  brandProduct: (brandId: string, productId: string) =>
    `/brands/${brandId}/products/${productId}` as const,
  brandAssets: (brandId: string) => `/brands/${brandId}/assets` as const,
  brandNotifications: (brandId: string) => `/brands/${brandId}/notifications` as const,
  users: "/users",
  auditLog: "/audit-log",
  settings: "/settings",
} as const
