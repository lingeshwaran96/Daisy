// src/app/admin/products/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Edit, Trash2, Eye, EyeOff, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/types/database';

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  async function fetchProducts() {
    setLoading(true);
    let q = supabase.from('products').select('*').order('created_at', { ascending: false });
    if (search) q = q.ilike('name', `%${search}%`);
    const { data } = await q;
    setProducts((data as Product[]) || []);
    setLoading(false);
  }

  useEffect(() => { fetchProducts(); }, [search]);

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('products').update({ is_active: !current }).eq('id', id);
    setProducts(products.map((p) => (p.id === id ? { ...p, is_active: !current } : p)));
    toast.success(current ? 'Product hidden' : 'Product visible');
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    setDeleting(id);
    await supabase.from('products').delete().eq('id', id);
    setProducts(products.filter((p) => p.id !== id));
    setDeleting(null);
    toast.success('Product deleted');
  };

  return (
    <div className="p-6 md:p-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-4xl text-daisy-900 font-light">Products</h1>
          <p className="font-body text-sm text-daisy-500 mt-1">{products.length} products total</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary flex items-center gap-2 self-start">
          <Plus size={16} />
          Add Product
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-daisy-400" />
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-80 pl-10 pr-4 py-3 border border-nude-200 bg-white font-body text-sm text-daisy-900 placeholder-daisy-300 outline-none focus:border-daisy-400 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-nude-200 overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead className="bg-nude-50 border-b border-nude-200">
            <tr>
              {['Image', 'Name', 'Price', 'Stock', 'Status', 'Actions'].map((h) => (
                <th key={h} className="text-left px-5 py-3 font-body text-[10px] tracking-widest uppercase text-daisy-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-nude-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-5 py-4"><div className="skeleton h-5 w-20" /></td>
                  ))}
                </tr>
              ))
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center font-body text-sm text-daisy-400">
                  No products found.{' '}
                  <Link href="/admin/products/new" className="text-daisy-700 underline">Add your first product</Link>
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-nude-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="relative w-12 h-14 bg-nude-100 flex-shrink-0">
                      {product.images?.[0] && (
                        <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="48px" />
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-body text-sm font-medium text-daisy-900 max-w-xs truncate">{product.name}</p>
                    <p className="font-body text-xs text-daisy-400 mt-0.5">{product.material}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-body text-sm text-daisy-900">₹{(product.offer_price || product.price).toLocaleString('en-IN')}</p>
                    {product.offer_price && (
                      <p className="font-body text-xs text-daisy-400 line-through">₹{product.price.toLocaleString('en-IN')}</p>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`font-body text-sm ${product.stock === 0 ? 'text-red-500' : product.stock <= 5 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {product.stock === 0 ? 'Out of Stock' : `${product.stock} units`}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`font-body text-xs px-2.5 py-1 ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {product.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/products/${product.id}/edit`} className="p-1.5 text-daisy-500 hover:text-daisy-900 transition-colors" title="Edit">
                        <Edit size={15} />
                      </Link>
                      <button onClick={() => toggleActive(product.id, product.is_active)} className="p-1.5 text-daisy-500 hover:text-daisy-900 transition-colors" title={product.is_active ? 'Hide' : 'Show'}>
                        {product.is_active ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      <button onClick={() => deleteProduct(product.id)} disabled={deleting === product.id} className="p-1.5 text-daisy-500 hover:text-red-500 transition-colors" title="Delete">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
