// src/app/inbox/page.tsx
'use client';

import { useState } from 'react';
import { Mail, Phone, MessageSquare, Bell, ArrowLeft, Loader2, Calendar, ShieldCheck, ExternalLink, Package } from 'lucide-react';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import CartSidebar from '@/components/cart/CartSidebar';
import SearchOverlay from '@/components/layout/SearchOverlay';

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  channel: string;
  is_read: boolean;
  metadata: any;
  created_at: string;
};

export default function InboxPage() {
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');

  const fetchInbox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.trim()) { setError('Please enter your Phone or Email'); return; }
    
    setLoading(true);
    setError('');
    setNotifications([]);
    
    try {
      const res = await fetch('/api/notifications/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: contact.trim() }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to load inbox');
      } else {
        setNotifications(data.notifications || []);
        setHasSearched(true);
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    }
    setLoading(false);
  };

  return (
    <>
      <AnnouncementBar /><Navbar /><SearchOverlay /><CartSidebar />
      
      <main className="min-h-screen bg-cream pb-20 md:pb-12">
        <div className="max-w-2xl mx-auto px-4 py-12 md:py-20">
          
          {hasSearched && (
            <button onClick={() => { setHasSearched(false); setContact(''); }}
              className="flex items-center gap-2 font-body text-xs text-daisy-600 hover:text-daisy-900 mb-6 transition-colors">
              <ArrowLeft size={14} /> Back to Search
            </button>
          )}

          <div className="text-center mb-10">
            <h1 className="font-heading text-4xl md:text-5xl text-daisy-900 font-light mb-3">Customer Message Box</h1>
            <p className="font-body text-daisy-500">
              Access your official notifications, order confirmations, and status updates instantly
            </p>
          </div>

          {!hasSearched ? (
            <div className="bg-white border border-nude-200 p-8 shadow-sm">
              <div className="flex justify-center mb-6">
                <div className="w-12 h-12 rounded-full bg-daisy-50 text-daisy-700 flex items-center justify-center">
                  <MessageSquare size={24} />
                </div>
              </div>
              
              <form onSubmit={fetchInbox} className="space-y-4">
                <div>
                  <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">
                    Enter Phone Number or Gmail ID
                  </label>
                  <input type="text" value={contact} onChange={e => setContact(e.target.value)}
                    placeholder="e.g. 9876543210 or customer@gmail.com" required
                    className="w-full border border-nude-200 px-4 py-3.5 font-body text-sm text-daisy-900 outline-none focus:border-daisy-400 transition-colors" />
                </div>
                
                {error && <p className="font-body text-xs text-red-500 bg-red-50 p-3">{error}</p>}
                
                <button type="submit" disabled={loading}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-4 disabled:opacity-60">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                  {loading ? 'Accessing Inbox...' : 'Verify & Open Message Box'}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-nude-100 flex justify-between items-center text-[10px] text-daisy-400 font-body">
                <span>🔒 Secure 256-bit encryption</span>
                <span>✨ Guest-friendly lookup</span>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* 💬 Connected User Status Header */}
              <div className="bg-white border border-nude-200 p-5 flex items-center justify-between">
                <div>
                  <p className="font-body text-[10px] tracking-widest uppercase text-daisy-400">Verified Inbox</p>
                  <h3 className="font-body text-sm font-semibold text-daisy-900">{contact}</h3>
                </div>
                <span className="flex items-center gap-1.5 font-body text-[10px] text-green-600 bg-green-50 px-2.5 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Active Connection
                </span>
              </div>

              {/* Message List */}
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <div className="bg-white border border-nude-200 p-12 text-center">
                    <Bell size={40} className="text-daisy-200 mx-auto mb-3" />
                    <p className="font-heading text-xl text-daisy-300 mb-1">Your inbox is empty</p>
                    <p className="font-body text-xs text-daisy-400 max-w-sm mx-auto">
                      No notifications have been recorded yet. Please ensure this matches the email/phone used at checkout.
                    </p>
                  </div>
                ) : (
                  notifications.map(notif => {
                    const isOrder = notif.type === 'order';
                    const isAccount = notif.type === 'account';
                    const msgText = notif.metadata?.whatsappMessage || notif.message;
                    
                    const cleanMsg = msgText
                      .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
                      .replace(/\n/g, '<br/>');

                    return (
                      <div key={notif.id} className="bg-white border border-nude-200 p-6 shadow-sm flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          isOrder ? 'bg-blue-50 text-blue-600' : isAccount ? 'bg-purple-50 text-purple-600' : 'bg-gray-50 text-gray-600'
                        }`}>
                          {isOrder ? <Package size={18} /> : <Bell size={18} />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-4 mb-2">
                            <h4 className="font-body text-sm font-semibold text-daisy-900">{notif.title}</h4>
                            <span className="font-body text-[10px] text-daisy-300 whitespace-nowrap">
                              {new Date(notif.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                          
                          <p className="font-body text-xs text-daisy-700 leading-relaxed" 
                             dangerouslySetInnerHTML={{ __html: cleanMsg }} />
                          
                          {/* Live Courier tracking action */}
                          {notif.metadata?.tracking_number && (
                            <div className="mt-3 pt-3 border-t border-nude-100 flex items-center justify-between">
                              <span className="font-body text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 uppercase font-medium">
                                {notif.metadata?.courier_name || 'Courier'}: {notif.metadata.tracking_number}
                              </span>
                              {notif.metadata?.tracking_url && (
                                <a href={notif.metadata.tracking_url} target="_blank" rel="noopener noreferrer"
                                   className="font-body text-[10px] text-blue-600 underline font-semibold flex items-center gap-0.5">
                                  Track Live Delivery <ExternalLink size={10} />
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          )}

        </div>
      </main>
      
      <Footer /><MobileNav />
    </>
  );
}
