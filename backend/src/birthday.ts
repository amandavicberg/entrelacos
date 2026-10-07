export function isBirthdayInBrazil(birthDate: string, now = new Date()): boolean {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  return birthDate.slice(5, 10) === `${month}-${day}`;
}
