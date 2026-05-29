// src/app/admin/analytics/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, ShoppingCart, Users, Package, IndianRupee, Star, BarChart3 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Stats = {
  totalRevenue: number; totalOrders: number; totalUsers: number; totalProducts: number;
  avgOrderValue: number; totalReviews: number;
  ordersByStatus: Record<string, number>;
  recentOrders: { date: string; total: number; status: string }[];
  topProducts: { name: string; count: number }[];
  paymentMethods: Record<string, number>;
};

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        // Fetch all data in parallel
        const [ordersRes, usersRes, productsRes, reviewsRes, itemsRes] = await Promise.all([
          supabase.from('orders').select('*'),
          supabase.from('users').select('id'),
          supabase.from('products').select('id, name'),
          supabase.from('reviews').select('id'),
          supabase.from('order_items').select('product_name, quantity'),
        ]);

        const orders = ordersRes.data || [];
        const users = usersRes.data || [];
        const products = productsRes.data || [];
        const reviews = reviewsRes.data || [];
        const items = itemsRes.data || [];

        const totalRevenue = orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
        const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

        // Orders by status
        const ordersByStatus: Record<string, number> = {};
        orders.forEach((o: any) => {
          ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
        });

        // Payment methods
        const paymentMethods: Record<string, number> = {};
        orders.forEach((o: any) => {
          const method = o.payment_method || 'unknown';
          paymentMethods[method] = (paymentMethods[method] || 0) + 1;
        });

        // Recent orders (last 10)
        const recentOrders = orders
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10)
          .map((o: any) => ({
            date: new Date(o.created_at).toLocaleDateString('en-IN'),
            total: o.total,
            status: o.status,
          }));

        // Top products by order count
        const productCounts: Record<string, number> = {};
        items.forEach((item: any) => {
          productCounts[item.product_name] = (productCounts[item.product_name] || 0) + item.quantity;
        });
        const topProducts = Object.entries(productCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setStats({
          totalRevenue, totalOrders: orders.length, totalUsers: users.length,
          totalProducts: products.length, avgOrderValue, totalReviews: reviews.length,
          ordersByStatus, recentOrders, topProducts, paymentMethods,
        });
      } catch (err) {
        console.error('Analytics error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-400', confirmed: 'bg-blue-400', processing: 'bg-purple-400',
    shipped: 'bg-indigo-400', delivered: 'bg-green-400', cancelled: 'bg-red-400',
  };

  if (loading) {
    return (
      <div className="p-6 md:p-10">
        <h1 className="font-heading text-4xl text-daisy-900 font-light mb-10">Analytics</h1>
        <div className="flex justify-center py-20"><div className="spinner text-daisy-400" /></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 md:p-10">
        <h1 className="font-heading text-4xl text-daisy-900 font-light mb-10">Analytics</h1>
        <p className="font-body text-sm text-daisy-400">Unable to load analytics data.</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10">
      <div className="mb-10">
        <h1 className="font-heading text-4xl text-daisy-900 font-light">Analytics</h1>
        <p className="font-body text-sm text-daisy-500 mt-1">Overview of your store performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
        {[
          { label: 'Revenue', value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, Icon: IndianRupee, color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Orders', value: stats.totalOrders, Icon: ShoppingCart, color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'Avg Order', value: `₹${stats.avgOrderValue.toFixed(0)}`, Icon: TrendingUp, color: 'text-purple-700', bg: 'bg-purple-50' },
          { label: 'Products', value: stats.totalProducts, Icon: Package, color: 'text-daisy-700', bg: 'bg-daisy-50' },
          { label: 'Users', value: stats.totalUsers, Icon: Users, color: 'text-indigo-700', bg: 'bg-indigo-50' },
          { label: 'Reviews', value: stats.totalReviews, Icon: Star, color: 'text-amber-700', bg: 'bg-amber-50' },
        ].map(kpi => (
          <div key={kpi.label} className={`${kpi.bg} border border-nude-200 p-5`}>
            <div className="flex items-center gap-2 mb-2">
              <kpi.Icon size={16} className={kpi.color} />
              <span className="font-body text-[10px] tracking-widest uppercase text-daisy-500">{kpi.label}</span>
            </div>
            <p className={`font-heading text-xl ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        {/* Orders by Status */}
        <div className="bg-white border border-nude-200 p-6">
          <h2 className="font-heading text-lg text-daisy-800 mb-6">Orders by Status</h2>
          {Object.keys(stats.ordersByStatus).length === 0 ? (
            <p className="font-body text-sm text-daisy-400">No orders yet</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(stats.ordersByStatus).map(([status, count]) => {
                const pct = stats.totalOrders > 0 ? (count / stats.totalOrders) * 100 : 0;
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-body text-sm text-daisy-700 capitalize">{status}</span>
                      <span className="font-body text-sm font-medium text-daisy-900">{count}</span>
                    </div>
                    <div className="w-full h-2 bg-nude-100 overflow-hidden">
                      <div className={`h-full ${STATUS_COLORS[status] || 'bg-gray-400'} transition-all duration-500`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment Methods */}
        <div className="bg-white border border-nude-200 p-6">
          <h2 className="font-heading text-lg text-daisy-800 mb-6">Payment Methods</h2>
          {Object.keys(stats.paymentMethods).length === 0 ? (
            <p className="font-body text-sm text-daisy-400">No payment data yet</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(stats.paymentMethods).map(([method, count]) => {
                const pct = stats.totalOrders > 0 ? (count / stats.totalOrders) * 100 : 0;
                const methodColors: Record<string, string> = {
                  razorpay: 'bg-blue-400', upi_manual: 'bg-green-400',
                  whatsapp: 'bg-emerald-400', cod: 'bg-yellow-400', unknown: 'bg-gray-400',
                };
                const methodLabels: Record<string, string> = {
                  razorpay: 'Razorpay', upi_manual: 'UPI Manual',
                  whatsapp: 'WhatsApp', cod: 'Cash on Delivery', unknown: 'Unknown',
                };
                return (
                  <div key={method}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-body text-sm text-daisy-700">{methodLabels[method] || method}</span>
                      <span className="font-body text-sm font-medium text-daisy-900">{count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full h-2 bg-nude-100 overflow-hidden">
                      <div className={`h-full ${methodColors[method] || 'bg-gray-400'} transition-all duration-500`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white border border-nude-200 p-6">
          <h2 className="font-heading text-lg text-daisy-800 mb-6">Top Products</h2>
          {stats.topProducts.length === 0 ? (
            <p className="font-body text-sm text-daisy-400">No product data yet</p>
          ) : (
            <div className="space-y-3">
              {stats.topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="font-heading text-lg text-daisy-300 w-6">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm text-daisy-900 truncate">{p.name}</p>
                  </div>
                  <span className="font-body text-sm font-medium text-daisy-700">{p.count} sold</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white border border-nude-200 p-6">
          <h2 className="font-heading text-lg text-daisy-800 mb-6">Recent Orders</h2>
          {stats.recentOrders.length === 0 ? (
            <p className="font-body text-sm text-daisy-400">No orders yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-nude-200">
                    {['Date', 'Amount', 'Status'].map(h => (
                      <th key={h} className="text-left pb-2 font-body text-[10px] tracking-widest uppercase text-daisy-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-nude-100">
                  {stats.recentOrders.map((o, i) => (
                    <tr key={i} className="hover:bg-nude-50 transition-colors">
                      <td className="py-2.5 font-body text-sm text-daisy-600">{o.date}</td>
                      <td className="py-2.5 font-body text-sm font-medium text-daisy-900">₹{o.total?.toLocaleString('en-IN')}</td>
                      <td className="py-2.5">
                        <span className={`font-body text-xs px-2 py-0.5 capitalize ${
                          o.status === 'delivered' ? 'bg-green-100 text-green-700' :
                          o.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
