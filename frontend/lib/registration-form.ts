import type { AppRole } from './registration.types';

export type FormValues = {
  fullName: string;
  birthDate: string;
  phone: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  role: AppRole;
  specialty: string;
  registrationType: string;
  registrationNumber: string;
};

export type FormErrors = Partial<Record<keyof FormValues, string>>;

export const initialValues: FormValues = {
  fullName: '',
  birthDate: '',
  phone: '',
  email: '',
  password: '',
  passwordConfirmation: '',
  role: 'patient',
  specialty: '',
  registrationType: '',
  registrationNumber: '',
};

export function validateRegistration(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  const requiredFields: (keyof FormValues)[] = [
    'fullName',
    'birthDate',
    'phone',
    'email',
    'password',
    'passwordConfirmation',
  ];

  for (const field of requiredFields) {
    if (!values[field].trim()) errors[field] = 'Preencha este campo.';
  }
  if (values.fullName.trim().length > 160) errors.fullName = 'Use até 160 caracteres.';
  if (values.email && !/^\S+@\S+\.\S+$/.test(values.email.trim())) {
    errors.email = 'Informe um e-mail válido.';
  }
  if (values.password && values.password.length < 8) {
    errors.password = 'A senha deve ter pelo menos 8 caracteres.';
  }
  if (values.passwordConfirmation && values.password !== values.passwordConfirmation) {
    errors.passwordConfirmation = 'As senhas precisam ser iguais.';
  }
  if (values.birthDate && !isValidBirthDate(values.birthDate)) {
    errors.birthDate = 'Informe uma data válida no formato DD/MM/AAAA.';
  }
  if (values.phone && ![10, 11].includes(values.phone.replace(/\D/g, '').length)) {
    errors.phone = 'Informe um telefone válido.';
  }
  if (values.role === 'professional') {
    for (const field of ['specialty', 'registrationType', 'registrationNumber'] as const) {
      if (!values[field].trim()) errors[field] = 'Preencha este campo.';
    }
  }
  return errors;
}

function isValidBirthDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return false;

  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return (
    Number(year) >= 1900
    && date.getFullYear() === Number(year)
    && date.getMonth() === Number(month) - 1
    && date.getDate() === Number(day)
    && date <= new Date()
  );
}

export function birthDateToIso(value: string) {
  const [day, month, year] = value.split('/');
  return `${year}-${month}-${day}`;
}

export function formatBirthDate(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  const split = digits.length === 10 ? 6 : 7;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, split)}-${digits.slice(split)}`;
}

