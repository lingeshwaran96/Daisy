// src/app/admin/settings/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  CheckCircle, XCircle, Loader2, Database, HardDrive, RefreshCw,
  Plus, Edit, Trash2, ArrowLeft, Settings, Upload, ImagePlus, X, Check, Star, MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import * as LucideIcons from 'lucide-react';
import Image from 'next/image';

const DEFAULT_CATEGORIES = [
  { name: 'Rings', slug: 'rings', sort_order: 1, is_active: true },
  { name: 'Necklaces', slug: 'necklaces', sort_order: 2, is_active: true },
  { name: 'Earrings', slug: 'earrings', sort_order: 3, is_active: true },
  { name: 'Bangles', slug: 'bangles', sort_order: 4, is_active: true },
  { name: 'Bracelets', slug: 'bracelets', sort_order: 5, is_active: true },
  { name: 'Anklets', slug: 'anklets', sort_order: 6, is_active: true },
  { name: 'Sarees', slug: 'sarees', sort_order: 7, is_active: true },
  { name: 'Gifts', slug: 'gifts', sort_order: 8, is_active: true },
];

const POPULAR_ICONS = [
  { name: 'Truck', label: 'Shipping / Delivery' },
  { name: 'Shield', label: 'Trust / Authenticity' },
  { name: 'RefreshCw', label: 'Returns / Exchange' },
  { name: 'Award', label: 'Quality / Certified' },
  { name: 'Headphones', label: 'Customer Support' },
  { name: 'Lock', label: 'Secure Payment' },
  { name: 'Heart', label: 'Satisfaction / Love' },
  { name: 'Star', label: 'Ratings / Reviews' },
  { name: 'Clock', label: 'Speed / Timeliness' },
  { name: 'Percent', label: 'Offers / Discounts' },
];

type SetupStatus = 'idle' | 'running' | 'done' | 'error';

export default function AdminSettingsPage() {
  // Tabs State
  const [activeTab, setActiveTab] = useState<'general' | 'announcements' | 'badges' | 'story' | 'whatsapp' | 'setup'>('general');

  // Database Setup Statuses
  const [catStatus, setCatStatus] = useState<SetupStatus>('idle');
  const [catMsg, setCatMsg] = useState('');
  const [bucketStatus, setBucketStatus] = useState<SetupStatus>('idle');
  const [bucketMsg, setBucketMsg] = useState('');

  // Checkout Toggle Settings State
  const [checkoutEnabled, setCheckoutEnabled] = useState(true);
  const [smsOtpEnabled, setSmsOtpEnabled] = useState(true);
  const [settingLoading, setSettingLoading] = useState(true);

  // WhatsApp Contact Numbers State
  const [whatsappList, setWhatsappList] = useState<any[]>([]);
  const [primaryWhatsapp, setPrimaryWhatsapp] = useState('');

  // WhatsApp Form State
  const [waLabel, setWaLabel] = useState('');
  const [waNumberInput, setWaNumberInput] = useState('');
  const [editingWaIndex, setEditingWaIndex] = useState<number | null>(null);
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);

  // Trust Badges State
  const [badges, setBadges] = useState<any[]>([]);
  const [badgesLoading, setBadgesLoading] = useState(true);
  const [editingBadge, setEditingBadge] = useState<any | null>(null);
  const [showBadgeForm, setShowBadgeForm] = useState(false);

  // Form Fields for Badges
  const [badgeTitle, setBadgeTitle] = useState('');
  const [badgeDesc, setBadgeDesc] = useState('');
  const [badgeIcon, setBadgeIcon] = useState('Truck');
  const [badgeOrder, setBadgeOrder] = useState(1);
  const [savingBadge, setSavingBadge] = useState(false);

  // Brand Story Settings State
  const [storySubtitle, setStorySubtitle] = useState('Our Story');
  const [storyTitleMain, setStoryTitleMain] = useState('Born from a Love of');
  const [storyTitleAccent, setStoryTitleAccent] = useState('Timeless Elegance');
  const [storyParagraph1, setStoryParagraph1] = useState('');
  const [storyParagraph2, setStoryParagraph2] = useState('');
  const [storyImage1, setStoryImage1] = useState('https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80');
  const [storyImage2, setStoryImage2] = useState('https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600&q=80');
  const [storyBadgeNumber, setStoryBadgeNumber] = useState('10K+');
  const [storyBadgeText, setStoryBadgeText] = useState('Happy Customers');
  const [storyMetric1Number, setStoryMetric1Number] = useState('500+');
  const [storyMetric1Text, setStoryMetric1Text] = useState('Unique Designs');
  const [storyMetric2Number, setStoryMetric2Number] = useState('10K+');
  const [storyMetric2Text, setStoryMetric2Text] = useState('Orders Delivered');
  const [storyMetric3Number, setStoryMetric3Number] = useState('4.9★');
  const [storyMetric3Text, setStoryMetric3Text] = useState('Customer Rating');
  const [storyButtonText, setStoryButtonText] = useState('Read Our Story');
  const [storyButtonLink, setStoryButtonLink] = useState('/about');

  const [savingStory, setSavingStory] = useState(false);
  const [uploadingImage1, setUploadingImage1] = useState(false);
  const [uploadingImage2, setUploadingImage2] = useState(false);

  // Announcement Bar State
  const [announcementsList, setAnnouncementsList] = useState<string[]>([]);
  const [announcementInput, setAnnouncementInput] = useState('');
  const [editingAnnouncementIdx, setEditingAnnouncementIdx] = useState<number | null>(null);
  const [savingAnnouncements, setSavingAnnouncements] = useState(false);

  // Shipping Settings State
  const [shippingFee, setShippingFee] = useState('99');
  const [freeThreshold, setFreeThreshold] = useState('1000');
  const [shippingEnabled, setShippingEnabled] = useState(true);
  const [savingShipping, setSavingShipping] = useState(false);

  const fileInput1Ref = useRef<HTMLInputElement>(null);
  const fileInput2Ref = useRef<HTMLInputElement>(null);

  // Load Settings & Badges
  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value');

      if (data) {
        const checkoutRow = data.find(r => r.key === 'checkout_enabled');
        if (checkoutRow) setCheckoutEnabled(checkoutRow.value !== 'false');

        const smsOtpRow = data.find(r => r.key === 'sms_otp_enabled');
        if (smsOtpRow) setSmsOtpEnabled(smsOtpRow.value !== 'false');

        const waListRow = data.find(r => r.key === 'whatsapp_numbers_list');
        if (waListRow) {
          try {
            setWhatsappList(JSON.parse(waListRow.value));
          } catch (e) {
            setWhatsappList([]);
          }
        } else {
          // If not configured, initialize with the default fallback number
          const initialNum = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919876543210';
          const defaultList = [{ label: 'Primary Support', number: initialNum, is_primary: true }];
          setWhatsappList(defaultList);
        }

        const waPrimaryRow = data.find(r => r.key === 'whatsapp_primary');
        if (waPrimaryRow) {
          setPrimaryWhatsapp(waPrimaryRow.value);
        } else {
          setPrimaryWhatsapp(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919876543210');
        }

        const shippingFeeRow = data.find(r => r.key === 'shipping_fee');
        if (shippingFeeRow) setShippingFee(shippingFeeRow.value);

        const freeThresholdRow = data.find(r => r.key === 'free_shipping_threshold');
        if (freeThresholdRow) setFreeThreshold(freeThresholdRow.value);

        const shippingEnabledRow = data.find(r => r.key === 'shipping_fee_enabled');
        if (shippingEnabledRow) setShippingEnabled(shippingEnabledRow.value !== 'false');

        // Announcement Row
        const announcementRow = data.find(r => r.key === 'announcement_text');
        if (announcementRow) {
          const items = announcementRow.value.split('|').map((s: any) => s.trim()).filter(Boolean);
          setAnnouncementsList(items);
        } else {
          setAnnouncementsList([
            '🌸 USE CODE: WELCOME10 — 10% off your first order',
            '✨ FREE SHIPPING on orders above ₹1000',
            '💫 USE CODE: DAISY15 — 15% off above ₹3000',
            '🎁 10% OFF all prepaid orders — USE CODE: PREPAID10',
          ]);
        }

        // Populate Brand Story state
        data.forEach(r => {
          if (r.key === 'story_subtitle') setStorySubtitle(r.value);
          else if (r.key === 'story_title_main') setStoryTitleMain(r.value);
          else if (r.key === 'story_title_accent') setStoryTitleAccent(r.value);
          else if (r.key === 'story_paragraph1') setStoryParagraph1(r.value);
          else if (r.key === 'story_paragraph2') setStoryParagraph2(r.value);
          else if (r.key === 'story_image1') setStoryImage1(r.value);
          else if (r.key === 'story_image2') setStoryImage2(r.value);
          else if (r.key === 'story_badge_number') setStoryBadgeNumber(r.value);
          else if (r.key === 'story_badge_text') setStoryBadgeText(r.value);
          else if (r.key === 'story_metric1_number') setStoryMetric1Number(r.value);
          else if (r.key === 'story_metric1_text') setStoryMetric1Text(r.value);
          else if (r.key === 'story_metric2_number') setStoryMetric2Number(r.value);
          else if (r.key === 'story_metric2_text') setStoryMetric2Text(r.value);
          else if (r.key === 'story_metric3_number') setStoryMetric3Number(r.value);
          else if (r.key === 'story_metric3_text') setStoryMetric3Text(r.value);
          else if (r.key === 'story_button_text') setStoryButtonText(r.value);
          else if (r.key === 'story_button_link') setStoryButtonLink(r.value);
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setSettingLoading(false);
    }
  };

  const fetchBadges = async () => {
    setBadgesLoading(true);
    try {
      const { data } = await supabase
        .from('trust_badges')
        .select('*')
        .order('sort_order', { ascending: true });

      if (data) {
        setBadges(data);
      }
    } catch (err) {
      console.error('Error fetching trust badges:', err);
    } finally {
      setBadgesLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchBadges();
  }, []);

  // Upload helpers
  const uploadFile = async (file: File): Promise<string | null> => {
    if (!file.type.startsWith('image/')) {
      toast.error(`${file.name} is not an image`);
      return null;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`${file.name} is too large (max 5 MB)`);
      return null;
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `story/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (error) {
      if (error.message.includes('not found') || error.message.includes('Bucket')) {
        toast.error('Storage bucket "product-images" not found. Initialize it in the Setup tab first.');
      } else {
        toast.error(`Upload failed: ${error.message}`);
      }
      return null;
    }

    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(data.path);
    return urlData?.publicUrl ?? null;
  };

  const handleImageSelect = async (files: FileList | null, imgNum: 1 | 2) => {
    if (!files || files.length === 0) return;
    if (imgNum === 1) setUploadingImage1(true);
    else setUploadingImage2(true);

    try {
      const url = await uploadFile(files[0]);
      if (url) {
        if (imgNum === 1) setStoryImage1(url);
        else setStoryImage2(url);
        toast.success(`Image ${imgNum} uploaded!`);
      }
    } catch (err: any) {
      toast.error('Upload failed: ' + err.message);
    } finally {
      if (imgNum === 1) setUploadingImage1(false);
      else setUploadingImage2(false);
    }
  };

  // Save brand story settings
  const saveStorySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStory(true);
    try {
      const payload = [
        { key: 'story_subtitle', value: storySubtitle },
        { key: 'story_title_main', value: storyTitleMain },
        { key: 'story_title_accent', value: storyTitleAccent },
        { key: 'story_paragraph1', value: storyParagraph1 },
        { key: 'story_paragraph2', value: storyParagraph2 },
        { key: 'story_image1', value: storyImage1 },
        { key: 'story_image2', value: storyImage2 },
        { key: 'story_badge_number', value: storyBadgeNumber },
        { key: 'story_badge_text', value: storyBadgeText },
        { key: 'story_metric1_number', value: storyMetric1Number },
        { key: 'story_metric1_text', value: storyMetric1Text },
        { key: 'story_metric2_number', value: storyMetric2Number },
        { key: 'story_metric2_text', value: storyMetric2Text },
        { key: 'story_metric3_number', value: storyMetric3Number },
        { key: 'story_metric3_text', value: storyMetric3Text },
        { key: 'story_button_text', value: storyButtonText },
        { key: 'story_button_link', value: storyButtonLink },
      ];

      const { error } = await supabase
        .from('site_settings')
        .upsert(payload, { onConflict: 'key' });

      if (error) throw error;
      toast.success('Brand Story updated successfully!');
    } catch (err: any) {
      console.error('Error saving brand story:', err);
      toast.error('Failed to save story settings: ' + err.message);
    } finally {
      setSavingStory(false);
    }
  };

  // Save shipping settings to database
  const saveShippingSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingShipping(true);
    try {
      const payload = [
        { key: 'shipping_fee', value: shippingFee },
        { key: 'free_shipping_threshold', value: freeThreshold },
        { key: 'shipping_fee_enabled', value: shippingEnabled ? 'true' : 'false' }
      ];

      const { error } = await supabase
        .from('site_settings')
        .upsert(payload, { onConflict: 'key' });

      if (error) throw error;
      toast.success('Shipping settings saved successfully! 🚚');
    } catch (err: any) {
      console.error('Error saving shipping settings:', err);
      toast.error('Failed to save shipping settings: ' + err.message);
    } finally {
      setSavingShipping(false);
    }
  };

  // Save WhatsApp contacts list and active/primary WhatsApp number to database
  const saveWhatsappSettings = async (newList: any[], newPrimary?: string) => {
    setSavingWhatsapp(true);
    try {
      const primaryNum = newPrimary || newList.find(item => item.is_primary)?.number || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919876543210';

      const payload = [
        { key: 'whatsapp_numbers_list', value: JSON.stringify(newList) },
        { key: 'whatsapp_primary', value: primaryNum }
      ];

      const { error } = await supabase
        .from('site_settings')
        .upsert(payload, { onConflict: 'key' });

      if (error) throw error;

      setWhatsappList(newList);
      setPrimaryWhatsapp(primaryNum);
      toast.success('WhatsApp contacts updated successfully!');
    } catch (err: any) {
      console.error('Error saving WhatsApp contacts:', err);
      toast.error('Failed to save WhatsApp contacts: ' + err.message);
    } finally {
      setSavingWhatsapp(false);
    }
  };

  // Toggle checkout visibility on the live site
  const toggleCheckoutSetting = async () => {
    setSettingLoading(true);
    const newValue = !checkoutEnabled;
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key: 'checkout_enabled', value: newValue ? 'true' : 'false' });

      if (error) throw error;
      setCheckoutEnabled(newValue);
      toast.success(newValue ? 'Checkout enabled!' : 'Checkout disabled! Orders will route to WhatsApp.');
    } catch (err: any) {
      console.error('Error updating settings:', err);
      toast.error('Failed to update setting: ' + err.message);
    } finally {
      setSettingLoading(false);
    }
  };

  const toggleSmsOtpSetting = async () => {
    setSettingLoading(true);
    const newValue = !smsOtpEnabled;
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key: 'sms_otp_enabled', value: newValue ? 'true' : 'false' });

      if (error) throw error;
      setSmsOtpEnabled(newValue);
      toast.success(newValue ? 'SMS OTP Verification enabled!' : 'SMS OTP Verification disabled! Users must log in via Gmail.');
    } catch (err: any) {
      console.error('Error updating settings:', err);
      toast.error('Failed to update setting: ' + err.message);
    } finally {
      setSettingLoading(false);
    }
  };

  // Seed Categories Database Helper
  const seedCategories = async () => {
    setCatStatus('running');
    setCatMsg('Checking existing categories...');
    try {
      const { data: existing } = await supabase.from('categories').select('slug');
      const existingSlugs = new Set((existing || []).map((c: any) => c.slug));
      const toInsert = DEFAULT_CATEGORIES.filter(c => !existingSlugs.has(c.slug));

      if (toInsert.length === 0) {
        setCatStatus('done');
        setCatMsg(`All ${DEFAULT_CATEGORIES.length} categories already exist!`);
        return;
      }

      setCatMsg(`Adding ${toInsert.length} categories...`);
      const { error } = await supabase.from('categories').insert(toInsert);
      if (error) throw error;

      setCatStatus('done');
      setCatMsg(`✅ Added ${toInsert.length} categories (${toInsert.map(c => c.name).join(', ')})`);
      toast.success(`${toInsert.length} categories added!`);
    } catch (err: any) {
      setCatStatus('error');
      setCatMsg(`Error: ${err.message}`);
      toast.error(err.message);
    }
  };

  // Create Storage Bucket Helper
  const createBucket = async () => {
    setBucketStatus('running');
    setBucketMsg('Creating storage bucket...');
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const exists = buckets?.some((b: any) => b.name === 'product-images');

      if (exists) {
        setBucketStatus('done');
        setBucketMsg('✅ Storage bucket "product-images" already exists!');
        return;
      }

      const { error } = await supabase.storage.createBucket('product-images', {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      });

      if (error) throw error;

      setBucketStatus('done');
      setBucketMsg('✅ Storage bucket "product-images" created successfully!');
      toast.success('Storage bucket created!');
    } catch (err: any) {
      setBucketStatus('error');
      setBucketMsg(`Could not create bucket automatically: ${err.message}\n\nPlease create it manually.`);
      toast.error('Manual bucket creation needed');
    }
  };

  const runFullSetup = async () => {
    await seedCategories();
    await createBucket();
  };

  // Form Management Helpers for Badges
  const handleOpenForm = (badge: any = null) => {
    if (badge) {
      setEditingBadge(badge);
      setBadgeTitle(badge.title);
      setBadgeDesc(badge.description || '');
      setBadgeIcon(badge.icon);
      setBadgeOrder(badge.sort_order || 1);
    } else {
      setEditingBadge(null);
      setBadgeTitle('');
      setBadgeDesc('');
      setBadgeIcon('Truck');
      const maxOrder = badges.reduce((max, b) => Math.max(max, b.sort_order || 0), 0);
      setBadgeOrder(maxOrder + 1);
    }
    setShowBadgeForm(true);
  };

  const handleCloseForm = () => {
    setShowBadgeForm(false);
    setEditingBadge(null);
    setBadgeTitle('');
    setBadgeDesc('');
    setBadgeIcon('Truck');
    setBadgeOrder(1);
  };

  // Save trust badge to database
  const handleSaveBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!badgeTitle.trim()) {
      toast.error('Title is required');
      return;
    }

    setSavingBadge(true);
    try {
      const payload = {
        title: badgeTitle,
        description: badgeDesc,
        icon: badgeIcon,
        sort_order: badgeOrder,
      };

      if (editingBadge?.id) {
        // Update
        const { error } = await supabase
          .from('trust_badges')
          .update(payload)
          .eq('id', editingBadge.id);

        if (error) throw error;
        toast.success('Trust badge updated successfully!');
      } else {
        // Insert
        const { error } = await supabase
          .from('trust_badges')
          .insert([payload]);

        if (error) throw error;
        toast.success('Trust badge added successfully!');
      }

      handleCloseForm();
      fetchBadges();
    } catch (err: any) {
      console.error('Error saving trust badge:', err);
      toast.error('Failed to save badge: ' + err.message);
    } finally {
      setSavingBadge(false);
    }
  };

  // Delete trust badge from database
  const handleDeleteBadge = async (id: string) => {
    if (!confirm('Are you sure you want to delete this trust badge?')) return;

    try {
      const { error } = await supabase
        .from('trust_badges')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Trust badge deleted successfully!');
      fetchBadges();
    } catch (err: any) {
      console.error('Error deleting trust badge:', err);
      toast.error('Failed to delete badge: ' + err.message);
    }
  };

  // Save announcements to site_settings table
  const saveAnnouncements = async (newList: string[]) => {
    setSavingAnnouncements(true);
    try {
      const mergedValue = newList.join(' | ');
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key: 'announcement_text', value: mergedValue }, { onConflict: 'key' });

      if (error) throw error;
      setAnnouncementsList(newList);
      toast.success('Announcement Bar settings saved successfully!');
    } catch (err: any) {
      console.error('Error saving announcement bar:', err);
      toast.error('Failed to save announcement settings: ' + err.message);
    } finally {
      setSavingAnnouncements(false);
    }
  };

  const StatusIcon = ({ status }: { status: SetupStatus }) => {
    if (status === 'running') return <Loader2 size={18} className="text-daisy-500 animate-spin" />;
    if (status === 'done') return <CheckCircle size={18} className="text-green-600" />;
    if (status === 'error') return <XCircle size={18} className="text-red-500" />;
    return <div className="w-[18px] h-[18px] border-2 border-nude-300 rounded-full" />;
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-4xl text-daisy-900 font-light">Settings</h1>
          <p className="font-body text-sm text-daisy-500 mt-1">Configure store-wide preferences, checkout rules, and feature badges</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 border-b border-nude-200 mb-8 pb-px">
        {[
          { id: 'general', label: 'General & Checkout' },
          { id: 'announcements', label: 'Announcement Bar' },
          { id: 'badges', label: 'Feature / Trust Badges' },
          { id: 'story', label: 'Brand Story' },
          { id: 'whatsapp', label: 'WhatsApp Contacts' },
          { id: 'setup', label: 'Database Setup' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`font-body text-sm px-6 py-3 border-b-2 transition-all font-semibold ${activeTab === tab.id
                ? 'border-daisy-800 text-daisy-900'
                : 'border-transparent text-daisy-400 hover:text-daisy-700'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: GENERAL SETTINGS */}
      {activeTab === 'general' && (
        <div className="space-y-8 max-w-3xl">
          <section className="bg-white border border-nude-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-heading text-xl text-daisy-800">Checkout Settings</h2>
                <p className="font-body text-xs text-daisy-400 mt-1">Control the customer checkout experience on the front-end website</p>
              </div>
              <div className="flex items-center gap-2">
                {settingLoading ? (
                  <Loader2 size={16} className="text-daisy-500 animate-spin" />
                ) : (
                  <span className={`text-xs font-body uppercase tracking-wider px-2.5 py-1 rounded-sm font-semibold ${checkoutEnabled ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                    {checkoutEnabled ? 'Active' : 'Disabled'}
                  </span>
                )}
              </div>
            </div>

            <div className="border border-nude-200 p-5 rounded-sm flex items-center justify-between bg-nude-50/30">
              <div className="max-w-[75%] pr-4">
                <h3 className="font-body text-sm font-semibold text-daisy-900">Proceed to Checkout Button</h3>
                <p className="font-body text-xs text-daisy-500 mt-1 leading-relaxed">
                  Enable to show the standard online checkout. Disable to hide "Proceed to Checkout" entirely on the site, guiding all customer transactions securely through WhatsApp.
                </p>
              </div>
              <button
                onClick={toggleCheckoutSetting}
                disabled={settingLoading}
                className={`w-14 h-8 rounded-full transition-colors flex items-center p-1 cursor-pointer disabled:opacity-50 relative focus:outline-none ${checkoutEnabled ? 'bg-daisy-800 justify-end' : 'bg-nude-200 justify-start'
                  }`}
              >
                <motion.div
                  layout
                  className="w-6 h-6 bg-cream rounded-full shadow-sm"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
          </section>

          <section className="bg-white border border-nude-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-heading text-xl text-daisy-800">Authentication Settings</h2>
                <p className="font-body text-xs text-daisy-400 mt-1">Configure user login options for WhatsApp Checkout verification</p>
              </div>
              <div className="flex items-center gap-2">
                {settingLoading ? (
                  <Loader2 size={16} className="text-daisy-500 animate-spin" />
                ) : (
                  <span className={`text-xs font-body uppercase tracking-wider px-2.5 py-1 rounded-sm font-semibold ${smsOtpEnabled ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                    {smsOtpEnabled ? 'SMS Enabled' : 'Gmail Only'}
                  </span>
                )}
              </div>
            </div>

            <div className="border border-nude-200 p-5 rounded-sm flex items-center justify-between bg-nude-50/30">
              <div className="max-w-[75%] pr-4">
                <h3 className="font-body text-sm font-semibold text-daisy-900">Mobile SMS OTP Verification</h3>
                <p className="font-body text-xs text-daisy-500 mt-1 leading-relaxed">
                  Turn on to allow customers to verify using their mobile number via SMS OTP. Turn off to disable mobile number verification (e.g. if SMS recharge or credits run out), forcing all users to sign in with Google/Gmail.
                </p>
              </div>
              <button
                type="button"
                onClick={toggleSmsOtpSetting}
                disabled={settingLoading}
                className={`w-14 h-8 rounded-full transition-colors flex items-center p-1 cursor-pointer disabled:opacity-50 relative focus:outline-none ${smsOtpEnabled ? 'bg-daisy-800 justify-end' : 'bg-nude-200 justify-start'
                  }`}
              >
                <motion.div
                  layout
                  className="w-6 h-6 bg-cream rounded-full shadow-sm"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
          </section>

          <section className="bg-white border border-nude-200 p-6 shadow-sm">
            <h2 className="font-heading text-xl text-daisy-800 mb-2">Shipping & Delivery Settings</h2>
            <p className="font-body text-xs text-daisy-400 mb-6 font-light">Manage default shipping fees and threshold limits. Set shipping fee to 0 to make it free by default.</p>

            <form onSubmit={saveShippingSettings} className="space-y-4">
              <div className="border border-nude-200 p-5 rounded-sm flex items-center justify-between bg-nude-50/30">
                <div className="max-w-[75%] pr-4">
                  <h3 className="font-body text-sm font-semibold text-daisy-900">Enable Shipping Fee</h3>
                  <p className="font-body text-xs text-daisy-500 mt-1 leading-relaxed">
                    Turn on to calculate and display the shipping fee on customer bills (including cart, checkout, and WhatsApp summary details). Turn off to make shipping free and hide the fee line from all bills.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShippingEnabled(!shippingEnabled)}
                  className={`w-14 h-8 rounded-full transition-colors flex items-center p-1 cursor-pointer relative focus:outline-none ${shippingEnabled ? 'bg-daisy-800 justify-end' : 'bg-nude-200 justify-start'
                    }`}
                >
                  <motion.div
                    layout
                    className="w-6 h-6 bg-cream rounded-full shadow-sm"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-xs tracking-wider uppercase text-daisy-500 mb-2">Shipping Fee (₹)</label>
                  <input
                    type="number"
                    placeholder="99"
                    value={shippingFee}
                    onChange={(e) => setShippingFee(e.target.value)}
                    className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 bg-white"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block font-body text-xs tracking-wider uppercase text-daisy-500 mb-2">Free Shipping Threshold (₹)</label>
                  <input
                    type="number"
                    placeholder="1000"
                    value={freeThreshold}
                    onChange={(e) => setFreeThreshold(e.target.value)}
                    className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 bg-white"
                    min="0"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingShipping}
                  className="btn-primary py-3 px-6 font-body text-xs font-semibold tracking-widest uppercase flex items-center gap-2"
                >
                  {savingShipping ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Saving Settings...
                    </>
                  ) : (
                    'Save Shipping Settings'
                  )}
                </button>
              </div>
            </form>
          </section>

          <section className="bg-white border border-nude-200 p-6 shadow-sm">
            <h2 className="font-heading text-xl text-daisy-800 mb-6">Store Information</h2>
            <div className="space-y-3">
              {[
                { label: 'Store Name', value: 'DAISY' },
                { label: 'Primary WhatsApp', value: primaryWhatsapp || 'Not configured' },
                { label: 'Supabase URL', value: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').split('.')[0] || 'Not configured' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-nude-100">
                  <span className="font-body text-xs tracking-widest uppercase text-daisy-500">{label}</span>
                  <span className="font-body text-sm text-daisy-800">{value}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* TAB CONTENT: ANNOUNCEMENT BAR */}
      {activeTab === 'announcements' && (
        <div className="space-y-8 max-w-4xl">
          {/* Visual Live Preview */}
          <section className="bg-white border border-nude-200 p-6 shadow-sm">
            <h2 className="font-heading text-xl text-daisy-800 mb-2">Live Announcement Bar Preview</h2>
            <p className="font-body text-xs text-daisy-400 mb-4">This is a live simulation of what customers see at the very top of your homepage.</p>

            <div className="relative bg-daisy-900 text-cream py-3 overflow-hidden rounded-md shadow-inner border border-daisy-950 flex items-center justify-between px-4">
              <div className="flex-1 overflow-hidden">
                {announcementsList.length === 0 ? (
                  <p className="font-body text-xs tracking-[0.2em] text-center text-cream/50 italic py-1">No Announcements Configured</p>
                ) : (
                  <div className="flex animate-marquee whitespace-nowrap">
                    {[...announcementsList, ...announcementsList].map((text, i) => (
                      <span key={i} className="font-body text-xs tracking-[0.2em] mx-10 text-cream font-light shrink-0">
                        {text}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-cream/50 pl-4 border-l border-cream/10 ml-2">
                <LucideIcons.X size={12} />
              </div>
            </div>
          </section>

          {/* Form to Add / Edit */}
          <section className="bg-white border border-nude-200 p-6 shadow-sm">
            <h2 className="font-heading text-xl text-daisy-800 mb-6">
              {editingAnnouncementIdx !== null ? '🖊️ Edit Announcement' : '➕ Add New Announcement'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block font-body text-xs tracking-wider uppercase text-daisy-500 mb-2">Announcement Content *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 🌸 USE CODE: WELCOME10 — 10% off your first order"
                    value={announcementInput}
                    onChange={(e) => setAnnouncementInput(e.target.value)}
                    className="flex-1 border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 bg-white"
                    required
                  />
                </div>
              </div>

              {/* Quick Emoji Helper Chips */}
              <div>
                <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-400 mb-2">Quick Emoji Starters</label>
                <div className="flex flex-wrap gap-2">
                  {['🌸', '✨', '💫', '🎁', '💎', '🚚', '🔥', '🎉', '🌟', '🔔'].map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        if (announcementInput.startsWith(emoji)) return;
                        setAnnouncementInput(prev => `${emoji} ${prev.replace(/^[^\w\s\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+/gi, '').trim()}`);
                      }}
                      className="border border-nude-200 hover:border-daisy-400 px-3 py-1.5 font-body text-sm rounded bg-nude-50/50 hover:bg-white transition-all"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!announcementInput.trim()) {
                      toast.error('Announcement text cannot be empty');
                      return;
                    }
                    const newList = [...announcementsList];
                    if (editingAnnouncementIdx !== null) {
                      newList[editingAnnouncementIdx] = announcementInput.trim();
                      setEditingAnnouncementIdx(null);
                      toast.success('Announcement updated in the list! Click Save to publish.');
                    } else {
                      newList.push(announcementInput.trim());
                      toast.success('Announcement added to the list! Click Save to publish.');
                    }
                    setAnnouncementsList(newList);
                    setAnnouncementInput('');
                  }}
                  className="btn-primary py-3 px-6 font-body text-xs font-semibold tracking-widest uppercase flex items-center gap-2"
                >
                  {editingAnnouncementIdx !== null ? <Check size={14} /> : <Plus size={14} />}
                  {editingAnnouncementIdx !== null ? 'Update Announcement' : 'Add to List'}
                </button>

                {editingAnnouncementIdx !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      setAnnouncementInput('');
                      setEditingAnnouncementIdx(null);
                    }}
                    className="border border-nude-200 hover:border-daisy-400 py-3 px-5 font-body text-xs text-daisy-700 bg-white transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* List of Announcements */}
          <section className="bg-white border border-nude-200 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="font-heading text-xl text-daisy-800">Current Announcements ({announcementsList.length})</h2>
                <p className="font-body text-xs text-daisy-400 mt-1">Reorder, edit, or delete items. Remember to click "Save Changes" to publish your edits to the store homepage.</p>
              </div>
            </div>

            {announcementsList.length === 0 ? (
              <div className="text-center p-8 border border-dashed border-nude-200 text-daisy-400 font-body text-xs">
                No announcements configured yet. Add one above to begin.
              </div>
            ) : (
              <div className="space-y-3">
                {announcementsList.map((ann, idx) => (
                  <div key={idx} className="flex items-center justify-between border border-nude-200 p-4 rounded-sm bg-white hover:border-daisy-400 transition-all">
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
                      <span className="font-body text-xs text-daisy-300 font-semibold bg-nude-100/50 w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <p className="font-body text-sm text-daisy-800 font-light truncate">{ann}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Move Up */}
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => {
                          const newList = [...announcementsList];
                          const temp = newList[idx];
                          newList[idx] = newList[idx - 1];
                          newList[idx - 1] = temp;
                          setAnnouncementsList(newList);
                        }}
                        className="p-1.5 rounded-sm border border-nude-100 text-daisy-400 hover:text-daisy-800 hover:border-daisy-300 transition-all bg-white disabled:opacity-40"
                        title="Move Up"
                      >
                        <LucideIcons.ArrowUp size={13} />
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        disabled={idx === announcementsList.length - 1}
                        onClick={() => {
                          const newList = [...announcementsList];
                          const temp = newList[idx];
                          newList[idx] = newList[idx + 1];
                          newList[idx + 1] = temp;
                          setAnnouncementsList(newList);
                        }}
                        className="p-1.5 rounded-sm border border-nude-100 text-daisy-400 hover:text-daisy-800 hover:border-daisy-300 transition-all bg-white disabled:opacity-40"
                        title="Move Down"
                      >
                        <LucideIcons.ArrowDown size={13} />
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAnnouncementIdx(idx);
                          setAnnouncementInput(ann);
                        }}
                        className="p-1.5 rounded-sm border border-nude-200 text-daisy-600 hover:text-daisy-900 hover:border-daisy-400 transition-all bg-white"
                        title="Edit Item"
                      >
                        <Edit size={13} />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => {
                          if (!confirm('Are you sure you want to delete this announcement?')) return;
                          const newList = announcementsList.filter((_, i) => i !== idx);
                          setAnnouncementsList(newList);
                          if (editingAnnouncementIdx === idx) {
                            setAnnouncementInput('');
                            setEditingAnnouncementIdx(null);
                          }
                          toast.success('Removed from list. Remember to Save Changes!');
                        }}
                        className="p-1.5 rounded-sm border border-red-100 text-red-600 hover:text-red-800 hover:bg-red-50 hover:border-red-300 transition-all"
                        title="Delete Item"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Global Save Button */}
            <div className="flex justify-end pt-6 border-t border-nude-100 mt-8">
              <button
                type="button"
                onClick={() => saveAnnouncements(announcementsList)}
                disabled={savingAnnouncements}
                className="btn-primary py-3.5 px-8 font-body text-xs font-semibold tracking-widest uppercase flex items-center gap-2"
              >
                {savingAnnouncements ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {savingAnnouncements ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* TAB CONTENT: TRUST BADGES CRUD */}
      {activeTab === 'badges' && (
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {!showBadgeForm ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center bg-white border border-nude-200 p-6 shadow-sm">
                  <div>
                    <h2 className="font-heading text-xl text-daisy-800">Feature & Trust Badges</h2>
                    <p className="font-body text-xs text-daisy-400 mt-1">Manage the trust symbols and highlight metrics displayed on your home page and product page</p>
                  </div>
                  <button
                    onClick={() => handleOpenForm()}
                    className="btn-primary flex items-center gap-2 text-xs py-2.5 px-4"
                  >
                    <Plus size={16} />
                    Add New Badge
                  </button>
                </div>

                {badgesLoading ? (
                  <div className="flex flex-col items-center justify-center p-12 bg-white border border-nude-200">
                    <Loader2 size={36} className="text-daisy-500 animate-spin mb-4" />
                    <p className="font-body text-sm text-daisy-400">Loading trust badges...</p>
                  </div>
                ) : badges.length === 0 ? (
                  <div className="text-center p-12 bg-white border border-nude-200">
                    <Settings size={48} className="text-nude-300 mx-auto mb-4" />
                    <h3 className="font-heading text-lg text-daisy-800 mb-1">No trust badges configured</h3>
                    <p className="font-body text-sm text-daisy-400 mb-6">Create trust badges to showcase free shipping, quality guarantees, policies, and more.</p>
                    <button
                      onClick={() => handleOpenForm()}
                      className="btn-primary text-xs py-2.5 px-4 inline-flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Add Your First Badge
                    </button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {badges.map((badge) => {
                      const IconComponent = (LucideIcons as any)[badge.icon] || LucideIcons.HelpCircle;
                      return (
                        <div key={badge.id} className="bg-white border border-nude-200 p-6 shadow-sm hover:border-daisy-400 transition-colors flex flex-col justify-between">
                          <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 bg-nude-100 rounded-full flex items-center justify-center shrink-0">
                              <IconComponent size={22} className="text-daisy-700" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-body text-sm font-semibold text-daisy-900 truncate">{badge.title}</h3>
                              <p className="font-body text-xs text-daisy-500 mt-1 leading-relaxed line-clamp-2">{badge.description}</p>
                              <span className="inline-block mt-2 font-body text-[9px] bg-nude-100 text-daisy-600 px-2 py-0.5 tracking-wider uppercase">Order: {badge.sort_order}</span>
                            </div>
                          </div>

                          <div className="flex gap-2 border-t border-nude-100 pt-4 mt-2">
                            <button
                              onClick={() => handleOpenForm(badge)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-nude-200 hover:border-daisy-400 hover:bg-nude-50/30 text-xs font-body text-daisy-700 transition-all"
                            >
                              <Edit size={13} />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteBadge(badge.id)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-red-100 hover:border-red-400 hover:bg-red-50 text-xs font-body text-red-600 transition-all"
                            >
                              <Trash2 size={13} />
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="max-w-2xl mx-auto bg-white border border-nude-200 p-8 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-8">
                  <button onClick={handleCloseForm} className="text-daisy-500 hover:text-daisy-800 transition-colors">
                    <ArrowLeft size={20} />
                  </button>
                  <h2 className="font-heading text-2xl text-daisy-800 font-light">
                    {editingBadge ? 'Edit Trust Badge' : 'Add Trust Badge'}
                  </h2>
                </div>

                <form onSubmit={handleSaveBadge} className="space-y-6">
                  <div>
                    <label className="block font-body text-xs tracking-wider uppercase text-daisy-500 mb-2">Icon Symbol</label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {POPULAR_ICONS.map((ico) => {
                        const TargetIcon = (LucideIcons as any)[ico.name] || LucideIcons.HelpCircle;
                        const active = badgeIcon === ico.name;
                        return (
                          <button
                            key={ico.name}
                            type="button"
                            onClick={() => setBadgeIcon(ico.name)}
                            className={`flex flex-col items-center justify-center py-4 border text-center transition-all ${active
                                ? 'border-daisy-800 bg-daisy-800 text-cream'
                                : 'border-nude-200 text-daisy-600 hover:border-daisy-400 hover:bg-nude-50/20'
                              }`}
                          >
                            <TargetIcon size={20} className={active ? 'text-cream' : 'text-daisy-700'} />
                            <span className="font-body text-[9px] mt-2 block tracking-wider uppercase truncate w-full px-1">{ico.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <label className="block font-body text-xs tracking-wider uppercase text-daisy-500 mb-2">Badge Title</label>
                      <input
                        type="text"
                        value={badgeTitle}
                        onChange={(e) => setBadgeTitle(e.target.value)}
                        className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 bg-white"
                        placeholder="e.g. Free Shipping"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-body text-xs tracking-wider uppercase text-daisy-500 mb-2">Sort Order</label>
                      <input
                        type="number"
                        value={badgeOrder}
                        onChange={(e) => setBadgeOrder(parseInt(e.target.value) || 1)}
                        className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 bg-white"
                        min="1"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-body text-xs tracking-wider uppercase text-daisy-500 mb-2">Description</label>
                    <textarea
                      value={badgeDesc}
                      onChange={(e) => setBadgeDesc(e.target.value)}
                      className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 bg-white h-24 resize-none"
                      placeholder="e.g. On orders above ₹1000"
                    />
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-nude-100">
                    <button
                      type="submit"
                      disabled={savingBadge}
                      className="btn-primary py-3.5 px-8 font-body text-xs font-semibold tracking-widest uppercase flex items-center gap-2"
                    >
                      {savingBadge ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      {savingBadge ? 'Saving...' : 'Save Badge'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseForm}
                      className="border border-nude-200 hover:border-daisy-400 py-3.5 px-6 font-body text-xs text-daisy-700 transition-colors bg-white"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* TAB CONTENT: BRAND STORY */}
      {activeTab === 'story' && (
        <form onSubmit={saveStorySettings} className="space-y-8">
          <section className="bg-white border border-nude-200 p-6 shadow-sm">
            <h2 className="font-heading text-xl text-daisy-800 mb-6">Brand Story Content</h2>

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block font-body text-xs tracking-wider uppercase text-daisy-500 mb-2">Section Subtitle</label>
                <input
                  type="text"
                  value={storySubtitle}
                  onChange={(e) => setStorySubtitle(e.target.value)}
                  className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 bg-white"
                  placeholder="e.g. Our Story"
                />
              </div>
              <div>
                <label className="block font-body text-xs tracking-wider uppercase text-daisy-500 mb-2">Main Title Prefix</label>
                <input
                  type="text"
                  value={storyTitleMain}
                  onChange={(e) => setStoryTitleMain(e.target.value)}
                  className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 bg-white"
                  placeholder="e.g. Born from a Love of"
                />
              </div>
              <div>
                <label className="block font-body text-xs tracking-wider uppercase text-daisy-500 mb-2">Accent Title</label>
                <input
                  type="text"
                  value={storyTitleAccent}
                  onChange={(e) => setStoryTitleAccent(e.target.value)}
                  className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 bg-white"
                  placeholder="e.g. Timeless Elegance"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block font-body text-xs tracking-wider uppercase text-daisy-500 mb-2">First Paragraph</label>
                <textarea
                  value={storyParagraph1}
                  onChange={(e) => setStoryParagraph1(e.target.value)}
                  className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 bg-white h-32 resize-none"
                  placeholder="Tell the brand's origin story..."
                  required
                />
              </div>
              <div>
                <label className="block font-body text-xs tracking-wider uppercase text-daisy-500 mb-2">Second Paragraph</label>
                <textarea
                  value={storyParagraph2}
                  onChange={(e) => setStoryParagraph2(e.target.value)}
                  className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 bg-white h-32 resize-none"
                  placeholder="Highlight core values or design ethos..."
                />
              </div>
            </div>
          </section>

          <section className="bg-white border border-nude-200 p-6 shadow-sm">
            <h2 className="font-heading text-xl text-daisy-800 mb-6">Collage & Layout Images</h2>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Image 1 */}
              <div>
                <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-3">Collage Image 1 (Background / Large)</label>

                {storyImage1 && (
                  <div className="relative w-full h-44 border border-nude-200 bg-nude-50 mb-3 overflow-hidden group">
                    <Image src={storyImage1} alt="story image 1" fill className="object-cover" sizes="400px" />
                    <button
                      type="button"
                      onClick={() => setStoryImage1('')}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                <input
                  ref={fileInput1Ref}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageSelect(e.target.files, 1)}
                  className="hidden"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInput1Ref.current?.click()}
                    disabled={uploadingImage1}
                    className="flex-1 border border-nude-200 hover:border-daisy-400 py-2.5 px-4 font-body text-xs text-daisy-700 flex items-center justify-center gap-2 transition-all"
                  >
                    {uploadingImage1 ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    {uploadingImage1 ? 'Uploading...' : 'Upload Image 1'}
                  </button>
                  <input
                    type="text"
                    placeholder="or paste URL"
                    value={storyImage1}
                    onChange={(e) => setStoryImage1(e.target.value)}
                    className="flex-[2] border border-nude-200 px-3 py-2 font-body text-xs outline-none focus:border-daisy-400 bg-white"
                  />
                </div>
              </div>

              {/* Image 2 */}
              <div>
                <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-3">Collage Image 2 (Foreground / Overlay)</label>

                {storyImage2 && (
                  <div className="relative w-full h-44 border border-nude-200 bg-nude-50 mb-3 overflow-hidden group">
                    <Image src={storyImage2} alt="story image 2" fill className="object-cover" sizes="400px" />
                    <button
                      type="button"
                      onClick={() => setStoryImage2('')}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                <input
                  ref={fileInput2Ref}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageSelect(e.target.files, 2)}
                  className="hidden"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInput2Ref.current?.click()}
                    disabled={uploadingImage2}
                    className="flex-1 border border-nude-200 hover:border-daisy-400 py-2.5 px-4 font-body text-xs text-daisy-700 flex items-center justify-center gap-2 transition-all"
                  >
                    {uploadingImage2 ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    {uploadingImage2 ? 'Uploading...' : 'Upload Image 2'}
                  </button>
                  <input
                    type="text"
                    placeholder="or paste URL"
                    value={storyImage2}
                    onChange={(e) => setStoryImage2(e.target.value)}
                    className="flex-[2] border border-nude-200 px-3 py-2 font-body text-xs outline-none focus:border-daisy-400 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Collage Badge Overlay */}
            <div className="grid md:grid-cols-2 gap-5 mt-6 border-t border-nude-100 pt-6">
              <div>
                <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Stat Badge Number</label>
                <input
                  type="text"
                  value={storyBadgeNumber}
                  onChange={(e) => setStoryBadgeNumber(e.target.value)}
                  className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 bg-white"
                  placeholder="e.g. 10K+"
                />
              </div>
              <div>
                <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Stat Badge Description</label>
                <input
                  type="text"
                  value={storyBadgeText}
                  onChange={(e) => setStoryBadgeText(e.target.value)}
                  className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 bg-white"
                  placeholder="e.g. Happy Customers"
                />
              </div>
            </div>
          </section>

          {/* Metrics block */}
          <section className="bg-white border border-nude-200 p-6 shadow-sm">
            <h2 className="font-heading text-xl text-daisy-800 mb-6">Highlights & Metrics</h2>

            <div className="space-y-4">
              {/* Metric 1 */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-nude-100">
                <div>
                  <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-400 mb-2">Metric 1 Stat</label>
                  <input
                    type="text"
                    value={storyMetric1Number}
                    onChange={(e) => setStoryMetric1Number(e.target.value)}
                    className="w-full border border-nude-200 px-4 py-2 font-body text-sm outline-none focus:border-daisy-400 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-400 mb-2">Metric 1 Description</label>
                  <input
                    type="text"
                    value={storyMetric1Text}
                    onChange={(e) => setStoryMetric1Text(e.target.value)}
                    className="w-full border border-nude-200 px-4 py-2 font-body text-sm outline-none focus:border-daisy-400 bg-white"
                  />
                </div>
              </div>

              {/* Metric 2 */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-nude-100">
                <div>
                  <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-400 mb-2">Metric 2 Stat</label>
                  <input
                    type="text"
                    value={storyMetric2Number}
                    onChange={(e) => setStoryMetric2Number(e.target.value)}
                    className="w-full border border-nude-200 px-4 py-2 font-body text-sm outline-none focus:border-daisy-400 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-400 mb-2">Metric 2 Description</label>
                  <input
                    type="text"
                    value={storyMetric2Text}
                    onChange={(e) => setStoryMetric2Text(e.target.value)}
                    className="w-full border border-nude-200 px-4 py-2 font-body text-sm outline-none focus:border-daisy-400 bg-white"
                  />
                </div>
              </div>

              {/* Metric 3 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-400 mb-2">Metric 3 Stat</label>
                  <input
                    type="text"
                    value={storyMetric3Number}
                    onChange={(e) => setStoryMetric3Number(e.target.value)}
                    className="w-full border border-nude-200 px-4 py-2 font-body text-sm outline-none focus:border-daisy-400 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-400 mb-2">Metric 3 Description</label>
                  <input
                    type="text"
                    value={storyMetric3Text}
                    onChange={(e) => setStoryMetric3Text(e.target.value)}
                    className="w-full border border-nude-200 px-4 py-2 font-body text-sm outline-none focus:border-daisy-400 bg-white"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Button CTA */}
          <section className="bg-white border border-nude-200 p-6 shadow-sm">
            <h2 className="font-heading text-xl text-daisy-800 mb-6">Call To Action Button</h2>
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Button Text</label>
                <input
                  type="text"
                  value={storyButtonText}
                  onChange={(e) => setStoryButtonText(e.target.value)}
                  className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 bg-white"
                  required
                />
              </div>
              <div>
                <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Button Target Link</label>
                <input
                  type="text"
                  value={storyButtonLink}
                  onChange={(e) => setStoryButtonLink(e.target.value)}
                  className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 bg-white"
                  required
                />
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={savingStory || uploadingImage1 || uploadingImage2}
              className="btn-primary py-3.5 px-8 font-body text-xs font-semibold tracking-widest uppercase flex items-center gap-2"
            >
              {savingStory ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {savingStory ? 'Saving Settings...' : 'Save Brand Story'}
            </button>
          </div>
        </form>
      )}

      {/* TAB CONTENT: WHATSAPP CONTACTS CRUD */}
      {activeTab === 'whatsapp' && (
        <div className="space-y-8 max-w-4xl">
          {/* Main Info section */}
          <section className="bg-white border border-nude-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-heading text-xl text-daisy-800 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse inline-block" />
                  WhatsApp Contacts Management
                </h2>
                <p className="font-body text-xs text-daisy-400 mt-1">
                  Manage multiple WhatsApp support channels. Mark one as the active/primary channel to receive customer enquiries and orders automatically on the site.
                </p>
              </div>
            </div>

            {/* Active primary alert banner */}
            <div className="bg-cream/40 border border-nude-200 p-4 rounded-sm flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                  <MessageCircle size={20} fill="currentColor" className="text-green-600" />
                </div>
                <div>
                  <h4 className="font-body text-xs font-semibold text-daisy-900">Current Active Number</h4>
                  <p className="font-body text-xs text-daisy-500 mt-0.5">
                    {whatsappList.find(c => c.number === primaryWhatsapp)?.label || 'Primary support'} ({primaryWhatsapp || 'Not configured'})
                  </p>
                </div>
              </div>
              <span className="font-body text-[10px] uppercase tracking-wider bg-green-50 text-green-700 font-semibold px-2 py-0.5 rounded-sm border border-green-100">
                Live on Site
              </span>
            </div>

            {/* Contacts Table/List */}
            <div className="border border-nude-200 rounded-sm overflow-hidden bg-white">
              {whatsappList.length === 0 ? (
                <div className="text-center p-8 text-daisy-400 font-body text-xs">
                  No WhatsApp contacts configured. Add a number below to get started.
                </div>
              ) : (
                <div className="divide-y divide-nude-100">
                  {whatsappList.map((contact, idx) => {
                    const isPrimary = contact.number === primaryWhatsapp;
                    return (
                      <div key={idx} className={`p-4 flex items-center justify-between transition-all ${isPrimary ? 'bg-nude-50/20' : 'hover:bg-nude-50/10'}`}>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={async () => {
                              const updatedList = whatsappList.map((c, i) => ({
                                ...c,
                                is_primary: i === idx
                              }));
                              await saveWhatsappSettings(updatedList, contact.number);
                            }}
                            className={`p-1.5 rounded-full transition-all ${isPrimary ? 'text-amber-500' : 'text-daisy-300 hover:text-amber-500'}`}
                            title={isPrimary ? 'Primary Active Number' : 'Set as Active Number'}
                          >
                            <Star size={18} fill={isPrimary ? 'currentColor' : 'none'} />
                          </button>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-body text-sm font-semibold text-daisy-900">{contact.label}</span>
                              {isPrimary && (
                                <span className="font-body text-[9px] bg-green-50 text-green-600 border border-green-100 px-1.5 py-0.5 rounded-sm font-medium tracking-wide uppercase">
                                  Primary / Active
                                </span>
                              )}
                            </div>
                            <div className="font-body text-xs text-daisy-500 mt-0.5">+{contact.number}</div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingWaIndex(idx);
                              setWaLabel(contact.label);
                              setWaNumberInput(contact.number);
                            }}
                            className="p-1.5 rounded-sm border border-nude-200 text-daisy-600 hover:text-daisy-900 hover:border-daisy-400 transition-all bg-white shadow-xs"
                            title="Edit Contact"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={async () => {
                              if (isPrimary && whatsappList.length > 1) {
                                toast.error('Please set another number as primary before deleting this one.');
                                return;
                              }
                              if (!confirm(`Are you sure you want to delete "${contact.label}"?`)) return;

                              const updatedList = whatsappList.filter((_, i) => i !== idx);
                              let newPrimary = primaryWhatsapp;
                              if (isPrimary) {
                                newPrimary = updatedList.length > 0 ? updatedList[0].number : '';
                                if (updatedList.length > 0) {
                                  updatedList[0].is_primary = true;
                                }
                              }
                              await saveWhatsappSettings(updatedList, newPrimary);
                            }}
                            className="p-1.5 rounded-sm border border-red-100 text-red-600 hover:text-red-800 hover:bg-red-50 hover:border-red-300 transition-all shadow-xs"
                            title="Delete Contact"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Form to Add / Edit Contacts */}
          <section className="bg-white border border-nude-200 p-6 shadow-sm max-w-xl">
            <h3 className="font-heading text-lg text-daisy-800 mb-4">
              {editingWaIndex !== null ? '🖊️ Edit WhatsApp Contact' : '➕ Add New WhatsApp Contact'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block font-body text-[11px] font-semibold text-daisy-600 mb-1">
                  Contact Label / Purpose *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sales Support, Custom Design Assistance"
                  value={waLabel}
                  onChange={(e) => setWaLabel(e.target.value)}
                  className="w-full border border-nude-200 px-4 py-2.5 font-body text-xs outline-none focus:border-daisy-400 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-body text-[11px] font-semibold text-daisy-600 mb-1">
                  WhatsApp Number *
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 918610344774"
                  value={waNumberInput}
                  onChange={(e) => setWaNumberInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full border border-nude-200 px-4 py-2.5 font-body text-xs outline-none focus:border-daisy-400 bg-white"
                  required
                />
                <p className="font-body text-[10px] text-daisy-400 mt-1">
                  Include country code (e.g. 91 for India) without '+' symbol, spaces, or dashes.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={async () => {
                    if (!waLabel.trim() || !waNumberInput.trim()) {
                      toast.error('Please enter both label and number.');
                      return;
                    }
                    if (waNumberInput.length < 10 || waNumberInput.length > 15) {
                      toast.error('Please enter a valid WhatsApp number (10 to 15 digits including country code).');
                      return;
                    }

                    const updatedList = [...whatsappList];
                    if (editingWaIndex !== null) {
                      // Update existing
                      updatedList[editingWaIndex] = {
                        ...updatedList[editingWaIndex],
                        label: waLabel.trim(),
                        number: waNumberInput.trim()
                      };

                      // If the updated one was primary, update primaryWhatsapp value too
                      let newPrimary = primaryWhatsapp;
                      if (whatsappList[editingWaIndex].number === primaryWhatsapp) {
                        newPrimary = waNumberInput.trim();
                      }

                      await saveWhatsappSettings(updatedList, newPrimary);
                    } else {
                      // Add new
                      const isFirst = updatedList.length === 0;
                      const newContact = {
                        label: waLabel.trim(),
                        number: waNumberInput.trim(),
                        is_primary: isFirst
                      };
                      updatedList.push(newContact);

                      await saveWhatsappSettings(updatedList, isFirst ? waNumberInput.trim() : primaryWhatsapp);
                    }

                    // Reset form state
                    setWaLabel('');
                    setWaNumberInput('');
                    setEditingWaIndex(null);
                  }}
                  disabled={savingWhatsapp}
                  className="btn-primary flex-1 py-3 font-body text-xs font-semibold tracking-wider flex items-center justify-center gap-1.5"
                >
                  {savingWhatsapp ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  {editingWaIndex !== null ? 'Update Contact' : 'Add Contact'}
                </button>

                {editingWaIndex !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      setWaLabel('');
                      setWaNumberInput('');
                      setEditingWaIndex(null);
                    }}
                    className="border border-nude-200 hover:border-daisy-400 py-3 px-5 font-body text-xs text-daisy-600 transition-colors bg-white"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* TAB CONTENT: DATABASE SETUP */}
      {activeTab === 'setup' && (
        <div className="max-w-3xl space-y-6">
          <section className="bg-white border border-nude-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-heading text-xl text-daisy-800">Store Setup</h2>
                <p className="font-body text-xs text-daisy-400 mt-1">Initialize categories and storage for your store</p>
              </div>
              <button onClick={runFullSetup}
                disabled={catStatus === 'running' || bucketStatus === 'running'}
                className="btn-primary flex items-center gap-2 disabled:opacity-60 text-xs py-2.5 px-4">
                <RefreshCw size={16} />
                Run Full Setup
              </button>
            </div>

            {/* Categories */}
            <div className="border border-nude-200 p-4 mb-4 rounded-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <StatusIcon status={catStatus} />
                  <div>
                    <p className="font-body text-sm font-medium text-daisy-900 flex items-center gap-2">
                      <Database size={15} className="text-daisy-500" />
                      Seed Categories
                    </p>
                    <p className="font-body text-xs text-daisy-400">
                      Adds: {DEFAULT_CATEGORIES.map(c => c.name).join(', ')}
                    </p>
                  </div>
                </div>
                <button onClick={seedCategories}
                  disabled={catStatus === 'running'}
                  className="btn-outline text-xs py-2 px-4 disabled:opacity-50">
                  {catStatus === 'running' ? 'Running...' : 'Run'}
                </button>
              </div>
              {catMsg && (
                <p className={`font-body text-xs mt-2 p-2 rounded-sm ${catStatus === 'error' ? 'bg-red-50 text-red-600 border border-red-100' :
                  catStatus === 'done' ? 'bg-green-50 text-green-700 border border-green-100' :
                    'bg-nude-50 text-daisy-600'
                  }`}>
                  {catMsg}
                </p>
              )}
            </div>

            {/* Storage */}
            <div className="border border-nude-200 p-4 rounded-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <StatusIcon status={bucketStatus} />
                  <div>
                    <p className="font-body text-sm font-medium text-daisy-900 flex items-center gap-2">
                      <HardDrive size={15} className="text-daisy-500" />
                      Create Storage Bucket
                    </p>
                    <p className="font-body text-xs text-daisy-400">
                      Creates "product-images" bucket for file uploads
                    </p>
                  </div>
                </div>
                <button onClick={createBucket}
                  disabled={bucketStatus === 'running'}
                  className="btn-outline text-xs py-2 px-4 disabled:opacity-50">
                  {bucketStatus === 'running' ? 'Running...' : 'Run'}
                </button>
              </div>
              {bucketMsg && (
                <p className={`font-body text-xs mt-2 p-2 whitespace-pre-line rounded-sm ${bucketStatus === 'error' ? 'bg-red-50 text-red-600 border border-red-100' :
                  bucketStatus === 'done' ? 'bg-green-50 text-green-700 border border-green-100' :
                    'bg-nude-50 text-daisy-600'
                  }`}>
                  {bucketMsg}
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
