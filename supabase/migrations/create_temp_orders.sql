-- Migration: Create temp_orders table for temporary unpaid orders
-- Run this in your Supabase SQL Editor

-- 1. Create the temp_orders table
CREATE TABLE IF NOT EXISTS public.temp_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  temp_order_number TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending_verification' CHECK (status IN ('pending_verification', 'approved', 'rejected', 'fraud')),
  subtotal NUMERIC(10,2) NOT NULL,
  shipping_fee NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  shipping_address JSONB NOT NULL,
  items JSONB NOT NULL, -- List of cart items as JSON: [{productId, name, image, variant, quantity, price}]
  confirmed_order_number TEXT, -- Final confirmed order ID after approval
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.temp_orders ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies for temp_orders
-- Allow users to view their own temporary orders (and let guests view theirs if user_id is null)
CREATE POLICY "Users can view own temp orders" ON public.temp_orders 
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Allow anyone (including guests) to place a temporary order
CREATE POLICY "Anyone can insert temp orders" ON public.temp_orders 
  FOR INSERT WITH CHECK (true);

-- Allow admins to manage (select, insert, update, delete) all temporary orders
CREATE POLICY "Admins can manage all temp orders" ON public.temp_orders 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Enable real-time updates for temp_orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.temp_orders;
