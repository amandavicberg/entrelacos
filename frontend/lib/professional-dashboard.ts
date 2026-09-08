export type DemoPatient = { id: string; name: string; birthMonth: number; birthDay: number };
export type Confirmation = 'pending' | 'confirmed' | 'declined';
export type DemoAppointment = { id: string; patientId: string; time: string; confirmation: Confirmation };
export type Birthday = DemoPatient & { date: Date; daysUntil: number };
export const BIRTHDAY_WINDOW_DAYS = 30;

export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.length ? `${words[0][0]}${words.length > 1 ? words[words.length - 1][0] : ''}`.toLocaleUpperCase('pt-BR') : 'P';
}

function birthdayInYear(patient: DemoPatient, year: number): Date {
  // Demonstration convention: February 29 is observed on February 28 in non-leap years.
  const lastDay = new Date(year, patient.birthMonth, 0).getDate();
  return new Date(year, patient.birthMonth - 1, Math.min(patient.birthDay, lastDay));
}

function calendarDay(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000;
}

export function upcomingBirthdays(patients: DemoPatient[], base: Date): Birthday[] {
  return patients.map((patient) => {
    let date = birthdayInYear(patient, base.getFullYear());
    if (calendarDay(date) < calendarDay(base)) date = birthdayInYear(patient, base.getFullYear() + 1);
    return { ...patient, date, daysUntil: calendarDay(date) - calendarDay(base) };
  }).filter(({ daysUntil }) => daysUntil <= BIRTHDAY_WINDOW_DAYS)
    .sort((a, b) => a.daysUntil - b.daysUntil || a.name.localeCompare(b.name, 'pt-BR'));
}

export function monthlyBirthdays(patients: DemoPatient[], base: Date): Birthday[] {
  return patients.filter((patient) => patient.birthMonth === base.getMonth() + 1)
    .map((patient) => {
      const date = birthdayInYear(patient, base.getFullYear());
      return { ...patient, date, daysUntil: calendarDay(date) - calendarDay(base) };
    }).sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function birthdayLabel(days: number): string {
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Amanhã';
  return days < 0 ? 'Já comemorou' : `Em ${days} dias`;
}

export function appointmentSummary(patients: DemoPatient[], appointments: DemoAppointment[]) {
  return {
    patients: patients.length,
    today: appointments.length,
    pending: appointments.filter((item) => item.confirmation === 'pending').length,
  };
}

export function createDashboardDemo(base: Date) {
  const names = ['Ana Beatriz', 'Lucas Oliveira', 'Clara Martins', 'Pedro Santos', 'Sofia Almeida', 'Rafael Costa'];
  const offsets = [0, 1, 5, 12, 20, 45];
  const patients: DemoPatient[] = names.map((name, index) => {
    const date = new Date(base.getFullYear(), base.getMonth(), base.getDate() + offsets[index]);
    return { id: `demo-${index + 1}`, name, birthMonth: date.getMonth() + 1, birthDay: date.getDate() };
  });
  const appointments: DemoAppointment[] = [
    { id: 'demo-visit-1', patientId: patients[0].id, time: '09:00', confirmation: 'confirmed' },
    { id: 'demo-visit-2', patientId: patients[1].id, time: '10:30', confirmation: 'pending' },
    { id: 'demo-visit-3', patientId: patients[2].id, time: '14:00', confirmation: 'declined' },
  ];
  return { patients, appointments };
}

// Development-only fixture selection; it never bypasses authentication or changes real profile data.
export type DashboardScenario = 'ready' | 'empty' | 'loading' | 'error';
export function dashboardScenario(value: string | string[] | undefined, development: boolean): DashboardScenario {
  return development && (value === 'empty' || value === 'loading' || value === 'error') ? value : 'ready';
}
