'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const ADMIN_PASSWORD = 'GameMaster28';

export async function adminLogin(formData: FormData) {
  const password = formData.get('password') as string;

  if (password === ADMIN_PASSWORD) {
    // Authentification réussie
    const cookieStore = await cookies();
    cookieStore.set('hms_admin_session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1 semaine
    });

    // Redirection vers le tableau de bord
    redirect('/admin/epreuves');
  } else {
    return { error: 'Mot de passe incorrect.' };
  }
}

export async function adminLogout() {
  const cookieStore = await cookies();
  cookieStore.delete('hms_admin_session');
  redirect('/admin/login');
}

export async function candidateLogin(username: string, passcode: string) {
  // Fetch candidate by id (passcode)
  const { data: candidate, error } = await supabase
    .from('candidates')
    .select('*')
    .eq('id', passcode)
    .single();

  if (error || !candidate) {
    return { error: 'Code secret invalide ou candidat introuvable.' };
  }

  // Verify name (case-insensitive for convenience)
  if (candidate.name.toLowerCase() !== username.toLowerCase()) {
    return { error: 'Identifiant incorrect pour ce code.' };
  }

  // Authentification réussie
  const cookieStore = await cookies();
  cookieStore.set('hms_candidate_session', candidate.id.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 1 semaine
  });

  return { success: true, candidateId: candidate.id };
}

export async function candidateLogout() {
  const cookieStore = await cookies();
  cookieStore.delete('hms_candidate_session');
  redirect('/login');
}
