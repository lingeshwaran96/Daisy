// src/app/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Package, ShoppingCart, Users, Tag, BarChart3, TrendingUp,
  Plus, Image as ImageIcon, Percent, MessageSquare, Settings,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Stats = { products: number; orders: number; users: number; revenue: number };

const QUICK_LINKS = [
  { label: 'Add Product', href: '/admin/products/new', Icon: Plus, color: 'bg-daisy-700' },
  { label: 'Manage Orders', href: '/admin/orders', Icon: ShoppingCart, color: 'bg-rose-600' },
  { label: 'Manage Banners', href: '/admin/banners', Icon: ImageIcon, color: 'bg-amber-600' },
  { label: 'Manage Coupons', href: '/admin/coupons', Icon: Percent, color: 'bg-green-600' },
  { label: 'Manage Reviews', href: '/admin/reviews', Icon: MessageSquare, color: 'bg-purple-600' },
  { label: 'Settings', href: '/admin/settings', Icon: Settings, color: 'bg-gray-600' },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ products: 0, orders: 0, users: 0, revenue: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ count: products }, { count: orders }, { count: users }, { data: rev }, { data: recent }] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('total').eq('payment_status', 'paid'),
        supabase.from('orders').select('*, users(full_name, email)').order('created_at', { ascending: false }).limit(5),
      ]);
      const revenue = rev?.reduce((s: number, o: any) => s + (o.total || 0), 0) || 0;
      setStats({ products: products || 0, orders: orders || 0, users: users || 0, revenue });
      setRecentOrders(recent || []);
      setLoading(false);
    }
    load();
  }, []);

  const STAT_CARDS = [
    { label: 'Total Products', value: stats.products, Icon: Package, color: 'text-daisy-700', bg: 'bg-daisy-50' },
    { label: 'Total Orders', value: stats.orders, Icon: ShoppingCart, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Total Users', value: stats.users, Icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Revenue', value: `₹${stats.revenue.toLocaleString('en-IN')}`, Icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    processing: 'bg-purple-100 text-purple-700',
    shipped: 'bg-indigo-100 text-indigo-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div className="p-6 md:p-10">
      <div className="mb-10">
        <h1 className="font-heading text-4xl text-daisy-900 font-light">Dashboard</h1>
        <p className="font-body text-sm text-daisy-500 mt-1">Welcome back, Admin 🌸</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
        {STAT_CARDS.map(({ label, value, Icon, color, bg }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-white border border-nude-200 p-6 rounded-sm"
          >
            <div className={`w-10 h-10 ${bg} rounded-full flex items-center justify-center mb-4`}>
              <Icon size={20} className={color} />
            </div>
            <p className="font-heading text-3xl text-daisy-900 font-light">{loading ? '—' : value}</p>
            <p className="font-body text-xs text-daisy-400 mt-1 tracking-wide">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="mb-10">
        <h2 className="font-heading text-xl text-daisy-800 mb-5">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {QUICK_LINKS.map(({ label, href, Icon, color }) => (
            <Link key={label} href={href}
              className={`${color} text-white flex flex-col items-center gap-3 p-5 hover:opacity-90 transition-opacity`}>
              <Icon size={22} />
              <span className="font-body text-xs text-center leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white border border-nude-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-nude-200">
          <h2 className="font-heading text-xl text-daisy-800">Recent Orders</h2>
          <Link href="/admin/orders" className="font-body text-xs text-daisy-500 hover:text-daisy-800 underline underline-offset-4 transition-colors">
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-nude-50 border-b border-nude-200">
              <tr>
                {['Order #', 'Customer', 'Amount', 'Status', 'Date', 'Action'].map((h) => (
                  <th key={h} className="text-left px-6 py-3 font-body text-[10px] tracking-widest uppercase text-daisy-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-nude-100">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-6 py-4"><div className="skeleton h-4 w-24" /></td>
                    ))}
                  </tr>
                ))
              ) : recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center font-body text-sm text-daisy-400">
                    No orders yet
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-nude-50 transition-colors">
                    <td className="px-6 py-4 font-body text-sm font-medium text-daisy-900">#{order.order_number}</td>
                    <td className="px-6 py-4 font-body text-sm text-daisy-700">
                      {order.users?.full_name || order.users?.email || 'Guest'}
                    </td>
                    <td className="px-6 py-4 font-body text-sm text-daisy-900">₹{order.total?.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4">
                      <span className={`font-body text-xs px-2.5 py-1 capitalize ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-body text-sm text-daisy-500">
                      {new Date(order.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/admin/orders/${order.id}`} className="font-body text-xs text-daisy-600 hover:text-daisy-900 underline underline-offset-2">
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
