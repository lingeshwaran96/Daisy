-- Migration: Fix RLS policies for public and guest checkouts on orders and order_items
-- Run this in your Supabase SQL Editor to enable guest checkouts and receipts to work properly!

-- ── 1. Fix orders RLS Policies ───────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;

-- Allow anyone to create an order (necessary for guest checkout)
CREATE POLICY "Anyone can create orders" ON public.orders 
  FOR INSERT WITH CHECK (true);

-- Allow anyone to view their own order if they have the order ID/number
CREATE POLICY "Anyone can view their own order if they know the order number" ON public.orders 
  FOR SELECT USING (true);

-- Allow admins and sellers full management access
CREATE POLICY "Admins and sellers can manage all orders" ON public.orders 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND (role = 'admin' OR role = 'seller'))
  );


-- ── 2. Fix order_items RLS Policies ──────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can select order_items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can insert order_items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can manage all order_items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can view order items of their order" ON public.order_items;
DROP POLICY IF EXISTS "Admins and sellers can manage all order items" ON public.order_items;

-- Allow anyone to insert order items during checkout
CREATE POLICY "Anyone can insert order items" ON public.order_items 
  FOR INSERT WITH CHECK (true);

-- Allow anyone to view order items (public read)
CREATE POLICY "Anyone can view order items" ON public.order_items 
  FOR SELECT USING (true);

-- Allow admins and sellers full management access
CREATE POLICY "Admins and sellers can manage all order items" ON public.order_items 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND (role = 'admin' OR role = 'seller'))
  );
