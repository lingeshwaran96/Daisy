// src/components/layout/SiteSettingsLoader.tsx
// Fetches ALL site_settings once at app startup and stores in global Zustand cache.
// Place this in the root layout — other components read from the store, not from Supabase directly.
'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/lib/store';

export default function SiteSettingsLoader() {
  const { settingsFetched, setSiteSettings } = useStore();

  useEffect(() => {
    // Only fetch once per session — if already cached, skip entirely
    if (settingsFetched) return;

    supabase
      .from('site_settings')
      .select('key, value')
      .then(({ data, error }) => {
        if (error) {
          console.error('[SiteSettingsLoader] Failed to load settings:', error.message);
          return;
        }
        if (data && data.length > 0) {
          const map: Record<string, string> = {};
          data.forEach(({ key, value }) => {
            if (key && value !== null && value !== undefined) {
              map[key] = value;
            }
          });
          setSiteSettings(map);
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount only

  // Renders nothing — purely a data loader
  return null;
}
