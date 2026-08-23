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

  return supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
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
