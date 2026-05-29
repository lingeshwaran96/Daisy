// src/app/admin/pending-orders/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Search, CheckCircle, XCircle, AlertTriangle, Trash2, ArrowRight, Clock, Loader2, MessageCircle, Eye, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import ShippingLabelModal from '@/components/admin/ShippingLabelModal';

type TempOrder = {
  id: string;
  user_id: string | null;
  temp_order_number: string;
  status: string;
  subtotal: number;
  shipping_fee: number;
  total: number;
  shipping_address: any;
  items: any[];
  created_at: string;
  updated_at: string;
  users?: { full_name: string | null; email: string | null; phone: string | null } | null;
};

const STATUS_COLORS: Record<string, string> = {
  pending_verification: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  approved: 'bg-green-100 text-green-700 border-green-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  fraud: 'bg-rose-100 text-rose-800 border-rose-200',
};

const STATUS_ICONS: Record<string, any> = {
  pending_verification: Clock,
  approved: CheckCircle,
  rejected: XCircle,
  fraud: AlertTriangle,
};

export default function AdminPendingOrders() {
  const [tempOrders, setTempOrders] = useState<TempOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [labelOrder, setLabelOrder] = useState<TempOrder | null>(null);

  async function fetchTempOrders() {
    setLoading(true);
    let q = supabase
      .from('temp_orders')
      .select('*, users(full_name, email, phone)')
      .order('created_at', { ascending: false });

    if (filter !== 'all') q = q.eq('status', filter);
    if (search) q = q.ilike('temp_order_number', `%${search}%`);

    const { data, error } = await q;
    if (error) console.error('Error fetching temp orders:', error.message);
    setTempOrders((data as TempOrder[]) || []);
    setLoading(false);
  }

  useEffect(() => { fetchTempOrders(); }, [filter, search]);

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('temp_orders_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'temp_orders' }, () => {
        fetchTempOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const approveOrder = async (tempOrder: TempOrder) => {
    setActionLoading(tempOrder.id);
    try {
      // Generate final confirmed order number
      const year = new Date().getFullYear();
      const seq = String(Date.now()).slice(-4);
      const confirmedOrderNumber = `DSY-${year}-${seq}`;

      // Insert into confirmed orders table
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: tempOrder.user_id,
          order_number: confirmedOrderNumber,
          status: 'confirmed',
          payment_method: 'whatsapp',
          payment_status: 'paid',
          subtotal: tempOrder.subtotal,
          shipping_fee: tempOrder.shipping_fee,
          total: tempOrder.total,
          shipping_address: tempOrder.shipping_address,
          notes: `Converted from temp order ${tempOrder.temp_order_number}. Payment verified by admin.`,
        })
        .select()
        .single();

      if (orderError) throw new Error(orderError.message);

      // Insert order items from temp order's items JSON
      if (orderData && tempOrder.items?.length > 0) {
        const orderItems = tempOrder.items.map((item: any) => ({
          order_id: orderData.id,
          product_id: item.productId || null,
          product_name: item.name,
          product_image: item.image || null,
          variant: item.variant || null,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
        }));
        await supabase.from('order_items').insert(orderItems);
      }

      // Update temp order status to approved and store the confirmed order number
      await supabase
        .from('temp_orders')
        .update({ 
          status: 'approved', 
          confirmed_order_number: confirmedOrderNumber,
          updated_at: new Date().toISOString() 
        })
        .eq('id', tempOrder.id);

      toast.success(`✅ Order approved! Confirmed as ${confirmedOrderNumber}`);
      fetchTempOrders();
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve order');
    } finally {
      setActionLoading(null);
    }
  };

  const rejectOrder = async (id: string) => {
    setActionLoading(id);
    await supabase
      .from('temp_orders')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', id);
    toast.success('Order rejected');
    fetchTempOrders();
    setActionLoading(null);
  };

  const markFraud = async (id: string) => {
    setActionLoading(id);
    await supabase
      .from('temp_orders')
      .update({ status: 'fraud', updated_at: new Date().toISOString() })
      .eq('id', id);
    toast.success('Marked as fraud');
    fetchTempOrders();
    setActionLoading(null);
  };

  const deleteTemp = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this temporary order?')) return;
    setActionLoading(id);
    await supabase.from('temp_orders').delete().eq('id', id);
    toast.success('Temporary order deleted');
    fetchTempOrders();
    setActionLoading(null);
  };

  const filterTabs = [
    { key: 'all', label: 'All' },
    { key: 'pending_verification', label: 'Pending' },
    { key: 'approved', label: 'Verified' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'fraud', label: 'Fraud' },
  ];

  const counts = {
    all: tempOrders.length,
    pending_verification: tempOrders.filter(o => o.status === 'pending_verification').length,
    approved: tempOrders.filter(o => o.status === 'approved').length,
    rejected: tempOrders.filter(o => o.status === 'rejected').length,
    fraud: tempOrders.filter(o => o.status === 'fraud').length,
  };

  return (
    <div className="p-6 md:p-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-4xl text-daisy-900 font-light">Payment Verification</h1>
        <p className="font-body text-sm text-daisy-500 mt-1">
          Review and approve WhatsApp orders after confirming payment
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {filterTabs.map(tab => {
          const count = counts[tab.key as keyof typeof counts] || 0;
          const isActive = filter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`p-4 border transition-all text-left group
                ${isActive ? 'bg-daisy-900 text-cream border-daisy-900 shadow-luxury' : 'bg-white border-nude-200 hover:border-daisy-300'}`}
            >
              <p className={`font-heading text-2xl ${isActive ? 'text-cream' : 'text-daisy-900'}`}>{count}</p>
              <p className={`font-body text-xs capitalize tracking-wide ${isActive ? 'text-cream/70' : 'text-daisy-400'}`}>
                {tab.label}
              </p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-xs">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-daisy-400" />
          <input
            type="text"
            placeholder="Search temp order number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 pr-4 py-3 w-full border border-nude-200 bg-white font-body text-sm outline-none focus:border-daisy-400 transition-colors"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-daisy-400" />
          </div>
        ) : tempOrders.length === 0 ? (
          <div className="bg-white border border-nude-200 p-12 text-center">
            <Clock size={40} className="text-daisy-200 mx-auto mb-4" />
            <p className="font-body text-sm text-daisy-400">No orders found</p>
          </div>
        ) : (
          tempOrders.map(order => {
            const StatusIcon = STATUS_ICONS[order.status] || Clock;
            const isExpanded = expandedId === order.id;
            const addr = order.shipping_address;
            const isProcessing = actionLoading === order.id;

            return (
              <div key={order.id} className="bg-white border border-nude-200 overflow-hidden transition-all">
                {/* Order Header Row */}
                <div
                  className="flex flex-col md:flex-row md:items-center gap-4 px-5 py-4 cursor-pointer hover:bg-nude-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                >
                  {/* Order Number + Status */}
                  <div className="flex items-center gap-3 min-w-[220px]">
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-body font-medium border ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      <StatusIcon size={12} /> {order.status.replace('_', ' ')}
                    </span>
                    <span className="font-body text-sm font-semibold text-daisy-900">{order.temp_order_number}</span>
                  </div>

                  {/* Customer */}
                  <div className="flex-1">
                    <p className="font-body text-sm text-daisy-800">
                      {order.users?.full_name || addr?.fullName || 'Guest'}
                    </p>
                    <p className="font-body text-xs text-daisy-400">
                      {order.users?.email || addr?.phone || '—'}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <p className="font-heading text-lg text-daisy-900">₹{order.total?.toLocaleString('en-IN')}</p>
                    <p className="font-body text-[10px] text-daisy-400">
                      {new Date(order.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* Expand Icon */}
                  <Eye size={16} className={`text-daisy-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>

                {/* Expanded Detail Panel */}
                {isExpanded && (
                  <div className="border-t border-nude-100 px-5 py-5 bg-nude-50/50">
                    <div className="grid md:grid-cols-3 gap-6">
                      {/* Items */}
                      <div>
                        <h4 className="font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-3">Items Ordered</h4>
                        <div className="space-y-3">
                          {(order.items || []).map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-3 font-body text-xs">
                              {item.image && (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-12 h-12 object-cover border border-nude-200"
                                />
                              )}
                              <div className="flex-1">
                                <p className="text-daisy-900 font-medium">{item.name}</p>
                                <p className="text-daisy-450 text-[10px]">
                                  {item.variant ? `Variant: ${item.variant} | ` : ''}Qty: {item.quantity} × ₹{item.price}
                                </p>
                              </div>
                              <span className="text-daisy-900 font-semibold shrink-0">
                                ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                              </span>
                            </div>
                          ))}
                          <div className="border-t border-nude-200 pt-2 space-y-1">
                            <div className="flex justify-between font-body text-xs text-daisy-500">
                              <span>Subtotal</span>
                              <span>₹{order.subtotal?.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between font-body text-xs text-daisy-500">
                              <span>Shipping Fee</span>
                              <span>₹{order.shipping_fee?.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="border-t border-nude-100 pt-1 flex justify-between font-body text-xs font-bold text-daisy-900">
                              <span>Total</span>
                              <span>₹{order.total?.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Shipping */}
                      <div>
                        <h4 className="font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-3">Shipping Address</h4>
                        {addr ? (
                          <div className="font-body text-xs text-daisy-700 space-y-0.5">
                            <p className="font-medium text-daisy-900">{addr.fullName || addr.full_name}</p>
                            <p>{addr.phone}</p>
                            <p>{addr.addressLine1 || addr.address_line1}</p>
                            {(addr.addressLine2 || addr.address_line2) && <p>{addr.addressLine2 || addr.address_line2}</p>}
                            <p>{addr.city}, {addr.state} – {addr.pincode}</p>
                          </div>
                        ) : (
                          <p className="font-body text-xs text-daisy-400">No address provided</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div>
                        <h4 className="font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-3">Admin Actions</h4>
                        <div className="space-y-2">
                          {order.status === 'pending_verification' && (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); approveOrder(order); }}
                                disabled={isProcessing}
                                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 px-4 font-body text-xs font-semibold transition-colors disabled:opacity-50"
                              >
                                {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                Approve Payment
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); rejectOrder(order.id); }}
                                disabled={isProcessing}
                                className="w-full flex items-center justify-center gap-2 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 py-2.5 px-4 font-body text-xs font-semibold transition-colors disabled:opacity-50"
                              >
                                <XCircle size={14} /> Reject Payment
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); markFraud(order.id); }}
                                disabled={isProcessing}
                                className="w-full flex items-center justify-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 py-2.5 px-4 font-body text-xs font-semibold transition-colors disabled:opacity-50"
                              >
                                <AlertTriangle size={14} /> Mark as Fraud
                              </button>
                            </>
                          )}
                          {order.status === 'approved' && (
                            <>
                              <div className="bg-green-50 border border-green-200 p-3 text-center">
                                <CheckCircle size={20} className="text-green-600 mx-auto mb-1" />
                                <p className="font-body text-xs text-green-700 font-medium">Payment Verified</p>
                                <p className="font-body text-[10px] text-green-500">Order moved to confirmed orders</p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLabelOrder(order);
                                }}
                                className="w-full flex items-center justify-center gap-2 bg-daisy-900 hover:bg-daisy-950 text-cream py-2.5 px-4 font-body text-xs font-semibold transition-colors mt-2"
                              >
                                <Printer size={14} /> Print Shipping Label
                              </button>
                            </>
                          )}
                          {(order.status === 'rejected' || order.status === 'fraud') && (
                            <div className={`p-3 text-center border ${order.status === 'fraud' ? 'bg-rose-50 border-rose-200' : 'bg-red-50 border-red-200'}`}>
                              <p className="font-body text-xs font-medium text-red-700">{order.status === 'fraud' ? '⚠️ Marked as Fraud' : 'Payment Rejected'}</p>
                            </div>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteTemp(order.id); }}
                            disabled={isProcessing}
                            className="w-full flex items-center justify-center gap-2 border border-nude-200 text-daisy-400 hover:text-red-500 hover:border-red-200 py-2 px-4 font-body text-[11px] transition-colors disabled:opacity-50"
                          >
                            <Trash2 size={12} /> Delete Temporary Order
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      <ShippingLabelModal
        isOpen={!!labelOrder}
        onClose={() => setLabelOrder(null)}
        order={labelOrder}
        items={labelOrder?.items || []}
      />
    </div>
  );
}
