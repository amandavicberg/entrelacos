import assert from 'node:assert/strict';
import { test } from 'node:test';
import { professionalSummary } from '../lib/calendar.ts';

function appointment(id, startsAt, state, patientResponse) {
  return { id, relationshipId: 'relationship-1', startsAt, endsAt: startsAt,
    state, patientResponse, cancelledAt: null, cancellationReason: null };
}

test('resumo usa o mês de São Paulo e ignora pendências passadas', () => {
  const now = Date.parse('2026-10-07T12:00:00.000Z');
  const items = [
    appointment('a', '2026-10-01T02:00:00.000Z', 'cancelled', 'cancelled'), // setembro em São Paulo
    appointment('b', '2026-10-01T03:00:00.000Z', 'cancelled', 'cancelled'),
    appointment('c', '2026-11-01T02:00:00.000Z', 'scheduled', 'confirmed'), // outubro em São Paulo
    appointment('d', '2026-10-06T12:00:00.000Z', 'scheduled', 'pending'),
    appointment('e', '2026-10-08T12:00:00.000Z', 'scheduled', 'pending'),
    appointment('f', '2026-11-08T12:00:00.000Z', 'scheduled', 'pending'),
    appointment('g', '2026-10-09T12:00:00.000Z', 'cancelled', 'pending'),
  ];
  assert.deepEqual(professionalSummary(items, now), {
    cancelledThisMonth: 2,
    confirmedThisMonth: 1,
    awaitingConfirmation: 2,
  });
});
