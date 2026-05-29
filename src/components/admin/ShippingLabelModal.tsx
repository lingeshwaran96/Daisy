// src/components/admin/ShippingLabelModal.tsx
'use client';

import { useState } from 'react';
import { X, Printer, Download, Share2, Copy, Check, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

type ShippingLabelModalProps = {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  items: any[];
};

export default function ShippingLabelModal({ isOpen, onClose, order, items }: ShippingLabelModalProps) {
  const [labelSize, setLabelSize] = useState<'4x6' | 'a6' | 'compact'>('4x6');
  const [showItems, setShowItems] = useState(true);
  const [showSender, setShowSender] = useState(true);
  const [copiedText, setCopiedText] = useState(false);
  const [customNote, setCustomNote] = useState('');

  if (!isOpen || !order) return null;

  const rawAddr = order.shipping_address || {};
  const addr = {
    fullName: rawAddr.fullName || rawAddr.full_name || 'N/A',
    phone: rawAddr.phone || 'N/A',
    addressLine1: rawAddr.addressLine1 || rawAddr.address_line1 || '',
    addressLine2: rawAddr.addressLine2 || rawAddr.address_line2 || '',
    city: rawAddr.city || '',
    state: rawAddr.state || '',
    pincode: rawAddr.pincode || '',
    country: rawAddr.country || 'India',
  };
  const orderNumber = order.order_number || order.temp_order_number || 'N/A';
  const paymentMethod = order.payment_method || 'WhatsApp Checkout';
  const paymentStatus = order.payment_status || 'Verified';
  const isCOD = paymentMethod.toLowerCase() === 'cod' || paymentMethod.toLowerCase() === 'cash on delivery';
  const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(orderNumber)}&scale=3&rotate=N&includetext`;

  const senderDetails = {
    name: 'DAISY LUXURY JEWELLERY',
    phone: '+91 86103 44774',
    address: 'No. 4, Walajabad Road, Kanchipuram, Tamil Nadu - 631605',
  };

  // Build a fully self-contained HTML string for the label
  function buildLabelHTML(): string {
    let pageSize = 'size: 4in 6in; margin: 0;';
    let containerW = 'width:384px; min-height:576px;';
    if (labelSize === 'a6') {
      pageSize = 'size: 105mm 148mm; margin: 0;';
      containerW = 'width:340px; min-height:480px;';
    }
    if (labelSize === 'compact') {
      pageSize = 'size: 4in 3in; margin: 0;';
      containerW = 'width:384px; min-height:260px;';
    }

    const itemsHTML = showItems && labelSize !== 'compact'
      ? `
        <div style="border-top:2px solid #000; padding:10px 0;">
          <div style="font-size:9px; font-weight:700; color:#666; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:6px;">Items Ordered</div>
          <table style="width:100%; border-collapse:collapse; font-size:12px;">
            ${items.map((i: any) => `
              <tr>
                <td style="padding:3px 0; font-weight:600;">${i.product_name || i.name}${i.variant ? ` (${i.variant})` : ''}</td>
                <td style="padding:3px 0; text-align:right; font-weight:700; white-space:nowrap;">×${i.quantity}</td>
              </tr>
            `).join('')}
          </table>
        </div>
      ` : '';

    const senderHTML = showSender
      ? `
        <div style="border-top:2px solid #000; padding:10px 0 0;">
          <div style="font-size:9px; font-weight:700; color:#666; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:4px;">From / Return Address</div>
          <div style="font-size:11px; font-weight:700; line-height:1.4;">${senderDetails.name}</div>
          <div style="font-size:11px; line-height:1.4;">Tel: ${senderDetails.phone}</div>
          <div style="font-size:10px; color:#444; line-height:1.4;">${senderDetails.address}</div>
        </div>
      ` : '';

    const noteHTML = customNote
      ? `<div style="border-top:1px dashed #000; margin-top:8px; padding-top:6px; font-size:10px; font-style:italic; text-align:center; font-weight:600;">⚠ ${customNote}</div>`
      : '';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Shipping Label - ${orderNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
    @page { ${pageSize} }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
      background: #fff;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  </style>
</head>
<body>
  <div style="${containerW} border:2.5px solid #000; padding:16px; display:flex; flex-direction:column; background:#fff;">
    
    <!-- Header Row -->
    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2.5px solid #000; padding-bottom:10px; margin-bottom:10px;">
      <div style="font-weight:900; font-size:24px; letter-spacing:5px; text-transform:uppercase;">DAISY</div>
      <div style="border:2.5px solid #000; font-weight:900; font-size:13px; padding:4px 10px; text-transform:uppercase; letter-spacing:1px;">
        ${isCOD ? 'COD' : 'PREPAID'}
      </div>
    </div>

    ${labelSize !== 'compact' ? `
    <!-- Barcode Section -->
    <div style="display:flex; flex-direction:column; align-items:center; border-bottom:2.5px solid #000; padding-bottom:10px; margin-bottom:10px;">
      <img src="${barcodeUrl}" alt="barcode" style="height:52px; max-width:100%; object-fit:contain;" onerror="this.style.display='none'" />
      <div style="font-family:'Courier New',monospace; font-size:13px; font-weight:800; margin-top:4px; letter-spacing:2px;">${orderNumber}</div>
    </div>
    ` : `
    <div style="border-bottom:2.5px solid #000; padding-bottom:8px; margin-bottom:8px;">
      <div style="font-family:'Courier New',monospace; font-size:12px; font-weight:800; letter-spacing:1px;">#${orderNumber}</div>
    </div>
    `}

    <!-- Ship To -->
    <div style="border-bottom:2.5px solid #000; padding-bottom:12px; margin-bottom:10px; flex:1;">
      <div style="font-size:9px; font-weight:700; color:#666; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:6px;">Ship To</div>
      <div style="font-size:18px; font-weight:900; margin-bottom:4px; line-height:1.2;">${addr.fullName}</div>
      <div style="font-size:14px; font-weight:700; margin-bottom:8px; color:#222;">📞 ${addr.phone}</div>
      <div style="font-size:13px; font-weight:600; line-height:1.5; color:#333;">
        ${addr.addressLine1}${addr.addressLine2 ? ', ' + addr.addressLine2 : ''}
      </div>
      <div style="font-size:13px; font-weight:600; line-height:1.5; color:#333;">
        ${addr.city}, ${addr.state}
      </div>
      <div style="display:inline-block; border:2px solid #000; font-weight:900; font-size:16px; padding:4px 10px; margin-top:8px; letter-spacing:1px;">
        PIN: ${addr.pincode}
      </div>
    </div>

    ${itemsHTML}
    ${senderHTML}
    ${noteHTML}
  </div>

  <script>
    // Wait for barcode image to load before printing
    const img = document.querySelector('img');
    if (img && !img.complete) {
      img.onload = function() { window.print(); };
      img.onerror = function() { window.print(); };
      setTimeout(function() { window.print(); }, 2000);
    } else {
      setTimeout(function() { window.print(); }, 500);
    }
  </script>
</body>
</html>`;
  }

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) { toast.error('Please allow popups to print labels'); return; }
    win.document.write(buildLabelHTML());
    win.document.close();
  };

  const handleCopyText = () => {
    const text = `*DAISY LUXURY — SHIPPING DETAILS*
━━━━━━━━━━━━━━━━━━━━
Order #: ${orderNumber}
Payment: ${isCOD ? 'COD' : 'Prepaid'} (${paymentStatus})
━━━━━━━━━━━━━━━━━━━━
📦 SHIP TO:
${addr.fullName}
📞 ${addr.phone}
${addr.addressLine1}${addr.addressLine2 ? ', ' + addr.addressLine2 : ''}
${addr.city}, ${addr.state} - ${addr.pincode}
━━━━━━━━━━━━━━━━━━━━
🛍 ITEMS:
${items.map(i => `• ${i.product_name || i.name} × ${i.quantity}`).join('\n')}
━━━━━━━━━━━━━━━━━━━━
📮 FROM:
${senderDetails.name}
${senderDetails.phone}
${senderDetails.address}`.trim();

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    toast.success('Shipping details copied!');
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleShare = async () => {
    const shareText = `📦 DAISY Shipping Label
Order: ${orderNumber}
To: ${addr.fullName}
Phone: ${addr.phone}
Address: ${addr.addressLine1}${addr.addressLine2 ? ', ' + addr.addressLine2 : ''}, ${addr.city}, ${addr.state} - ${addr.pincode}
Items: ${items.map(i => `${i.product_name || i.name} ×${i.quantity}`).join(', ')}
Payment: ${isCOD ? 'COD' : 'Prepaid'}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: `Shipping Label - ${orderNumber}`, text: shareText });
      } catch (err: any) {
        if (err.name !== 'AbortError') toast.error('Sharing failed');
      }
    } else {
      // Fallback: open WhatsApp with text
      const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      window.open(waUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row my-8 border border-nude-200">
        
        {/* Left — Controls */}
        <div className="w-full md:w-80 bg-nude-50/50 p-6 border-b md:border-b-0 md:border-r border-nude-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Settings className="text-daisy-900" size={20} />
              <h3 className="font-heading text-lg text-daisy-900">Label Controls</h3>
            </div>

            <div className="space-y-5">
              {/* Size Select */}
              <div>
                <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Label Size</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['4x6', 'a6', 'compact'] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => setLabelSize(size)}
                      className={`py-2 px-1 text-center font-body text-xs rounded border transition-all ${
                        labelSize === size
                          ? 'bg-daisy-900 text-cream border-daisy-900 font-semibold'
                          : 'bg-white border-nude-200 text-daisy-600 hover:border-daisy-400'
                      }`}
                    >
                      {size === '4x6' ? '4" × 6"' : size === 'a6' ? 'A6' : 'Compact'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={showItems} onChange={(e) => setShowItems(e.target.checked)}
                    className="accent-daisy-900 h-4 w-4 rounded" />
                  <span className="font-body text-xs text-daisy-700 select-none">Show ordered items</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={showSender} onChange={(e) => setShowSender(e.target.checked)}
                    className="accent-daisy-900 h-4 w-4 rounded" />
                  <span className="font-body text-xs text-daisy-700 select-none">Show return address</span>
                </label>
              </div>

              {/* Custom Note */}
              <div>
                <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Custom Note</label>
                <textarea value={customNote} onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="e.g. Fragile, Handle with care"
                  className="w-full px-3 py-2 border border-nude-200 rounded font-body text-xs text-daisy-900 placeholder-daisy-300 focus:border-daisy-400 outline-none resize-none h-16" />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-5 border-t border-nude-200 mt-4">
            <button onClick={handlePrint}
              className="w-full flex items-center justify-center gap-2 bg-daisy-900 hover:bg-daisy-950 text-cream font-body text-xs font-semibold tracking-wider uppercase py-3 rounded-lg shadow-md hover:shadow-lg transition-all">
              <Printer size={15} /> Print Label
            </button>
            <button onClick={handlePrint}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-nude-50 border border-nude-200 text-daisy-800 font-body text-xs font-semibold py-2.5 rounded-lg transition-all">
              <Download size={15} /> Save as PDF
            </button>
            <button onClick={handleShare}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-nude-50 border border-nude-200 text-daisy-800 font-body text-xs font-semibold py-2.5 rounded-lg transition-all">
              <Share2 size={15} /> Share Label
            </button>
            <button onClick={handleCopyText}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-nude-50 border border-nude-200 text-daisy-800 font-body text-xs font-semibold py-2.5 rounded-lg transition-all">
              {copiedText ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
              {copiedText ? 'Copied!' : 'Copy Shipping Info'}
            </button>
          </div>
        </div>

        {/* Right — Live Preview */}
        <div className="flex-1 bg-nude-100/50 p-6 md:p-8 flex flex-col items-center relative min-h-[520px]">
          <button onClick={onClose}
            className="absolute top-4 right-4 p-2 text-daisy-400 hover:text-daisy-900 transition-colors bg-white rounded-full border border-nude-200 shadow-sm">
            <X size={18} />
          </button>

          <span className="font-body text-[10px] tracking-widest uppercase text-daisy-400 mb-4 block">Live Label Preview</span>

          {/* Preview Container */}
          <div className={`bg-white border-[2.5px] border-black shadow-lg flex flex-col font-sans text-black select-none transition-all duration-300 ${
            labelSize === '4x6' ? 'w-[320px] min-h-[480px] p-4' :
            labelSize === 'a6' ? 'w-[280px] min-h-[396px] p-3.5' :
            'w-[320px] min-h-[200px] p-3'
          }`} style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* Header */}
            <div className="flex justify-between items-center border-b-[2.5px] border-black pb-2.5 mb-2.5">
              <span style={{ fontWeight: 900, fontSize: '20px', letterSpacing: '4px' }}>DAISY</span>
              <span className="border-[2.5px] border-black px-2.5 py-0.5" style={{ fontWeight: 900, fontSize: '11px', letterSpacing: '1px' }}>
                {isCOD ? 'COD' : 'PREPAID'}
              </span>
            </div>

            {/* Barcode */}
            {labelSize !== 'compact' && (
              <div className="flex flex-col items-center border-b-[2.5px] border-black pb-2.5 mb-2.5">
                <img src={barcodeUrl} alt="barcode" className="h-10 w-full object-contain"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                <span style={{ fontFamily: "'Courier New', monospace", fontSize: '11px', fontWeight: 800, letterSpacing: '1.5px', marginTop: '3px' }}>
                  {orderNumber}
                </span>
              </div>
            )}
            {labelSize === 'compact' && (
              <div className="border-b-[2.5px] border-black pb-2 mb-2">
                <span style={{ fontFamily: "'Courier New', monospace", fontSize: '10px', fontWeight: 800, letterSpacing: '1px' }}>
                  #{orderNumber}
                </span>
              </div>
            )}

            {/* Ship To */}
            <div className="border-b-[2.5px] border-black pb-3 mb-2.5 flex-1">
              <div style={{ fontSize: '8px', fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '4px' }}>Ship To</div>
              <div style={{ fontSize: '15px', fontWeight: 900, marginBottom: '3px', lineHeight: 1.2 }}>{addr.fullName}</div>
              <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#222' }}>📞 {addr.phone}</div>
              <div style={{ fontSize: '11px', fontWeight: 600, lineHeight: 1.5, color: '#333' }}>
                {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600, lineHeight: 1.5, color: '#333' }}>
                {addr.city}, {addr.state}
              </div>
              <span className="inline-block border-2 border-black mt-2" style={{ fontWeight: 900, fontSize: '13px', padding: '3px 8px', letterSpacing: '1px' }}>
                PIN: {addr.pincode}
              </span>
            </div>

            {/* Items */}
            {showItems && labelSize !== 'compact' && (
              <div className="border-b-[2.5px] border-black pb-2 mb-2">
                <div style={{ fontSize: '8px', fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '4px' }}>Items</div>
                {items.map((i: any, idx: number) => (
                  <div key={idx} className="flex justify-between" style={{ fontSize: '10px', fontWeight: 600, padding: '1px 0' }}>
                    <span className="truncate" style={{ maxWidth: '200px' }}>{i.product_name || i.name}</span>
                    <span style={{ fontWeight: 700 }}>×{i.quantity}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Sender */}
            {showSender && (
              <div style={{ paddingTop: labelSize === 'compact' ? '0' : '2px' }}>
                <div style={{ fontSize: '8px', fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '2px' }}>From</div>
                <div style={{ fontSize: '9px', fontWeight: 700, lineHeight: 1.3 }}>{senderDetails.name}</div>
                <div style={{ fontSize: '9px', lineHeight: 1.3 }}>Tel: {senderDetails.phone}</div>
                <div style={{ fontSize: '8px', color: '#555', lineHeight: 1.3 }}>{senderDetails.address}</div>
              </div>
            )}

            {/* Note */}
            {customNote && (
              <div style={{ borderTop: '1px dashed #000', marginTop: '6px', paddingTop: '4px', fontSize: '9px', fontStyle: 'italic', textAlign: 'center', fontWeight: 600 }}>
                ⚠ {customNote}
              </div>
            )}
          </div>

          <div className="text-center font-body text-[10px] text-daisy-400 mt-4">
            Click "Print Label" → select your printer or "Save as PDF" for download
          </div>
        </div>
      </div>
    </div>
  );
}
