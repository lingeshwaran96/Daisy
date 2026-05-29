// src/components/layout/Navbar.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ShoppingBag, Heart, User, Menu, X, Sun, Moon, ChevronDown, MessageSquare,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';

// Mega menu data
const NAV_ITEMS = [
  {
    label: 'Shop by Category',
    href: '/collections',
    mega: true,
    columns: [
      {
        title: 'Jewellery',
        links: [
          { label: 'Necklaces', href: '/collections/necklaces' },
          { label: 'Earrings', href: '/collections/earrings' },
          { label: 'Rings', href: '/collections/rings' },
          { label: 'Bangles', href: '/collections/bangles' },
          { label: 'Bracelets', href: '/collections/bracelets' },
          { label: 'Chains', href: '/collections/chains' },
          { label: 'Pendants', href: '/collections/pendants' },
          { label: 'Anklets', href: '/collections/anklets' },
        ],
      },
      {
        title: 'By Occasion',
        links: [
          { label: 'Wedding Wear', href: '/collections/wedding' },
          { label: 'Festive Wear', href: '/collections/festive' },
          { label: 'Party Wear', href: '/collections/party' },
          { label: 'Office Wear', href: '/collections/office' },
          { label: 'Casual Wear', href: '/collections/casual' },
        ],
      },
      {
        title: 'By Price',
        links: [
          { label: 'Under ₹2000', href: '/collections?max=2000' },
          { label: '₹2000 - ₹5000', href: '/collections?min=2000&max=5000' },
          { label: '₹5000 - ₹10000', href: '/collections?min=5000&max=10000' },
          { label: 'Above ₹10000', href: '/collections?min=10000' },
        ],
      },
    ],
  },
  {
    label: 'New Arrivals',
    href: '/collections/new-arrivals',
    mega: false,
  },
  {
    label: 'Best Sellers',
    href: '/collections/bestsellers',
    mega: false,
  },
];

type MenuItem = { id: string; label: string; href: string; open_in_new_tab: boolean };

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const [mounted, setMounted] = useState(false);

  const { items, setCartOpen, setSearchOpen, darkMode, toggleDarkMode } = useStore();
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.toggle('dark', darkMode);
    }
  }, [mounted, darkMode]);

  // Sticky navbar on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Load menu items from DB
  useEffect(() => {
    supabase
      .from('menu_items')
      .select('id, label, href, open_in_new_tab')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching menu items:', error);
        } else if (data) {
          setMenuItems(data as MenuItem[]);
        }
      });
  }, []);

  const handleMouseEnter = (label: string) => {
    clearTimeout(timeoutRef.current);
    setActiveMenu(label);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setActiveMenu(null), 150);
  };

  const itemsToRender = menuItems.length > 0 ? menuItems : NAV_ITEMS;

  return (
    <>
      {/* ---- Desktop Navbar ---- */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-card' : 'bg-white'
          }`}
      >
        <div className="max-w-[1400px] mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">

            {/* Mobile menu toggle */}
            <button
              className="md:hidden text-daisy-800 p-2"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>

            {/* Logo */}
            <Link href="/" className="flex flex-col items-center leading-none">
              <span className="font-heading text-2xl md:text-3xl font-light tracking-[0.4em] text-daisy-900 uppercase">
                Daisy
              </span>
              <span className="font-body text-[9px] tracking-[0.35em] text-daisy-400 uppercase mt-0.5">
                Elegance That Blooms
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8" onMouseLeave={handleMouseLeave}>
              {itemsToRender.map((item) => {
                const isMega = (item as any).mega || item.label.toLowerCase() === 'collections' || item.label.toLowerCase() === 'shop by category';
                return (
                  <div
                    key={item.label}
                    className="relative"
                    onMouseEnter={() => isMega ? handleMouseEnter(item.label) : setActiveMenu(null)}
                  >
                    <Link
                      href={item.href}
                      target={(item as any).open_in_new_tab ? '_blank' : undefined}
                      className={`flex items-center gap-1 font-body text-[11px] tracking-[0.2em] uppercase font-medium transition-colors duration-200 py-7 ${activeMenu === item.label
                        ? 'text-daisy-600'
                        : 'text-daisy-800 hover:text-daisy-600'
                        }`}
                    >
                      {item.label}
                      {isMega && <ChevronDown size={12} className={`transition-transform duration-200 ${activeMenu === item.label ? 'rotate-180' : ''}`} />}
                    </Link>
                  </div>
                );
              })}
            </nav>

            {/* Action Icons */}
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 text-daisy-800 hover:text-daisy-600 transition-colors"
                aria-label="Search"
              >
                <Search size={20} />
              </button>

              <button
                onClick={toggleDarkMode}
                className="hidden md:flex p-2 text-daisy-800 hover:text-daisy-600 transition-colors"
                aria-label="Toggle dark mode"
              >
                {mounted && darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <Link href="/wishlist" className="hidden md:flex p-2 text-daisy-800 hover:text-daisy-600 transition-colors" aria-label="Wishlist">
                <Heart size={20} />
              </Link>

               <Link href="/profile" className="hidden md:flex p-2 text-daisy-800 hover:text-daisy-600 transition-colors" aria-label="Account">
                <User size={20} />
              </Link>

              <Link href="/inbox" className="hidden md:flex p-2 text-daisy-800 hover:text-daisy-600 transition-colors" aria-label="Inbox Messages" title="Message Box">
                <MessageSquare size={20} />
              </Link>

              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2 text-daisy-800 hover:text-daisy-600 transition-colors"
                aria-label="Cart"
              >
                <ShoppingBag size={20} />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-daisy-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mega Menu */}
        <AnimatePresence>
          {activeMenu && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="absolute left-0 right-0 bg-white border-t border-nude-200 shadow-hover z-50"
              onMouseEnter={() => handleMouseEnter(activeMenu)}
              onMouseLeave={handleMouseLeave}
            >
              <div className="max-w-[1400px] mx-auto px-8 py-10">
                {NAV_ITEMS.filter((i) => i.label === activeMenu && i.mega).map((item) => (
                  <div key={item.label} className="grid grid-cols-3 gap-12">
                    {item.columns?.map((col) => (
                      <div key={col.title}>
                        <h3 className="font-body text-[10px] tracking-[0.3em] uppercase text-daisy-400 mb-5 font-medium">
                          {col.title}
                        </h3>
                        <ul className="space-y-3">
                          {col.links.map((link) => (
                            <li key={link.label}>
                              <Link
                                href={link.href}
                                onClick={() => setActiveMenu(null)}
                                className="font-body text-sm text-daisy-700 hover:text-daisy-500 transition-colors duration-200 flex items-center gap-2 group"
                              >
                                <span className="w-0 group-hover:w-3 h-px bg-daisy-400 transition-all duration-200" />
                                {link.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ---- Mobile Sidebar Menu ---- */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed left-0 top-0 bottom-0 w-[80vw] max-w-sm bg-white z-50 flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-nude-200">
                <span className="font-heading text-xl tracking-[0.3em] text-daisy-900 uppercase">Daisy</span>
                <button onClick={() => setMobileOpen(false)}><X size={22} className="text-daisy-800" /></button>
              </div>

              <nav className="flex-1 overflow-y-auto py-4">
                {itemsToRender.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    target={(item as any).open_in_new_tab ? '_blank' : undefined}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between px-6 py-4 font-body text-sm text-daisy-800 hover:bg-nude-100 transition-colors border-b border-nude-100"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="p-5 border-t border-nude-200 space-y-3">
                <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="btn-outline w-full">
                  Sign In
                </Link>
                <Link href="/auth/signup" onClick={() => setMobileOpen(false)} className="btn-primary w-full">
                  Create Account
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
