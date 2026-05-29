-- =========================================================================
-- Add Seller Role and Update RLS Policies
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- =========================================================================

-- 1. Drop and recreate check constraint on public.users.role to include 'seller'
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin', 'seller'));

-- 2. Update Products Table RLS Policy to allow Sellers as well
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins and Sellers can manage products" ON public.products 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'seller'))
  );

-- 3. Update Categories Table RLS Policy to allow Sellers as well
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins and Sellers can manage categories" ON public.categories 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'seller'))
  );

-- 4. Update Orders Table RLS Policy to allow Sellers as well
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
CREATE POLICY "Admins and Sellers can manage all orders" ON public.orders 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'seller'))
  );

-- 5. Update Temp Orders Table RLS Policy to allow Sellers as well
DROP POLICY IF EXISTS "Admins can manage all temp orders" ON public.temp_orders;
CREATE POLICY "Admins and Sellers can manage all temp orders" ON public.temp_orders 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'seller'))
  );
