// src/app/admin/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Package, ShoppingCart, Users, Tag, Image, Instagram,
  Percent, MessageSquare, BarChart3, LogOut, Menu, X, ChevronRight, Settings,
  Star, Mail, Layout, Navigation, FileText, Search, UserCircle, Globe, Printer,
  ClipboardCheck,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

const SIDEBAR_LINKS = [
  { label: 'Dashboard', href: '/admin', Icon: LayoutDashboard },
  { label: 'Products', href: '/admin/products', Icon: Package },
  { label: 'Categories', href: '/admin/categories', Icon: Tag },
  { label: 'Orders', href: '/admin/orders', Icon: ShoppingCart },
  { label: 'Pending Orders', href: '/admin/pending-orders', Icon: ClipboardCheck },
  { label: 'Users', href: '/admin/users', Icon: Users },
  { label: 'Banners', href: '/admin/banners', Icon: Image },
  { label: 'Instagram', href: '/admin/instagram', Icon: Instagram },
  { label: 'Testimonials', href: '/admin/testimonials', Icon: Star },
  { label: 'Reviews', href: '/admin/reviews', Icon: MessageSquare },
  { label: 'Coupons', href: '/admin/coupons', Icon: Percent },
  { label: 'Newsletter', href: '/admin/newsletter', Icon: Mail },
  { label: 'Menu', href: '/admin/menu', Icon: Navigation },
  { label: 'CMS Pages', href: '/admin/pages', Icon: FileText },
  { label: 'Footer', href: '/admin/footer', Icon: Layout },
  { label: 'SEO', href: '/admin/seo', Icon: Globe },
  { label: 'Analytics', href: '/admin/analytics', Icon: BarChart3 },
  { label: 'Account', href: '/admin/account', Icon: UserCircle },
  { label: 'Settings', href: '/admin/settings', Icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const [adminName, setAdminName] = useState('Admin');

  useEffect(() => {
    async function checkAdmin() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.replace('/auth/login'); return; }
        const { data } = await supabase.from('users').select('role, full_name').eq('id', user.id).single();
        if (!data || (data.role !== 'admin' && data.role !== 'seller')) {
          toast.error('Admin/Seller access required');
          router.replace('/');
          return;
        }
        if (data.full_name) setAdminName(data.full_name);
      } catch (err) {
        router.replace('/auth/login');
      } finally {
        setChecking(false);
      }
    }
    checkAdmin();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/auth/login');
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-daisy-50">
        <div className="text-center">
          <span className="font-heading text-3xl text-daisy-300 tracking-widest">DAISY</span>
          <div className="spinner text-daisy-400 mx-auto mt-4"/>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-nude-50">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setSidebarOpen(false)}/>
      )}

      <aside className={`
        fixed md:sticky top-0 left-0 h-screen w-64 bg-daisy-950 flex flex-col z-50 transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex items-center justify-between px-6 py-6 border-b border-white/10">
          <Link href="/admin" className="flex flex-col">
            <span className="font-heading text-2xl text-cream tracking-[0.3em] uppercase">Daisy</span>
            <span className="font-body text-[9px] text-cream/40 tracking-widest uppercase mt-0.5">Admin Panel</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="text-cream/40 md:hidden"><X size={18}/></button>
        </div>

        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          {SIDEBAR_LINKS.map(({ label, href, Icon }) => {
            const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
            return (
              <Link key={label} href={href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 mb-0.5 font-body text-sm transition-all duration-200 group ${
                  active ? 'bg-daisy-700 text-cream' : 'text-cream/60 hover:text-cream hover:bg-white/5'
                }`}>
                <Icon size={16} className={active ? 'text-cream' : 'text-cream/50 group-hover:text-cream'}/>
                {label}
                {active && <ChevronRight size={13} className="ml-auto"/>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-1">
          <Link href="/" target="_blank" className="flex items-center gap-2 px-3 py-2 font-body text-xs text-cream/40 hover:text-cream transition-colors">
            ↗ View Store
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 font-body text-xs text-red-400 hover:text-red-300 w-full transition-colors">
            <LogOut size={14}/> Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-white border-b border-nude-200 px-6 py-4 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-daisy-700"><Menu size={22}/></button>
          <div className="flex-1"/>
          <Link href="/track-order" target="_blank" className="font-body text-xs text-daisy-400 hover:text-daisy-700 hidden md:block">Track Order ↗</Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-daisy-700 rounded-full flex items-center justify-center">
              <span className="font-body text-xs font-medium text-cream">{adminName[0]?.toUpperCase() || 'A'}</span>
            </div>
            <span className="font-body text-sm text-daisy-700 hidden md:block">{adminName}</span>
          </div>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
