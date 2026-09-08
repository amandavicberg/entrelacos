import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  appointmentSummary, birthdayLabel, createDashboardDemo, dashboardScenario,
  initials, monthlyBirthdays, upcomingBirthdays,
} from '../lib/professional-dashboard.ts';

const patient = (month, day) => ({ id: 'example', name: 'Pessoa fictícia', birthMonth: month, birthDay: day });

test('birthdays cross month/year boundaries using calendar days, including inclusive day 30', () => {
  const base = new Date(2026, 11, 31, 23, 59);
  assert.equal(upcomingBirthdays([patient(12, 31)], base)[0].daysUntil, 0);
  assert.equal(upcomingBirthdays([patient(1, 1)], base)[0].daysUntil, 1);
  assert.equal(upcomingBirthdays([patient(1, 30)], base)[0].daysUntil, 30);
  assert.equal(upcomingBirthdays([patient(1, 31)], base).length, 0);
  assert.equal(upcomingBirthdays([patient(10, 1)], new Date(2026, 8, 30))[0].daysUntil, 1);
});

test('leap-day birthdays follow February 28 convention only in non-leap years', () => {
  const leap = patient(2, 29);
  assert.equal(upcomingBirthdays([leap], new Date(2027, 1, 28))[0].daysUntil, 0);
  assert.equal(upcomingBirthdays([leap], new Date(2028, 1, 28))[0].daysUntil, 1);
  assert.equal(monthlyBirthdays([leap], new Date(2028, 1, 1))[0].date.getDate(), 29);
});

test('monthly list retains past birthdays while upcoming list excludes them', () => {
  const base = new Date(2026, 8, 15);
  const patients = [patient(9, 20), patient(10, 1), patient(9, 1)];
  assert.deepEqual(monthlyBirthdays(patients, base).map((item) => item.date.getDate()), [1, 20]);
  assert.equal(monthlyBirthdays(patients, base)[0].daysUntil, -14);
  assert.equal(upcomingBirthdays(patients, base).length, 2);
  assert.equal(birthdayLabel(0), 'Hoje');
  assert.equal(birthdayLabel(1), 'Amanhã');
  assert.equal(birthdayLabel(-1), 'Já comemorou');
});

test('demo totals match patients and response states on month and year boundaries', () => {
  for (const base of [new Date(2026, 8, 7), new Date(2026, 11, 31), new Date(2028, 1, 29)]) {
    const { patients, appointments } = createDashboardDemo(base);
    assert.deepEqual(appointmentSummary(patients, appointments), { patients: 6, today: 3, pending: 1 });
    assert.ok(appointments.every((item) => patients.some((person) => person.id === item.patientId)));
    assert.equal(new Set(appointments.map((item) => item.confirmation)).size, 3);
    assert.deepEqual(upcomingBirthdays(patients, base).slice(0, 3).map((item) => item.daysUntil), [0, 1, 5]);
  }
  assert.deepEqual(appointmentSummary([], []), { patients: 0, today: 0, pending: 0 });
});

test('fixture scenarios are disabled in production and initials handle missing names', () => {
  assert.equal(dashboardScenario('error', false), 'ready');
  assert.equal(dashboardScenario('empty', true), 'empty');
  assert.equal(dashboardScenario(['error'], true), 'ready');
  assert.equal(initials('  Ana  Beatriz  '), 'AB');
  assert.equal(initials('Ana'), 'A');
  assert.equal(initials(''), 'P');
});
