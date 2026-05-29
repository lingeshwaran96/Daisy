// src/app/admin/orders/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Search, MessageCircle, Bell, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

type Order = {
  id: string; order_number: string; status: string; payment_status: string;
  payment_method: string; total: number; created_at: string;
  users?: { full_name: string | null; email: string | null } | null;
  shipping_address: any;
};

const STATUSES = ['pending','confirmed','processing','packed','shipped','out_for_delivery','delivered','cancelled','refunded'];
const STATUS_LABELS: Record<string,string> = {
  pending:'Pending', confirmed:'Confirmed', processing:'Processing',
  packed:'Packed', shipped:'Shipped', out_for_delivery:'Out for Delivery',
  delivered:'Delivered', cancelled:'Cancelled', refunded:'Refunded',
};
const STATUS_COLORS: Record<string,string> = {
  pending:'bg-yellow-100 text-yellow-700', confirmed:'bg-blue-100 text-blue-700',
  processing:'bg-purple-100 text-purple-700', packed:'bg-pink-100 text-pink-700',
  shipped:'bg-indigo-100 text-indigo-700', out_for_delivery:'bg-orange-100 text-orange-700',
  delivered:'bg-green-100 text-green-700', cancelled:'bg-red-100 text-red-700',
  refunded:'bg-gray-100 text-gray-700',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updating, setUpdating] = useState<string | null>(null);

  async function fetchOrders() {
    setLoading(true);
    let q = supabase.from('orders').select('*, users(full_name, email)').order('created_at', { ascending: false });
    if (statusFilter !== 'all') q = q.eq('status', statusFilter);
    if (search) q = q.ilike('order_number', `%${search}%`);
    const { data } = await q;
    setOrders((data as Order[]) || []);
    setLoading(false);
  }

  useEffect(() => { fetchOrders(); }, [statusFilter, search]);

  const updateStatus = async (id: string, newStatus: string) => {
    const order = orders.find(o => o.id === id);
    if (!order || order.status === newStatus) return;

    setUpdating(id);
    try {
      const res = await fetch('/api/notifications/order-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: id, newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(`Failed to update: ${data.error}`);
      } else {
        setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
        toast.success(
          <div>
            <p className="font-medium">Status updated to {STATUS_LABELS[newStatus]}</p>
            <p className="text-xs opacity-70 mt-0.5">
              {data.notifications?.inApp ? '✅ In-App' : '❌ In-App'}
              {' · '}
              {data.notifications?.whatsapp ? '✅ WhatsApp' : '⏭ WhatsApp'}
              {' · '}
              {data.notifications?.email ? '✅ Email' : '⏭ Email'}
            </p>
          </div>,
          { duration: 4000 }
        );
      }
    } catch (err: any) {
      toast.error('Network error updating status');
    }
    setUpdating(null);
  };

  return (
    <div className="p-6 md:p-10">
      <div className="mb-8">
        <h1 className="font-heading text-4xl text-daisy-900 font-light">Orders</h1>
        <p className="font-body text-sm text-daisy-500 mt-1">{orders.length} orders</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-daisy-400" />
          <input type="text" placeholder="Search order number..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-10 pr-4 py-3 border border-nude-200 bg-white font-body text-sm text-daisy-900 placeholder-daisy-300 outline-none focus:border-daisy-400 transition-colors w-full md:w-64" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', ...STATUSES].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 font-body text-[10px] capitalize tracking-wide transition-colors border ${
                statusFilter === s ? 'bg-daisy-900 text-cream border-daisy-900' : 'border-nude-200 text-daisy-600 hover:border-daisy-400'
              }`}>
              {s === 'all' ? 'All' : STATUS_LABELS[s] || s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-nude-200 overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-nude-50 border-b border-nude-200">
            <tr>
              {['Order #','Customer','Amount','Payment','Status','Date','Update Status'].map(h => (
                <th key={h} className="text-left px-5 py-3 font-body text-[10px] tracking-widest uppercase text-daisy-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-nude-100">
            {loading ? (
              Array.from({length:5}).map((_,i) => (
                <tr key={i}>{Array.from({length:7}).map((_,j) => <td key={j} className="px-5 py-4"><div className="skeleton h-4 w-20"/></td>)}</tr>
              ))
            ) : orders.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-12 text-center font-body text-sm text-daisy-400">No orders found</td></tr>
            ) : orders.map(order => (
              <tr key={order.id} className="hover:bg-nude-50 transition-colors">
                <td className="px-5 py-4 font-body text-sm font-medium text-daisy-900">#{order.order_number}</td>
                <td className="px-5 py-4">
                  <p className="font-body text-sm text-daisy-900">{order.users?.full_name || 'Guest'}</p>
                  <p className="font-body text-xs text-daisy-400">{order.users?.email}</p>
                  {order.payment_method === 'whatsapp' && (
                    <span className="flex items-center gap-1 font-body text-[10px] text-green-600 mt-0.5">
                      <MessageCircle size={10}/> WhatsApp Order
                    </span>
                  )}
                </td>
                <td className="px-5 py-4 font-body text-sm font-medium text-daisy-900">₹{order.total?.toLocaleString('en-IN')}</td>
                <td className="px-5 py-4">
                  <span className={`font-body text-xs px-2 py-0.5 ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {order.payment_status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className={`font-body text-xs px-2.5 py-1 capitalize ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </td>
                <td className="px-5 py-4 font-body text-xs text-daisy-500">
                  {new Date(order.created_at).toLocaleDateString('en-IN')}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <select value={order.status} disabled={updating === order.id}
                      onChange={e => updateStatus(order.id, e.target.value)}
                      className="border border-nude-200 px-2 py-1.5 font-body text-xs text-daisy-700 outline-none focus:border-daisy-400 bg-white cursor-pointer min-w-[130px]">
                      {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                    </select>
                    {updating === order.id && <Loader2 size={14} className="text-daisy-400 animate-spin" />}
                    <span title="Notifications will be sent automatically">
                      <Bell size={12} className="text-daisy-300" />
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
