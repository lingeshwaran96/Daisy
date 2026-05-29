// src/app/admin/users/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Search, Shield, ShieldOff, Users as UsersIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types/database';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  async function fetchUsers() {
    setLoading(true);
    let q = supabase.from('users').select('*').order('created_at', { ascending: false });
    if (search) q = q.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    const { data } = await q;
    setUsers((data as User[]) || []);
    setLoading(false);
  }

  useEffect(() => { fetchUsers(); }, [search]);

  const updateRole = async (id: string, newRole: 'user' | 'admin' | 'seller') => {
    if (!confirm(`Change user's role to ${newRole}?`)) return;
    const { error } = await supabase.from('users').update({ role: newRole }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    setUsers(u => u.map(x => x.id === id ? { ...x, role: newRole } : x));
    toast.success(`User role updated to ${newRole}`);
  };

  const adminCount = users.filter(u => u.role === 'admin').length;
  const sellerCount = users.filter(u => u.role === 'seller').length;
  const userCount = users.filter(u => u.role === 'user').length;

  return (
    <div className="p-6 md:p-10">
      <div className="mb-8">
        <h1 className="font-heading text-4xl text-daisy-900 font-light">Users</h1>
        <p className="font-body text-sm text-daisy-500 mt-1">{users.length} users total</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Users', value: users.length, color: 'bg-daisy-100 text-daisy-800' },
          { label: 'Admins', value: adminCount, color: 'bg-purple-100 text-purple-800' },
          { label: 'Sellers', value: sellerCount, color: 'bg-amber-100 text-amber-800' },
          { label: 'Customers', value: userCount, color: 'bg-green-100 text-green-800' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-nude-200 p-5">
            <p className="font-body text-[10px] tracking-widest uppercase text-daisy-500">{s.label}</p>
            <p className={`font-heading text-2xl mt-1 ${s.color.split(' ')[1]}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-daisy-400" />
        <input type="text" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full md:w-80 pl-10 pr-4 py-3 border border-nude-200 bg-white font-body text-sm text-daisy-900 placeholder-daisy-300 outline-none focus:border-daisy-400 transition-colors" />
      </div>

      {/* Table */}
      <div className="bg-white border border-nude-200 overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead className="bg-nude-50 border-b border-nude-200">
            <tr>
              {['User', 'Email', 'Phone', 'Role', 'Joined', 'Actions'].map(h => (
                <th key={h} className="text-left px-5 py-3 font-body text-[10px] tracking-widest uppercase text-daisy-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-nude-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-5 py-4"><div className="skeleton h-4 w-20" /></td>)}</tr>
              ))
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-12 text-center font-body text-sm text-daisy-400">No users found</td></tr>
            ) : users.map(user => (
              <tr key={user.id} className="hover:bg-nude-50 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-daisy-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="font-body text-sm font-medium text-daisy-800">
                        {(user.full_name || user.email)?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <p className="font-body text-sm font-medium text-daisy-900 truncate max-w-[150px]">
                      {user.full_name || '—'}
                    </p>
                  </div>
                </td>
                <td className="px-5 py-4 font-body text-sm text-daisy-600">{user.email}</td>
                <td className="px-5 py-4 font-body text-sm text-daisy-600">{user.phone || '—'}</td>
                <td className="px-5 py-4">
                  <span className={`font-body text-xs px-2.5 py-1 capitalize ${
                    user.role === 'admin'
                      ? 'bg-purple-100 text-purple-700'
                      : user.role === 'seller'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-5 py-4 font-body text-xs text-daisy-500">
                  {new Date(user.created_at).toLocaleDateString('en-IN')}
                </td>
                <td className="px-5 py-4">
                  <select value={user.role} onChange={e => updateRole(user.id, e.target.value as any)}
                    className="border border-nude-200 px-2 py-1.5 font-body text-xs text-daisy-700 outline-none focus:border-daisy-400 bg-white rounded cursor-pointer capitalize">
                    <option value="user">User</option>
                    <option value="seller">Seller</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
