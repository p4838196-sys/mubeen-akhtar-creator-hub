'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function loginAction(_prevState: { error: string | null }, formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: 'Invalid email or password.' };
  }

  // Extra check: being able to log in only makes you a Supabase Auth user.
  // Being an ADMIN additionally requires a row in user_roles (created
  // manually per README). Reject non-admin logins from the admin area.
  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', data.user.id)
    .eq('role', 'admin')
    .maybeSingle();

  if (!roleRow) {
    await supabase.auth.signOut();
    return { error: 'This account is not authorized for admin access.' };
  }

  redirect('/admin');
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}
