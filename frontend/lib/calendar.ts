import type { FollowUpAppointment, FollowUpObservation } from './api';

export const careTimeZone = 'America/Sao_Paulo';

const dateParts = new Intl.DateTimeFormat('en-CA', {
  timeZone: careTimeZone, year: 'numeric', month: '2-digit', day: '2-digit',
});

export function dateKey(value: string | Date): string {
  const parts = dateParts.formatToParts(typeof value === 'string' ? new Date(value) : value);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function monthKey(value: string): string { return value.slice(0, 7); }

export function moveMonth(value: string, delta: number): string {
  const [year, month] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1 + delta, 1)).toISOString().slice(0, 7);
}

export function monthDays(value: string): (string | null)[] {
  const [year, month] = value.split('-').map(Number);
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const count = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return [
    ...Array<string | null>(firstWeekday).fill(null),
    ...Array.from({ length: count }, (_, index) => `${value}-${String(index + 1).padStart(2, '0')}`),
  ];
}

export function clockTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

export function minutesFromTime(value: string): number | null {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

export type ObservationDayGroup = {
  day: string;
  label: string;
  observations: FollowUpObservation[];
};

const observationTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: careTimeZone, hour: '2-digit', minute: '2-digit', hour12: false,
});
const observationDayFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric',
});

export function observationTime(value: string): string {
  return observationTimeFormatter.format(new Date(value));
}

export function groupObservationsByDay(observations: FollowUpObservation[]): ObservationDayGroup[] {
  const groups = new Map<string, FollowUpObservation[]>();
  const ordered = [...observations].sort((left, right) =>
    Date.parse(right.occurredAt) - Date.parse(left.occurredAt));

  for (const observation of ordered) {
    const day = dateKey(observation.occurredAt);
    const group = groups.get(day) ?? [];
    group.push(observation);
    groups.set(day, group);
  }

  return [...groups].map(([day, items]) => ({
    day,
    label: observationDayFormatter.format(new Date(`${day}T12:00:00Z`)),
    observations: items,
  }));
}

export function professionalSummary(appointments: FollowUpAppointment[], now: number) {
  const currentMonth = monthKey(dateKey(new Date(now)));
  return appointments.reduce((summary, appointment) => {
    const inCurrentMonth = monthKey(dateKey(appointment.startsAt)) === currentMonth;
    if (appointment.state === 'cancelled') {
      if (inCurrentMonth) summary.cancelledThisMonth += 1;
    } else if (appointment.patientResponse === 'confirmed') {
      if (inCurrentMonth) summary.confirmedThisMonth += 1;
    } else if (appointment.patientResponse === 'pending' && Date.parse(appointment.startsAt) >= now) {
      summary.awaitingConfirmation += 1;
    }
    return summary;
  }, { cancelledThisMonth: 0, confirmedThisMonth: 0, awaitingConfirmation: 0 });
}
