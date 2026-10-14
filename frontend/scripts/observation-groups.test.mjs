import assert from 'node:assert/strict';
import { test } from 'node:test';
import { groupObservationsByDay, observationTime } from '../lib/calendar.ts';

function observation(id, occurredAt) {
  return { id, occurredAt, content: 'Registro de teste', visibility: 'professional', version: 1, createdAt: occurredAt };
}

test('agrupa observações pelo dia de Brasília e mantém dias e horários mais recentes primeiro', () => {
  const groups = groupObservationsByDay([
    observation('a', '2026-10-08T01:31:00.000Z'),
    observation('b', '2026-10-08T14:31:00.000Z'),
    observation('c', '2026-10-07T13:37:00.000Z'),
  ]);

  assert.deepEqual(groups.map((group) => [group.day, group.label, group.observations.map((item) => item.id)]), [
    ['2026-10-08', '8 de outubro de 2026', ['b']],
    ['2026-10-07', '7 de outubro de 2026', ['a', 'c']],
  ]);
  assert.equal(observationTime(groups[1].observations[0].occurredAt), '22:31');
});
