// src/app/api/notifications/inbox/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { contact } = await req.json();
    const searchContact = (contact || '').trim();

    if (!searchContact) {
      return NextResponse.json({ error: 'Phone number or Gmail ID is required' }, { status: 400 });
    }

    const isEmail = searchContact.includes('@');
    let userIds: string[] = [];
    let orderIds: string[] = [];
    let orderNumbers: string[] = [];

    // 1. Resolve registered user IDs matching search criteria
    if (isEmail) {
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', searchContact.toLowerCase());
      if (users) userIds = users.map(u => u.id);
    } else {
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('phone', searchContact);
      if (users) userIds = users.map(u => u.id);
    }

    // 2. Fetch guest or registered order records matching contact details
    let ordersQuery = supabaseAdmin.from('orders').select('id, order_number, user_id, shipping_address');
    
    if (isEmail) {
      const { data: orders } = await ordersQuery.ilike('users.email', `%${searchContact}%`);
      if (orders) {
        orders.forEach(o => {
          orderIds.push(o.id);
          orderNumbers.push(o.order_number);
          if (o.user_id) userIds.push(o.user_id);
        });
      }
    } else {
      // Clean phone number formatting to search accurately
      const cleanPhone = searchContact.replace(/\D/g, '').slice(-10);
      const { data: orders } = await ordersQuery;
      
      if (orders) {
        orders.forEach(o => {
          const shipPhone = (o.shipping_address?.phone || '').replace(/\D/g, '').slice(-10);
          if (shipPhone === cleanPhone) {
            orderIds.push(o.id);
            orderNumbers.push(o.order_number);
            if (o.user_id) userIds.push(o.user_id);
          }
        });
      }
    }

    // De-duplicate user IDs
    userIds = Array.from(new Set(userIds));

    // 3. Query all notifications inside the DB
    const { data: notifs, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 4. Filter notifications that belong to the user or order metadata
    const filteredNotifs = (notifs || []).filter((n: any) => {
      // Belongs to resolved user IDs
      if (n.user_id && userIds.includes(n.user_id)) return true;

      // Belongs to guest order metadata matching order_id or order_number
      const notifOrderId = n.metadata?.order_id;
      const notifOrderNum = n.metadata?.order_number || n.metadata?.temp_order_number;
      
      if (notifOrderId && orderIds.includes(notifOrderId)) return true;
      if (notifOrderNum && orderNumbers.includes(notifOrderNum)) return true;

      return false;
    });

    return NextResponse.json({ notifications: filteredNotifs });
  } catch (err: any) {
    console.error('Inbox retrieval error:', err);
    return NextResponse.json({ error: 'Failed to retrieve inbox messages' }, { status: 500 });
  }
}
