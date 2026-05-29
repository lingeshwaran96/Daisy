// src/types/database.ts
// Complete TypeScript types for DAISY database schema

export type Database = {
  public: {
    Tables: {
      users: { Row: User; Insert: UserInsert; Update: Partial<UserInsert> };
      products: { Row: Product; Insert: ProductInsert; Update: Partial<ProductInsert> };
      categories: { Row: Category; Insert: CategoryInsert; Update: Partial<CategoryInsert> };
      subcategories: { Row: Subcategory; Insert: SubcategoryInsert; Update: Partial<SubcategoryInsert> };
      orders: { Row: Order; Insert: OrderInsert; Update: Partial<OrderInsert> };
      order_items: { Row: OrderItem; Insert: OrderItemInsert; Update: Partial<OrderItemInsert> };
      reviews: { Row: Review; Insert: ReviewInsert; Update: Partial<ReviewInsert> };
      wishlist: { Row: WishlistItem; Insert: WishlistInsert; Update: Partial<WishlistInsert> };
      cart: { Row: CartItem; Insert: CartInsert; Update: Partial<CartInsert> };
      payments: { Row: Payment; Insert: PaymentInsert; Update: Partial<PaymentInsert> };
      coupons: { Row: Coupon; Insert: CouponInsert; Update: Partial<CouponInsert> };
      banners: { Row: Banner; Insert: BannerInsert; Update: Partial<BannerInsert> };
      instagram_posts: { Row: InstagramPost; Insert: InstagramPostInsert; Update: Partial<InstagramPostInsert> };
      testimonials: { Row: Testimonial; Insert: TestimonialInsert; Update: Partial<TestimonialInsert> };
      newsletter_subscribers: { Row: NewsletterSubscriber; Insert: NewsletterSubscriberInsert; Update: Partial<NewsletterSubscriberInsert> };
      site_settings: { Row: SiteSetting; Insert: SiteSettingInsert; Update: Partial<SiteSettingInsert> };
      menu_items: { Row: MenuItem; Insert: MenuItemInsert; Update: Partial<MenuItemInsert> };
      cms_pages: { Row: CmsPage; Insert: CmsPageInsert; Update: Partial<CmsPageInsert> };
      seo_settings: { Row: SeoSetting; Insert: SeoSettingInsert; Update: Partial<SeoSettingInsert> };
      addresses: { Row: SavedAddress; Insert: SavedAddressInsert; Update: Partial<SavedAddressInsert> };
    };
  };
};

// ---- User ----
export type User = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: 'user' | 'admin' | 'seller';
  created_at: string;
  updated_at: string;
};
export type UserInsert = Omit<User, 'id' | 'created_at' | 'updated_at'>;

// ---- Product ----
export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: number;
  offer_price: number | null;
  images: string[];
  video_url: string | null;
  category_id: string;
  subcategory_id: string | null;
  tags: string[];
  variants: ProductVariant[];
  stock: number;
  sku: string | null;
  is_active: boolean;
  is_featured: boolean;
  is_bestseller: boolean;
  is_new_arrival: boolean;
  weight: string | null;
  material: string | null;
  occasion: string | null;
  specifications: Record<string, string> | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
};
export type ProductVariant = {
  name: string;
  options: string[];
};
export type ProductInsert = Omit<Product, 'id' | 'created_at' | 'updated_at'>;

// ---- Category ----
export type Category = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};
export type CategoryInsert = Omit<Category, 'id' | 'created_at'>;

// ---- Subcategory ----
export type Subcategory = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};
export type SubcategoryInsert = Omit<Subcategory, 'id' | 'created_at'>;

// ---- Order ----
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentMethod = 'razorpay' | 'upi_manual' | 'whatsapp' | 'cod';

export type Order = {
  id: string;
  user_id: string;
  order_number: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  subtotal: number;
  discount: number;
  shipping_fee: number;
  total: number;
  coupon_code: string | null;
  shipping_address: Address;
  tracking_number: string | null;
  tracking_url: string | null;
  notes: string | null;
  whatsapp_message: string | null;
  packed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
};
export type OrderInsert = Omit<Order, 'id' | 'created_at' | 'updated_at'>;

export type Address = {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

// ---- Saved Address ----
export type SavedAddress = {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_default: boolean;
  created_at: string;
};
export type SavedAddressInsert = Omit<SavedAddress, 'id' | 'created_at'>;

// ---- Order Item ----
export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  variant: string | null;
  quantity: number;
  price: number;
  total: number;
};
export type OrderItemInsert = Omit<OrderItem, 'id'>;

// ---- Review ----
export type Review = {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  images: string[];
  is_verified: boolean;
  is_approved: boolean;
  created_at: string;
};
export type ReviewInsert = Omit<Review, 'id' | 'created_at'>;

// ---- Testimonial (Admin-managed homepage reviews) ----
export type Testimonial = {
  id: string;
  customer_name: string;
  customer_photo: string | null;
  rating: number;
  review_text: string;
  product_name: string | null;
  is_verified: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};
export type TestimonialInsert = Omit<Testimonial, 'id' | 'created_at'>;

// ---- Newsletter ----
export type NewsletterSubscriber = {
  id: string;
  email: string;
  name: string | null;
  is_active: boolean;
  subscribed_at: string;
};
export type NewsletterSubscriberInsert = Omit<NewsletterSubscriber, 'id' | 'subscribed_at'>;

// ---- Site Setting ----
export type SiteSetting = {
  key: string;
  value: string | null;
  updated_at: string;
};
export type SiteSettingInsert = Omit<SiteSetting, 'updated_at'>;

// ---- Menu Item ----
export type MenuItem = {
  id: string;
  label: string;
  href: string;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  open_in_new_tab: boolean;
  created_at: string;
};
export type MenuItemInsert = Omit<MenuItem, 'id' | 'created_at'>;

// ---- CMS Page ----
export type CmsPage = {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_title: string | null;
  meta_description: string | null;
  og_image: string | null;
  is_published: boolean;
  updated_at: string;
  created_at: string;
};
export type CmsPageInsert = Omit<CmsPage, 'id' | 'updated_at' | 'created_at'>;

// ---- SEO Setting ----
export type SeoSetting = {
  id: string;
  page_path: string;
  meta_title: string | null;
  meta_description: string | null;
  og_image: string | null;
  keywords: string | null;
  canonical_url: string | null;
  updated_at: string;
};
export type SeoSettingInsert = Omit<SeoSetting, 'id' | 'updated_at'>;

// ---- Wishlist ----
export type WishlistItem = {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
};
export type WishlistInsert = Omit<WishlistItem, 'id' | 'created_at'>;

// ---- Cart ----
export type CartItem = {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  variant: string | null;
  created_at: string;
};
export type CartInsert = Omit<CartItem, 'id' | 'created_at'>;

// ---- Payment ----
export type Payment = {
  id: string;
  order_id: string;
  user_id: string;
  method: PaymentMethod;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  razorpay_payment_id: string | null;
  razorpay_order_id: string | null;
  razorpay_signature: string | null;
  transaction_id: string | null;
  screenshot_url: string | null;
  qr_code_url: string | null;
  verified_at: string | null;
  created_at: string;
};
export type PaymentInsert = Omit<Payment, 'id' | 'created_at'>;

// ---- Coupon ----
export type Coupon = {
  id: string;
  code: string;
  description: string | null;
  type: 'percentage' | 'fixed';
  value: number;
  min_order_amount: number;
  max_uses: number;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
};
export type CouponInsert = Omit<Coupon, 'id' | 'created_at'>;

// ---- Banner ----
export type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  mobile_image_url: string | null;
  link: string | null;
  position: 'hero' | 'middle' | 'bottom' | 'popup';
  is_active: boolean;
  sort_order: number;
  created_at: string;
};
export type BannerInsert = Omit<Banner, 'id' | 'created_at'>;

// ---- Instagram Post ----
export type InstagramPost = {
  id: string;
  image_url: string;
  caption: string | null;
  post_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};
export type InstagramPostInsert = Omit<InstagramPost, 'id' | 'created_at'>;
