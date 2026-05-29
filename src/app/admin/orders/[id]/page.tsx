// src/app/admin/orders/[id]/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer, FileText, Loader2, Package, Bell, Truck, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import ShippingLabelModal from '@/components/admin/ShippingLabelModal';

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

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState('');
  const [tracking, setTracking] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [courierName, setCourierName] = useState('');
  const [labelModalOpen, setLabelModalOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: o } = await supabase.from('orders').select('*, users(full_name, email, phone)').eq('id', id).single();
      const { data: oi } = await supabase.from('order_items').select('*').eq('order_id', id);
      setOrder(o); setItems(oi || []);
      setStatus(o?.status || '');
      setTracking(o?.tracking_number || '');
      setTrackingUrl(o?.tracking_url || '');
      setLoading(false);
    }
    load();
  }, [id]);

  const updateOrder = async () => {
    if (!order) return;

    // Validate shipped status requires tracking info
    if (status === 'shipped' && !tracking) {
      toast.error('Please enter a tracking number for shipped orders');
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch('/api/notifications/order-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: id,
          newStatus: status,
          courierName: courierName || undefined,
          trackingNumber: tracking || undefined,
          trackingUrl: trackingUrl || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(`Failed to update: ${data.error}`);
      } else {
        setOrder((o: any) => ({
          ...o,
          status,
          tracking_number: tracking,
          tracking_url: trackingUrl,
        }));
        toast.success(
          <div>
            <p className="font-medium">Order updated to {STATUS_LABELS[status]}</p>
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
      toast.error('Network error');
    }
    setUpdating(false);
  };

  const printLabel = () => {
    const win = window.open('', '_blank');
    if (!win || !order) return;
    const addr = order.shipping_address;
    win.document.write(`<!DOCTYPE html><html><head><title>Shipping Label</title>
      <style>
        body{font-family:Arial,sans-serif;padding:20px;max-width:400px;margin:0 auto}
        .border{border:2px solid #000;padding:16px;margin-bottom:12px}
        .logo{font-size:24px;font-weight:bold;letter-spacing:6px;text-align:center;margin-bottom:12px}
        .label{font-size:10px;color:#666;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px}
        .value{font-size:14px;font-weight:600;margin-bottom:8px}
        .big{font-size:18px;font-weight:bold}
        .divider{border-top:1px dashed #999;margin:12px 0}
        h3{margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:2px}
        @media print{body{max-width:100%}.no-print{display:none}}
      </style></head><body>
      <div class="border">
        <div class="logo">DAISY</div>
        <div class="divider"></div>
        <div class="label">Order ID</div>
        <div class="value big">#${order.order_number}</div>
        <div class="label">Date</div>
        <div class="value">${new Date(order.created_at).toLocaleDateString('en-IN')}</div>
        <div class="divider"></div>
        <h3>Ship To</h3>
        <div class="value">${addr.full_name || addr.fullName}</div>
        <div class="value">${addr.phone}</div>
        <div class="value">${addr.address_line1 || addr.addressLine1}${(addr.address_line2 || addr.addressLine2) ? ', ' + (addr.address_line2 || addr.addressLine2) : ''}</div>
        <div class="value">${addr.city}, ${addr.state} - ${addr.pincode}</div>
        <div class="value">${addr.country || 'India'}</div>
        <div class="divider"></div>
        <h3>Items</h3>
        ${items.map(i => `<div class="value">${i.product_name} × ${i.quantity}</div>`).join('')}
        <div class="divider"></div>
        <div class="label">Total Amount</div>
        <div class="value big">₹${order.total?.toLocaleString('en-IN')}</div>
        <div class="label">Payment</div>
        <div class="value">${order.payment_method} — ${order.payment_status}</div>
        ${tracking ? `<div class="divider"></div><div class="label">Tracking</div><div class="value">${tracking}</div>` : ''}
      </div>
      <script>window.print();window.close();</script></body></html>`);
    win.document.close();
  };

  const downloadInvoice = async () => {
    const { default: jsPDF } = await import('jspdf');
    if (!order) return;
    const doc = new jsPDF();
    const addr = order.shipping_address;
    let y = 20;
    doc.setFontSize(22); doc.setFont('helvetica','bold');
    doc.text('DAISY', 105, y, { align: 'center' }); y += 8;
    doc.setFontSize(10); doc.setFont('helvetica','normal');
    doc.text('INVOICE', 105, y, { align: 'center' }); y += 14;
    doc.setFontSize(11); doc.setFont('helvetica','bold');
    doc.text(`Order #${order.order_number}`, 14, y); y += 6;
    doc.setFont('helvetica','normal'); doc.setFontSize(9);
    doc.text(`Date: ${new Date(order.created_at).toLocaleDateString('en-IN')}`, 14, y); y += 14;
    doc.setFont('helvetica','bold'); doc.text('Bill To:', 14, y); y += 5;
    doc.setFont('helvetica','normal');
    doc.text(`${addr.full_name || addr.fullName}`, 14, y); y += 5;
    doc.text(`${addr.phone}`, 14, y); y += 5;
    doc.text(`${addr.address_line1 || addr.addressLine1}`, 14, y); y += 5;
    doc.text(`${addr.city}, ${addr.state} - ${addr.pincode}`, 14, y); y += 14;
    doc.setFont('helvetica','bold');
    doc.text('Item', 14, y); doc.text('Qty', 120, y); doc.text('Price', 145, y); doc.text('Total', 170, y); y += 4;
    doc.setLineWidth(0.3); doc.line(14, y, 196, y); y += 5;
    doc.setFont('helvetica','normal');
    items.forEach(item => {
      doc.text(item.product_name.substring(0, 40), 14, y);
      doc.text(String(item.quantity), 120, y);
      doc.text(`Rs.${item.price}`, 145, y);
      doc.text(`Rs.${item.total}`, 170, y);
      y += 7;
    });
    doc.line(14, y, 196, y); y += 7;
    if (order.discount > 0) { doc.text('Discount:', 130, y); doc.text(`-Rs.${order.discount}`, 170, y); y += 6; }
    doc.text('Shipping:', 130, y); doc.text(order.shipping_fee > 0 ? `Rs.${order.shipping_fee}` : 'FREE', 170, y); y += 6;
    doc.setFont('helvetica','bold');
    doc.text('Total:', 130, y); doc.text(`Rs.${order.total}`, 170, y);
    doc.save(`DAISY-Invoice-${order.order_number}.pdf`);
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 size={24} className="text-daisy-400 animate-spin"/></div>;
  if (!order) return <div className="p-10 text-center font-body text-daisy-400">Order not found</div>;

  const addr = order.shipping_address;

  return (
    <div className="p-6 md:p-10 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-2 text-daisy-400 hover:text-daisy-900 transition-colors"><ArrowLeft size={20}/></button>
        <div>
          <h1 className="font-heading text-3xl text-daisy-900 font-light">Order #{order.order_number}</h1>
          <p className="font-body text-sm text-daisy-400">{new Date(order.created_at).toLocaleString('en-IN')}</p>
        </div>
        <div className="ml-auto flex gap-3">
          <button onClick={() => setLabelModalOpen(true)} className="flex items-center gap-2 btn-outline text-sm py-2 px-4"><Printer size={16}/> Print Label</button>
          <button onClick={downloadInvoice} className="flex items-center gap-2 btn-primary text-sm py-2 px-4"><FileText size={16}/> Invoice PDF</button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Items */}
          <section className="bg-white border border-nude-200 p-5">
            <h2 className="font-heading text-lg text-daisy-800 mb-4">Order Items</h2>
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-4 py-2 border-b border-nude-100 last:border-0">
                  <div className="flex-1">
                    <p className="font-body text-sm font-medium text-daisy-900">{item.product_name}</p>
                    {item.variant && <p className="font-body text-xs text-daisy-400">{item.variant}</p>}
                  </div>
                  <p className="font-body text-sm text-daisy-500">× {item.quantity}</p>
                  <p className="font-body text-sm font-medium text-daisy-900">₹{item.total?.toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-nude-200 space-y-1">
              <div className="flex justify-between font-body text-sm text-daisy-500"><span>Subtotal</span><span>₹{order.subtotal?.toLocaleString('en-IN')}</span></div>
              {order.discount > 0 && <div className="flex justify-between font-body text-sm text-green-600"><span>Discount</span><span>-₹{order.discount?.toLocaleString('en-IN')}</span></div>}
              <div className="flex justify-between font-body text-sm text-daisy-500"><span>Shipping</span><span>{order.shipping_fee > 0 ? `₹${order.shipping_fee}` : 'FREE'}</span></div>
              <div className="flex justify-between font-heading text-lg text-daisy-900 pt-2 border-t border-nude-200"><span>Total</span><span>₹{order.total?.toLocaleString('en-IN')}</span></div>
            </div>
          </section>

          {/* Update Order */}
          <section className="bg-white border border-nude-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-heading text-lg text-daisy-800">Update Order</h2>
              <Bell size={14} className="text-daisy-300" />
              <span className="font-body text-[10px] text-daisy-400">Notifications sent automatically</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)}
                  className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 bg-white">
                  {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Courier Name</label>
                <input type="text" value={courierName} onChange={e => setCourierName(e.target.value)} placeholder="e.g. DTDC, Delhivery, BlueDart"
                  className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400"/>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Tracking Number</label>
                <input type="text" value={tracking} onChange={e => setTracking(e.target.value)} placeholder="e.g. DTDC123456789"
                  className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400"/>
              </div>
              <div>
                <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Tracking URL</label>
                <input type="text" value={trackingUrl} onChange={e => setTrackingUrl(e.target.value)} placeholder="https://tracking.example.com/..."
                  className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400"/>
              </div>
            </div>

            {/* Status indicator info box */}
            {status === 'shipped' && !tracking && (
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 font-body text-xs text-orange-700 flex items-center gap-2">
                <Truck size={14} /> A tracking number is required for the Shipped status. Customer will receive courier details.
              </div>
            )}

            <button onClick={updateOrder} disabled={updating} className="btn-primary flex items-center gap-2 disabled:opacity-60">
              {updating ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>} Update & Notify Customer
            </button>
          </section>
        </div>

        <div className="space-y-6">
          {/* Status */}
          <section className="bg-white border border-nude-200 p-5">
            <h2 className="font-heading text-lg text-daisy-800 mb-4">Status</h2>
            <span className={`font-body text-xs px-3 py-1.5 ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
              {STATUS_LABELS[order.status] || order.status}
            </span>
            <div className="mt-4 space-y-1">
              <div className="flex justify-between font-body text-xs text-daisy-500"><span>Payment</span><span className={order.payment_status==='paid'?'text-green-600':'text-yellow-600'}>{order.payment_status}</span></div>
              <div className="flex justify-between font-body text-xs text-daisy-500"><span>Method</span><span>{order.payment_method}</span></div>
              {order.tracking_number && <div className="flex justify-between font-body text-xs text-daisy-500"><span>Tracking</span><span>{order.tracking_number}</span></div>}
              {order.tracking_url && (
                <div className="flex justify-between font-body text-xs text-daisy-500">
                  <span>Track Link</span>
                  <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View →</a>
                </div>
              )}
            </div>
          </section>

          {/* Customer */}
          <section className="bg-white border border-nude-200 p-5">
            <h2 className="font-heading text-lg text-daisy-800 mb-4">Customer</h2>
            <p className="font-body text-sm font-medium text-daisy-900">{order.users?.full_name || addr.full_name || addr.fullName}</p>
            <p className="font-body text-xs text-daisy-400">{order.users?.email}</p>
            <p className="font-body text-xs text-daisy-400">{order.users?.phone || addr.phone}</p>
          </section>

          {/* Address */}
          <section className="bg-white border border-nude-200 p-5">
            <h2 className="font-heading text-lg text-daisy-800 mb-3">Shipping Address</h2>
            <div className="font-body text-sm text-daisy-700 space-y-0.5">
              <p className="font-medium">{addr.full_name || addr.fullName}</p>
              <p>{addr.phone}</p>
              <p>{addr.address_line1 || addr.addressLine1}</p>
              {(addr.address_line2 || addr.addressLine2) && <p>{addr.address_line2 || addr.addressLine2}</p>}
              <p>{addr.city}, {addr.state} – {addr.pincode}</p>
              <p>{addr.country || 'India'}</p>
            </div>
          </section>
        </div>
      </div>
      <ShippingLabelModal
        isOpen={labelModalOpen}
        onClose={() => setLabelModalOpen(false)}
        order={order}
        items={items}
      />
    </div>
  );
}
