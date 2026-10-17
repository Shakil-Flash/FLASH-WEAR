export type Role = 'admin' | 'staff' | 'customer';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: Role;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  color: string;
  sku: string;
  inventory_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  details: string | null;
  category_id: string | null;
  collection_id: string | null;
  price: number;
  compare_at_price: number | null;
  is_published: boolean;
  is_featured: boolean;
  is_bestseller: boolean;
  created_at: string;
  updated_at: string;
  category?: Category | null;
  collection?: Collection | null;
  images?: ProductImage[];
  variants?: ProductVariant[];
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  sku: string;
  size: string;
  color: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  product_image_url: string | null;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  division: string;
  district: string;
  delivery_address: string;
  order_notes: string | null;
  payment_method: 'cash_on_delivery';
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  status: OrderStatus;
  tracking_number: string | null;
  admin_notes: string | null;
  receipt_token: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface SiteSettings {
  id: number;
  store_name: string;
  contact_email: string;
  contact_phone: string;
  dhaka_delivery_fee: number;
  outside_dhaka_delivery_fee: number;
  low_stock_threshold: number;
  free_shipping_threshold: number | null;
  announcement_text: string | null;
  updated_at: string;
}

export interface CartItem {
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  size: string;
  color: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  maxInventory: number;
  imageUrl: string;
}

export interface CheckoutInput {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  division: string;
  district: string;
  deliveryAddress: string;
  orderNotes?: string;
  items: {
    variantId: string;
    quantity: number;
  }[];
  idempotencyKey?: string;
}
