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

export type PaymentMethod = 'cash_on_delivery' | 'sslcommerz';

export type PaymentStatus =
  | 'unpaid'
  | 'pending'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refund_pending'
  | 'partially_refunded'
  | 'refunded';

export type ShipmentStatus =
  | 'not_shipped'
  | 'shipment_requested'
  | 'accepted_by_courier'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'delivery_failed'
  | 'returned_to_sender'
  | 'cancelled';

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
  user_id?: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  division: string;
  district: string;
  delivery_address: string;
  order_notes: string | null;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  subtotal: number;
  delivery_fee: number;
  discount_amount: number;
  coupon_id?: string | null;
  coupon_code?: string | null;
  loyalty_points_redeemed?: number;
  loyalty_discount_amount?: number;
  loyalty_points_earned?: number;
  referral_code_used?: string | null;
  total_amount: number;
  status: OrderStatus;
  tracking_number: string | null;
  courier_name?: string | null;
  courier_consignment_id?: string | null;
  courier_tracking_url?: string | null;
  shipment_status?: ShipmentStatus;
  admin_notes: string | null;
  receipt_token: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface PaymentTransaction {
  id: string;
  order_id: string;
  gateway: 'sslcommerz';
  tran_id: string;
  val_id?: string | null;
  amount: number;
  currency: string;
  status: 'initiated' | 'pending' | 'validated' | 'failed' | 'cancelled' | 'refunded';
  card_type?: string | null;
  bank_tran_id?: string | null;
  card_brand?: string | null;
  card_issuer?: string | null;
  raw_response?: any;
  error_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  used_count: number;
  per_customer_limit: number;
  is_active: boolean;
  starts_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CouponRedemption {
  id: string;
  coupon_id: string;
  order_id: string;
  customer_email: string | null;
  user_id: string | null;
  discount_amount: number;
  created_at: string;
}

export interface CustomerAddress {
  id: string;
  user_id: string;
  label: string;
  full_name: string;
  phone: string;
  division: string;
  district: string;
  address_line: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  product?: Product;
  created_at: string;
}

export type ReturnRequestType = 'return' | 'exchange';

export type ReturnStatus =
  | 'requested'
  | 'approved'
  | 'rejected'
  | 'return_in_transit'
  | 'received'
  | 'inspected'
  | 'completed'
  | 'cancelled';

export interface ReturnRequestedItem {
  order_item_id: string;
  product_id: string;
  variant_id: string;
  sku: string;
  product_name: string;
  size: string;
  quantity: number;
  unit_price: number;
  exchange_size?: string;
}

export interface ReturnRequest {
  id: string;
  order_id: string;
  order_number: string;
  user_id?: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  request_type: ReturnRequestType;
  items: ReturnRequestedItem[];
  reason: string;
  customer_notes?: string | null;
  image_urls?: string[];
  status: ReturnStatus;
  inspection_outcome?: string | null;
  is_restocked: boolean;
  refund_amount: number;
  refund_status: 'unrefunded' | 'pending' | 'processed' | 'declined';
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Shipment {
  id: string;
  order_id: string;
  courier_name: string;
  consignment_id: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  status: ShipmentStatus;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  delivery_fee: number;
  cod_amount: number;
  courier_response?: any;
  created_at: string;
  updated_at: string;
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
  userId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  division: string;
  district: string;
  deliveryAddress: string;
  orderNotes?: string;
  paymentMethod?: PaymentMethod;
  couponCode?: string;
  loyaltyPointsToRedeem?: number;
  referralCode?: string;
  items: {
    variantId: string;
    quantity: number;
  }[];
  idempotencyKey?: string;
}

// ============================================================================
// PHASE 3: GROWTH, MARKETING, RETENTION & ANALYTICS TYPES
// ============================================================================

export interface LoyaltySettings {
  id: number;
  is_active: boolean;
  points_per_100_bdt: number;
  point_value_bdt: number;
  min_redemption_points: number;
  max_redemption_points: number;
  can_combine_with_coupon: boolean;
  points_expiry_days: number;
  qualifying_order_status: string;
  updated_at: string;
}

export type LoyaltyEventType =
  | 'order_earned'
  | 'order_redeemed'
  | 'order_cancelled_reversal'
  | 'return_reversal'
  | 'admin_adjustment'
  | 'referral_bonus'
  | 'welcome_bonus';

export interface LoyaltyPointsLedgerEntry {
  id: string;
  user_id: string;
  points: number;
  balance_after: number;
  event_type: LoyaltyEventType;
  order_id?: string | null;
  reference_id?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface ReferralSettings {
  id: number;
  is_active: boolean;
  referrer_reward_points: number;
  referee_discount_amount: number;
  min_qualifying_order_amount: number;
  qualifying_order_status: string;
  max_referrals_per_user: number;
  updated_at: string;
}

export type ReferralStatus = 'pending' | 'qualified' | 'rewarded' | 'reversed' | 'blocked';

export interface CustomerReferral {
  id: string;
  referrer_user_id: string;
  referral_code: string;
  referee_user_id?: string | null;
  referee_email?: string | null;
  referee_phone?: string | null;
  order_id?: string | null;
  status: ReferralStatus;
  referrer_points_awarded: number;
  referee_discount_applied: number;
  fraud_reason?: string | null;
  created_at: string;
  qualified_at?: string | null;
  updated_at: string;
}

export type AbandonedCartStatus = 'active' | 'recovered' | 'expired' | 'abandoned';

export interface AbandonedCart {
  id: string;
  recovery_token: string;
  user_id?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  customer_name?: string | null;
  cart_items: CartItem[];
  subtotal: number;
  discount_code?: string | null;
  status: AbandonedCartStatus;
  reminder_count: number;
  last_reminder_at?: string | null;
  recovered_order_id?: string | null;
  recovered_at?: string | null;
  marketing_consent: boolean;
  unsubscribed: boolean;
  created_at: string;
  updated_at: string;
}

export type SubscriptionType = 'back_in_stock' | 'price_drop';

export interface StockPriceSubscription {
  id: string;
  user_id?: string | null;
  email: string;
  product_id: string;
  variant_id?: string | null;
  subscription_type: SubscriptionType;
  target_price?: number | null;
  current_price_at_sub?: number | null;
  status: 'pending' | 'notified' | 'cancelled';
  notified_at?: string | null;
  unsubscribe_token: string;
  created_at: string;
  product?: Product;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  user_id?: string | null;
  source: string;
  status: 'active' | 'unsubscribed';
  consent_given_at: string;
  unsubscribed_at?: string | null;
  unsubscribe_token: string;
  created_at: string;
}

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';

export interface MarketingCampaign {
  id: string;
  title: string;
  subject: string;
  preview_text?: string | null;
  content_html: string;
  target_segment: string;
  status: CampaignStatus;
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  scheduled_at?: string | null;
  sent_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShoppingFunnelMetrics {
  productViews: number;
  addToCartCount: number;
  checkoutInitiationCount: number;
  purchaseCount: number;
  addToCartRate: number;
  checkoutCompletionRate: number;
  conversionRate: number;
  averageOrderValue: number;
  repeatCustomerRate: number;
  couponUsageRate: number;
  totalRevenue: number;
}

