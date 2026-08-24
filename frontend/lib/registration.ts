import * as Linking from 'expo-linking';
import type { AppRole } from './registration.types';
import { getSupabaseClient } from './supabase';

export type RegistrationData = {
  fullName: string;
  birthDate: string;
  phone: string;
  email: string;
  password: string;
  role: AppRole;
  specialty?: string;
  registrationType?: string;
  registrationNumber?: string;
};

export async function registerUser(data: RegistrationData) {
  const supabase = getSupabaseClient();
  const confirmationRedirectUrl = Linking.createURL('login');

  return supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: confirmationRedirectUrl,
      data: {
        full_name: data.fullName,
        birth_date: data.birthDate,
        phone: data.phone,
        role: data.role,
        ...(data.role === 'professional'
          ? {
              specialty: data.specialty,
              registration_type: data.registrationType,
              registration_number: data.registrationNumber,
            }
          : {}),
      },
    },
  });
}

export async function resendConfirmationEmail(email: string) {
  const supabase = getSupabaseClient();
  const confirmationRedirectUrl = Linking.createURL('login');

  return supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: confirmationRedirectUrl,
    },
  });
}
