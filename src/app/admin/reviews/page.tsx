// src/app/admin/reviews/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { CheckCircle, XCircle, Trash2, Star, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

type ReviewRow = {
  id: string; rating: number; title: string | null; comment: string | null;
  images: string[]; is_verified: boolean; is_approved: boolean; created_at: string;
  products?: { name: string; images: string[] } | null;
  users?: { full_name: string | null; email: string | null } | null;
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [search, setSearch] = useState('');

  async function fetchReviews() {
    setLoading(true);
    let q = supabase.from('reviews').select('*, products(name, images), users(full_name, email)')
      .order('created_at', { ascending: false });
    if (filter === 'pending') q = q.eq('is_approved', false);
    if (filter === 'approved') q = q.eq('is_approved', true);
    const { data } = await q;
    let result = (data as ReviewRow[]) || [];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(r =>
        r.products?.name?.toLowerCase().includes(s) ||
        r.users?.email?.toLowerCase().includes(s) ||
        r.comment?.toLowerCase().includes(s)
      );
    }
    setReviews(result);
    setLoading(false);
  }

  useEffect(() => { fetchReviews(); }, [filter, search]);

  const approveReview = async (id: string) => {
    await supabase.from('reviews').update({ is_approved: true }).eq('id', id);
    setReviews(r => r.map(x => x.id === id ? { ...x, is_approved: true } : x));
    toast.success('Review approved');
  };

  const rejectReview = async (id: string) => {
    await supabase.from('reviews').update({ is_approved: false }).eq('id', id);
    setReviews(r => r.map(x => x.id === id ? { ...x, is_approved: false } : x));
    toast.success('Review rejected');
  };

  const deleteReview = async (id: string) => {
    if (!confirm('Delete this review permanently?')) return;
    await supabase.from('reviews').delete().eq('id', id);
    setReviews(r => r.filter(x => x.id !== id));
    toast.success('Review deleted');
  };

  const pendingCount = reviews.filter(r => !r.is_approved).length;
  const approvedCount = reviews.filter(r => r.is_approved).length;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div className="p-6 md:p-10">
      <div className="mb-8">
        <h1 className="font-heading text-4xl text-daisy-900 font-light">Reviews</h1>
        <p className="font-body text-sm text-daisy-500 mt-1">{reviews.length} reviews total</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total', value: reviews.length, color: 'text-daisy-800' },
          { label: 'Pending', value: pendingCount, color: 'text-yellow-700' },
          { label: 'Approved', value: approvedCount, color: 'text-green-700' },
          { label: 'Avg Rating', value: `${avgRating} ★`, color: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-nude-200 p-5">
            <p className="font-body text-[10px] tracking-widest uppercase text-daisy-500">{s.label}</p>
            <p className={`font-heading text-2xl mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-daisy-400" />
          <input type="text" placeholder="Search reviews..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full md:w-64 pl-10 pr-4 py-3 border border-nude-200 bg-white font-body text-sm text-daisy-900 placeholder-daisy-300 outline-none focus:border-daisy-400 transition-colors" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'pending', 'approved'] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-4 py-2 font-body text-xs capitalize tracking-wide transition-colors border ${
                filter === s ? 'bg-daisy-900 text-cream border-daisy-900' : 'border-nude-200 text-daisy-600 hover:border-daisy-400'
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white border border-nude-200 p-8 flex justify-center">
            <div className="spinner text-daisy-400" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white border border-nude-200 p-12 text-center font-body text-sm text-daisy-400">
            No reviews found
          </div>
        ) : reviews.map(review => (
          <div key={review.id} className="bg-white border border-nude-200 p-5 hover:border-daisy-300 transition-colors">
            <div className="flex items-start gap-4">
              {/* Product image */}
              <div className="relative w-14 h-14 bg-nude-100 flex-shrink-0 overflow-hidden">
                {review.products?.images?.[0] && (
                  <Image src={review.products.images[0]} alt="" fill className="object-cover" sizes="56px" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center gap-3 mb-1">
                  <p className="font-body text-sm font-medium text-daisy-900 truncate">
                    {review.products?.name || 'Unknown Product'}
                  </p>
                  <span className={`font-body text-[10px] px-2 py-0.5 ${
                    review.is_approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {review.is_approved ? 'Approved' : 'Pending'}
                  </span>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={13} className={i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-daisy-200'} />
                  ))}
                  <span className="font-body text-xs text-daisy-500 ml-2">
                    by {review.users?.full_name || review.users?.email || 'Anonymous'}
                  </span>
                  <span className="font-body text-xs text-daisy-300 ml-auto">
                    {new Date(review.created_at).toLocaleDateString('en-IN')}
                  </span>
                </div>

                {/* Content */}
                {review.title && <p className="font-body text-sm font-medium text-daisy-800 mb-1">{review.title}</p>}
                {review.comment && <p className="font-body text-sm text-daisy-600 leading-relaxed">{review.comment}</p>}

                {/* Review images */}
                {review.images && review.images.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {review.images.map((img, i) => (
                      <div key={i} className="relative w-16 h-16 bg-nude-100 overflow-hidden">
                        <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {!review.is_approved && (
                  <button onClick={() => approveReview(review.id)} className="p-2 text-green-500 hover:text-green-700 transition-colors" title="Approve">
                    <CheckCircle size={18} />
                  </button>
                )}
                {review.is_approved && (
                  <button onClick={() => rejectReview(review.id)} className="p-2 text-yellow-500 hover:text-yellow-700 transition-colors" title="Reject">
                    <XCircle size={18} />
                  </button>
                )}
                <button onClick={() => deleteReview(review.id)} className="p-2 text-daisy-400 hover:text-red-500 transition-colors" title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
