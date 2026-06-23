'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

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
