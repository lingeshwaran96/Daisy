// src/components/layout/MobileNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid, Heart, ShoppingBag, User } from 'lucide-react';
import { useStore } from '@/lib/store';

const NAV = [
  { label: 'Home', href: '/', Icon: Home },
  { label: 'Shop', href: '/collections', Icon: Grid },
  { label: 'Wishlist', href: '/wishlist', Icon: Heart },
  { label: 'Cart', href: '#', Icon: ShoppingBag, cart: true },
  { label: 'Account', href: '/profile', Icon: User },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { setCartOpen, items } = useStore();
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {NAV.map(({ label, href, Icon, cart }) => {
        const isActive = !cart && pathname === href;
        return (
          <button
            key={label}
            onClick={() => cart ? setCartOpen(true) : undefined}
            className={`relative flex flex-col items-center gap-1 flex-1 ${isActive ? 'text-daisy-700' : 'text-daisy-400'}`}
            aria-label={label}
          >
            {cart ? (
              <>
                <div className="relative">
                  <Icon size={22} />
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 w-4 h-4 bg-daisy-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {totalItems > 9 ? '9+' : totalItems}
                    </span>
                  )}
                </div>
                <span className="font-body text-[10px]">{label}</span>
              </>
            ) : (
              <Link href={href} className="flex flex-col items-center gap-1 w-full">
                <Icon size={22} />
                <span className="font-body text-[10px]">{label}</span>
              </Link>
            )}
            {isActive && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-daisy-600 rounded-full" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
